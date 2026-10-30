import { canCount, fgCount, yieldOf, type FgLayout } from "@/shared/packing/fg-quantity";
import type { DomainEntitiesMaterialsBatchCreateFinishedGoodsTransferNoteRequest as TransferRequest } from "@/shared/api/generated/production";
import type { TransferBatchRecord, TransferNote } from "../schemas/finished-goods-schema";

/** What has been packed, what has already been sent to the finished goods store, and what is left to send. All yield (base units). */
export function transferTotals(packed: number, notes: readonly Pick<TransferNote, "quantity">[]) {
  const transferred = notes.reduce((sum, note) => sum + note.quantity, 0);
  return { packed, transferred, remaining: Math.max(packed - transferred, 0) };
}

/**
 * The yield to send for the shippers and loose packs entered. Entering exactly what is left sends all of it,
 * including any units that do not fill a pack, so a batch can always be sent in full.
 */
export function transferYield(shippers: number, loose: number, remaining: number, layout: FgLayout): number | null {
  const left = fgCount(remaining, layout);
  const clean = (value: number) => Number.isFinite(value) && value > 0 ? value : 0;
  if (left && clean(shippers) === left.shippers && clean(loose) === left.loose) return remaining;
  return yieldOf(shippers, loose, layout);
}

/** Why a transfer cannot be raised, or null when it can. */
export function transferProblem(input: { record: TransferBatchRecord | null; packed: number | null; remaining: number }): string | null {
  if (!input.record) return "The batch has no batch manufacturing record.";
  if (input.packed === null) return "Final packing has not been recorded for this batch, so there is nothing to transfer yet.";
  if (!input.record.packing) return "The batch has no packing style, so its packs cannot be counted.";
  if (!input.record.packing.unit) return "The batch's packing style has no unit of measure. Set it on the product's packing style.";
  if (!canCount(input.record.packing.layout)) return "The batch's packing style does not say how many units fill a pack, so shippers and loose packs cannot be counted. Complete it on the product.";
  if (input.remaining <= 0) return "Everything packed has already been transferred.";
  return null;
}

/** A note number from the moment it is raised. The server has no numbering rule for transfer notes, and this keeps them unique and in order. */
export function transferNoteNumber(now = new Date()): string {
  return `FGTN-${now.toISOString().replace(/\D/g, "").slice(0, 17)}`;
}

/** The note as the server stores it: the quantity is yield, and quantity per pack is the base units in one pack. */
export function transferRequest(input: { quantity: number; record: TransferBatchRecord; stepId: string; totals: ReturnType<typeof transferTotals>; now?: Date }): TransferRequest | null {
  const packing = input.record.packing;
  if (!packing?.unit || !canCount(packing.layout)) return null;
  return {
    transferNoteNumber: transferNoteNumber(input.now), batchManufacturingRecordId: input.record.id, productPackingId: packing.id, productionActivityStepId: input.stepId,
    quantityPerPack: packing.layout.baseUnitsPerPack ?? 0, totalQuantity: input.quantity, uoMId: packing.unit.id,
    // The server takes a full transfer only as the first note and only for everything packed; anything else is a partial one.
    isPartial: input.totals.transferred > 0 || input.quantity < input.totals.packed,
  };
}
