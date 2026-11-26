import { convertWithDensity } from "@/shared/units/quantity";
import { missingStockLocation } from "@/shared/warehouse/stock-location";

/** One batch set aside for a requisition line, as the store reads it. */
export interface SetAsideBatch {
  key: string; number: string | null; arNumber?: string | null; quantity: number; expires: string | null; returned: boolean;
  /** The batch's own unit, which its quantity is in; the line's unit when not sent. */
  unit?: string | null;
  location?: string | null; rack?: string | null; shelf?: string | null; containerSize?: number | null;
}

/** Where a batch is picked from, read as a place: "G/01 · Shelf G/01/A". */
export function batchPlace(batch: Pick<SetAsideBatch, "location" | "rack" | "shelf">): string {
  const rack = batch.rack?.trim();
  const shelf = batch.shelf?.trim();
  if (rack || shelf) return `${rack || "Rack not recorded"} · ${!shelf ? "Shelf not recorded" : /^shelf\b/i.test(shelf) ? shelf : `Shelf ${shelf}`}`;
  return batch.location?.trim() || missingStockLocation;
}

const expiryTime = (value: string | null) => { const time = value ? new Date(value).getTime() : Number.NaN; return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time; };

/** When a line's batches are kept in another unit than the line asks in: that unit, what they hold in it, the requirement in it, and the density used. */
export interface BatchUnitConversion { unit: string; total: number; required: number; density: number | null }

/**
 * A line's batches in picking order, soonest expiry first (undated last, otherwise as set aside), with what they add up to
 * and how much of the required quantity is not covered. Totals and shortfall are in the line's unit; batches kept in another
 * unit (a liquid asked for in ml but stocked in mg) are converted with the material's density, and `conversion` says how.
 */
export function batchLines<TBatch extends SetAsideBatch>(line: { quantity: number; unit?: string | null; density?: number | null; issuedQuantity?: number | null; issued?: boolean; batches: readonly TBatch[] }) {
  const batches = line.batches.map((batch, position) => ({ batch, position }))
    .sort((a, b) => expiryTime(a.batch.expires) - expiryTime(b.batch.expires) || a.position - b.position).map((entry) => entry.batch);
  const inLineUnit = (batch: TBatch) => !batch.unit || !line.unit ? batch.quantity : convertWithDensity(batch.quantity, batch.unit, line.unit, line.density) ?? batch.quantity;
  const total = batches.reduce((sum, batch) => sum + inLineUnit(batch), 0);
  // Once issued, a packaging line a supervisor set over or under holds that quantity; before, the batches hold the requirement.
  const target = line.issued ? line.issuedQuantity ?? line.quantity : line.quantity;
  const short = target - total > 1e-6 ? target - total : 0;
  const conversion = unitConversion(batches, line.unit, line.density, target);
  // A total line is worth printing when several batches add up, when they fall short, or when it shows the unit conversion.
  return { batches, total, short, conversion, totalLine: batches.length > 1 || (batches.length > 0 && (short > 0 || conversion !== null)) };
}

function unitConversion(batches: readonly SetAsideBatch[], lineUnit: string | null | undefined, density: number | null | undefined, target: number): BatchUnitConversion | null {
  const unit = batches[0]?.unit?.trim();
  if (!unit || !lineUnit || batches.some((batch) => batch.unit?.trim() !== unit) || unit.toLowerCase() === lineUnit.trim().toLowerCase()) return null;
  const required = convertWithDensity(target, lineUnit, unit, density);
  if (required === null) return null;
  // The density matters only when the units cross between mass and volume.
  const crossing = convertWithDensity(1, lineUnit, unit, null) === null;
  return { unit, total: batches.reduce((sum, batch) => sum + batch.quantity, 0), required, density: crossing ? density ?? null : null };
}
