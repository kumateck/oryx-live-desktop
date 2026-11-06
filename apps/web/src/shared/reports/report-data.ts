import type { QuantityOrigin } from "@/shared/units/quantity";
/**
 * A quantity in the unit the server sent it in (usually the smallest of its family, such as mg).
 * Screens, print and exports show it in its largest unit; sorting uses the stored amount.
 */
export interface ReportQuantity { readonly quantity: number; readonly unit: string; readonly origin: QuantityOrigin }
export type ReportCell = string | number | boolean | null | ReportQuantity;
export interface ReportRow { id: string; cells: readonly ReportCell[] }
export interface ReportPrintColumn { label: string; fields: readonly { column: number; label?: string }[]; width?: string }
export interface ReportSheet { id?: string; name: string; columns: readonly string[]; rows: readonly ReportRow[]; printColumns?: readonly ReportPrintColumn[]; printLayout?: { orientation: "landscape"; rowHeightMm: number; signatures: readonly string[] } }
export interface ReportBook { title: string; generatedAt: string; filters: readonly { label: string; value: string }[]; sheets: readonly ReportSheet[]; warnings: readonly string[] }
export interface ReportColumn<T> { label: string; read: (row: T) => ReportCell | undefined }
/** A missing number stays missing; a real zero remains a zero in preview and export. */
export function reportSheet<T>(name: string, data: readonly T[], columns: readonly ReportColumn<T>[]): ReportSheet {
  return { name, columns: columns.map((column) => column.label), rows: data.map((row, index) => ({ id: String(index), cells: columns.map((column) => column.read(row) ?? null) })) };
}
export const reportDate = (value: string | null | undefined): string | null => {
  if (!value) return null; const date = new Date(value); if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(date);
};
/** A quantity cell. Report values from the server are calculated unless a person typed them (order quantities, master data). */
export const reportQuantity = (value: number | null | undefined, unit: string | null | undefined, origin: QuantityOrigin = "calculated"): ReportQuantity | null =>
  value == null || !Number.isFinite(value) ? null : { quantity: value, unit: unit?.trim() ?? "", origin };
export const reportEnum = (value: number | null | undefined, names: readonly string[]): string | null => value == null ? null : names[value] ?? `Unknown (${value})`;
