import { missingStockLocation } from "@/shared/warehouse/stock-location";

/** One batch set aside for a requisition line, as the store reads it. */
export interface SetAsideBatch {
  key: string; number: string | null; arNumber?: string | null; quantity: number; expires: string | null; returned: boolean;
  location?: string | null; rack?: string | null; shelf?: string | null;
}

/** Where a batch is picked from, read as a place: "G/01 · Shelf G/01/A". */
export function batchPlace(batch: Pick<SetAsideBatch, "location" | "rack" | "shelf">): string {
  const rack = batch.rack?.trim();
  const shelf = batch.shelf?.trim();
  if (rack || shelf) return `${rack || "Rack not recorded"} · ${!shelf ? "Shelf not recorded" : /^shelf\b/i.test(shelf) ? shelf : `Shelf ${shelf}`}`;
  return batch.location?.trim() || missingStockLocation;
}

const expiryTime = (value: string | null) => { const time = value ? new Date(value).getTime() : Number.NaN; return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time; };

/**
 * A line's batches in picking order, soonest expiry first (undated last, otherwise as set aside), with what they add up to
 * and how much of the required quantity is not covered.
 */
export function batchLines<TBatch extends SetAsideBatch>(line: { quantity: number; batches: readonly TBatch[] }) {
  const batches = line.batches.map((batch, position) => ({ batch, position }))
    .sort((a, b) => expiryTime(a.batch.expires) - expiryTime(b.batch.expires) || a.position - b.position).map((entry) => entry.batch);
  const total = batches.reduce((sum, batch) => sum + batch.quantity, 0);
  const short = line.quantity - total > 1e-6 ? line.quantity - total : 0;
  // A total line is worth printing when several batches add up, or when they fall short.
  return { batches, total, short, totalLine: batches.length > 1 || (batches.length > 0 && short > 0) };
}
