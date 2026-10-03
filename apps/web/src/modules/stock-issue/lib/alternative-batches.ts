import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const date = z.string().nullish().transform((value) => value && new Date(value).getFullYear() >= 1900 ? value : null);
const batch = z.object({ id: z.string().nullish(), batchNumber: text, expiryDate: date, uoM: z.object({ id: z.string().nullish(), symbol: text }).nullish() }).nullish();
const material = z.object({ material: z.object({ id: z.string().nullish(), name: text, code: text }).nullish(),
  currentReservedBatches: z.array(z.object({ batch, quantityToTake: amount, warehouseLocationShelfId: z.string().nullish() })).nullish(),
  alternativeBatches: z.array(z.object({ batch, quantityAvailable: amount, warehouse: z.object({ id: z.string().nullish(), name: text }).nullish(), warehouseLocationShelfId: z.string().nullish() })).nullish() });

/** For each material on a requisition: the batches set aside for it, and batches in other stores that could be used instead. */
export const alternativesSchema = z.array(material).nullish().transform((value) => (value ?? []).flatMap((entry) => {
  const id = entry.material?.id;
  if (!id) return [];
  return [{ materialId: id, materialName: entry.material?.name ?? "Unnamed material", materialCode: entry.material?.code ?? null,
    reserved: (entry.currentReservedBatches ?? []).flatMap((item) => item.batch?.id && item.warehouseLocationShelfId && item.quantityToTake > 0
      ? [{ batchId: item.batch.id, shelfId: item.warehouseLocationShelfId, number: item.batch.batchNumber, expires: item.batch.expiryDate, quantity: item.quantityToTake, unitId: item.batch.uoM?.id ?? null, unit: item.batch.uoM?.symbol ?? null }] : []),
    alternatives: (entry.alternativeBatches ?? []).flatMap((item) => item.batch?.id && item.warehouseLocationShelfId && item.warehouse?.id && item.quantityAvailable > 0
      ? [{ batchId: item.batch.id, shelfId: item.warehouseLocationShelfId, number: item.batch.batchNumber, expires: item.batch.expiryDate, available: item.quantityAvailable, storeId: item.warehouse.id, store: item.warehouse.name ?? "Unnamed store" }] : []) }];
}));
export type MaterialAlternatives = z.infer<typeof alternativesSchema>[number];

/** One batch set aside for the requisition, and the earlier-expiring batch in another store it could be swapped for. */
export interface SwapSuggestion {
  key: string;
  materialId: string;
  materialName: string;
  materialCode: string | null;
  unitId: string | null;
  unit: string | null;
  current: { batchId: string; shelfId: string; number: string | null; expires: string | null; reserved: number };
  alternative: { batchId: string; shelfId: string; number: string | null; expires: string | null; available: number; storeId: string; store: string };
  quantity: number;
  /** Less than the whole of the batch set aside is covered by this alternative. */
  partial: boolean;
}

const tiny = 1e-6;
const day = (value: string | null) => { if (!value) return null; const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? null : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime(); };
/** A swap is only worth making when the other batch expires on an earlier day. A batch without an expiry date is never earlier. */
export function expiresEarlier(alternative: string | null, current: string | null): boolean {
  const first = day(alternative);
  const second = day(current);
  return first !== null && second !== null && first < second;
}

/**
 * The swaps that could be asked for. Alternatives are taken soonest-expiring first, and each is offered only
 * up to what it holds, so the same stock is never offered twice. `committed` is how much of each batch set
 * aside is already in a swap request waiting for a decision; that much is not offered again.
 */
