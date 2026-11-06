import { formatQuantityNumber, smallestUnit, toLargestUnit, toSmallestUnit } from "@/shared/units/quantity";
import type { ReportCell, ReportQuantity } from "./report-data";

export const isReportQuantity = (cell: ReportCell | undefined): cell is ReportQuantity => typeof cell === "object" && cell !== null;

/** The quantity as shown on screen, in print and in CSV: its largest unit, such as "100 kg". */
export function reportQuantityText(cell: ReportQuantity): string {
  return toLargestUnit(cell.quantity, cell.unit, cell.origin)?.text ?? String(cell.quantity);
}

/**
 * The quantity as an Excel cell: the number in its largest unit, formatted to show exactly what the
 * screen shows ("100 kg") while staying a number. An amount too small to show stays text ("< 0.0001 g").
 */
export function reportQuantityExcel(cell: ReportQuantity): { value: number | string; numFmt?: string } {
  const shown = toLargestUnit(cell.quantity, cell.unit, cell.origin);
  if (!shown) return { value: cell.quantity };
  const number = formatQuantityNumber(shown.value, cell.origin);
  if (!/^-?[\d,]+(\.\d+)?$/.test(number)) return { value: shown.text };
  const decimals = number.split(".")[1]?.length ?? 0;
  const unit = shown.unit.replaceAll('"', "");
  return { value: shown.value, numFmt: `#,##0${decimals ? `.${"0".repeat(decimals)}` : ""}${unit ? ` "${unit}"` : ""}` };
}

const order = (cell: ReportCell | undefined): number => cell == null ? 0 : isReportQuantity(cell) ? 1 : typeof cell === "number" ? 2 : typeof cell === "boolean" ? 3 : 4;
const text = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

/**
 * Orders report cells by their underlying value: quantities by their stored amount within the same
 * unit family (mass, volume, or one counted unit), numbers numerically and text naturally. Empty cells come first.
 */
export function compareReportCells(a: ReportCell | undefined, b: ReportCell | undefined): number {
  const kind = order(a) - order(b);
  if (kind !== 0 || a == null || b == null) return kind;
  if (isReportQuantity(a) && isReportQuantity(b)) {
    // Different families are grouped by their stored unit (mg, ml, pcs), never compared by amount.
    const family = text.compare(smallestUnit(a.unit), smallestUnit(b.unit));
    return family !== 0 ? family : toSmallestUnit(a.quantity, a.unit) - toSmallestUnit(b.quantity, b.unit);
  }
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  return text.compare(String(a), String(b));
}

