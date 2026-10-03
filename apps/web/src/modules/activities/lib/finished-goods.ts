import type { DomainEntitiesMaterialsBatchCreateFinishedGoodsTransferNoteRequest as TransferRequest } from "@/shared/api/generated/production";
import type { TransferBatchRecord, TransferNote } from "../schemas/finished-goods-schema";

/** What has been packed, what has already been sent to the finished goods store, and what is left to send. */
export function transferTotals(packed: number, notes: readonly Pick<TransferNote, "quantity">[]) {
  const transferred = notes.reduce((sum, note) => sum + note.quantity, 0);
  return { packed, transferred, remaining: Math.max(packed - transferred, 0) };
}

/** A quantity of packs as full shippers and the loose packs left over. Null when the packing style does not say how many packs fill a shipper. */
export function shipperBreakdown(quantity: number, packsPerShipper: number | null): { shippers: number; loose: number } | null {
  if (!packsPerShipper || !(quantity >= 0)) return null;
  return { shippers: Math.floor(quantity / packsPerShipper), loose: quantity % packsPerShipper };
}

/** Why a transfer cannot be raised, or null when it can. */
export function transferProblem(input: { record: TransferBatchRecord | null; packed: number | null; remaining: number }): string | null {
  if (!input.record) return "The batch has no batch manufacturing record.";
  if (input.packed === null) return "Final packing has not been recorded for this batch, so there is nothing to transfer yet.";
  if (!input.record.packing) return "The batch has no packing style, so its packs cannot be counted.";
  if (!input.record.packing.unit) return "The batch's packing style has no unit of measure. Set it on the product's packing style.";
  if (input.remaining <= 0) return "Everything packed has already been transferred.";
  return null;
}

/** A note number from the moment it is raised. The server has no numbering rule for transfer notes, and this keeps them unique and in order. */
export function transferNoteNumber(now = new Date()): string {
  return `FGTN-${now.toISOString().replace(/\D/g, "").slice(0, 17)}`;
}

export function transferRequest(input: { quantity: number; record: TransferBatchRecord; stepId: string; totals: ReturnType<typeof transferTotals>; yieldPacked: number; now?: Date }): TransferRequest | null {
  const packing = input.record.packing;
  if (!packing?.unit) return null;
  return {
    transferNoteNumber: transferNoteNumber(input.now), batchManufacturingRecordId: input.record.id, productPackingId: packing.id, productionActivityStepId: input.stepId,
    quantityPerPack: input.yieldPacked, totalQuantity: input.quantity, uoMId: packing.unit.id,
    // The server takes a full transfer only as the first note and only for everything packed; anything else is a partial one.
    isPartial: input.totals.transferred > 0 || input.quantity < input.totals.packed,
  };
}