export function swapSuggestions(materials: readonly MaterialAlternatives[], committed: ReadonlyMap<string, number> = new Map()): SwapSuggestion[] {
  const rows: SwapSuggestion[] = [];
  const waiting = new Map(committed);
  for (const material of materials) {
    const left = material.alternatives.map((alternative) => alternative.available);
    const order = material.alternatives.map((_, index) => index).sort((a, b) => (day(material.alternatives[a]?.expires ?? null) ?? Infinity) - (day(material.alternatives[b]?.expires ?? null) ?? Infinity));
    for (const current of material.reserved) {
      const held = Math.min(current.quantity, waiting.get(current.batchId) ?? 0);
      waiting.set(current.batchId, (waiting.get(current.batchId) ?? 0) - held);
      let remaining = current.quantity - held;
      for (const index of order) {
        const alternative = material.alternatives[index];
        if (!alternative || remaining <= tiny) break;
        const free = left[index] ?? 0;
        if (free <= tiny || !expiresEarlier(alternative.expires, current.expires)) continue;
        const quantity = Math.min(remaining, free);
        rows.push({ key: `${material.materialId}|${current.batchId}|${current.shelfId}|${alternative.batchId}|${alternative.shelfId}`, materialId: material.materialId, materialName: material.materialName, materialCode: material.materialCode,
          unitId: current.unitId, unit: current.unit, current: { batchId: current.batchId, shelfId: current.shelfId, number: current.number, expires: current.expires, reserved: current.quantity },
          alternative: { batchId: alternative.batchId, shelfId: alternative.shelfId, number: alternative.number, expires: alternative.expires, available: alternative.available, storeId: alternative.storeId, store: alternative.store },
          quantity, partial: quantity < current.quantity - tiny });
        remaining -= quantity;
        left[index] = free - quantity;
      }
    }
  }
  return rows;
}

const shelfRecord = z.object({ id: z.string().nullish(), quantity: amount, uoM: z.object({ id: z.string().nullish() }).nullish(), materialBatch: z.object({ id: z.string().nullish() }).nullish(),
  warehouseLocationShelf: z.object({ id: z.string().nullish(), warehouseLocationRack: z.object({ warehouseLocation: z.object({ warehouse: z.object({ id: z.string().nullish() }).nullish() }).nullish() }).nullish() }).nullish() });
/** Where a material is on shelves right now, in every store: the records a swap request has to name. */
export const shelfRecordsSchema = z.array(shelfRecord).nullish().transform((value) => (value ?? []).flatMap((entry) => entry.id && entry.materialBatch?.id && entry.warehouseLocationShelf?.id
  ? [{ id: entry.id, batchId: entry.materialBatch.id, shelfId: entry.warehouseLocationShelf.id, quantity: entry.quantity, unitId: entry.uoM?.id ?? null, storeId: entry.warehouseLocationShelf.warehouseLocationRack?.warehouseLocation?.warehouse?.id ?? null }] : []));
export type ShelfRecord = z.infer<typeof shelfRecordsSchema>[number];

export interface SwapRequestBody {
  firstWarehouseId: string;
  secondWarehouseId: string;
  stockRequisitionId: string;
  firstSwapShelfMaterialBatches: { shelfMaterialBatchId: string; materialBatchId: string; uoMId: string; quantity: number }[];
  secondSwapShelfMaterialBatches: { shelfMaterialBatchId: string; materialBatchId: string; uoMId: string; quantity: number }[];
}

/**
 * The request for one suggestion, checked against the shelves as they are now, or the reason it cannot be asked
 * for. The server takes one batch of a material on each side of a request, so every suggestion is its own request.
 */
export function swapRequestFor(suggestion: SwapSuggestion, records: readonly ShelfRecord[], requisitionId: string): { body: SwapRequestBody } | { reason: string } {
  const find = (batchId: string, shelfId: string) => records.find((record) => record.batchId === batchId && record.shelfId === shelfId);
  const ours = find(suggestion.current.batchId, suggestion.current.shelfId);
  const theirs = find(suggestion.alternative.batchId, suggestion.alternative.shelfId);
  if (!ours?.storeId) return { reason: "The batch set aside is no longer on its shelf." };
  if (!theirs) return { reason: `The batch is no longer on its shelf in ${suggestion.alternative.store}.` };
  if (ours.quantity + tiny < suggestion.quantity) return { reason: "There is now less of the batch set aside on its shelf than the swap needs." };
  if (theirs.quantity + tiny < suggestion.quantity) return { reason: `${suggestion.alternative.store} now holds less of the batch than the swap needs.` };
  const unitId = suggestion.unitId ?? ours.unitId ?? theirs.unitId;
  if (!unitId) return { reason: "The batch has no unit of measure recorded." };
  return { body: { firstWarehouseId: ours.storeId, secondWarehouseId: suggestion.alternative.storeId, stockRequisitionId: requisitionId,
    firstSwapShelfMaterialBatches: [{ shelfMaterialBatchId: ours.id, materialBatchId: suggestion.current.batchId, uoMId: unitId, quantity: suggestion.quantity }],
    secondSwapShelfMaterialBatches: [{ shelfMaterialBatchId: theirs.id, materialBatchId: suggestion.alternative.batchId, uoMId: unitId, quantity: suggestion.quantity }] } };
}
