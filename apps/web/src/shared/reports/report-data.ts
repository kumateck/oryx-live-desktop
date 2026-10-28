export type ReportCell = string | number | boolean | null;
export interface ReportRow { id: string; cells: readonly ReportCell[] }
export interface ReportSheet { name: string; columns: readonly string[]; rows: readonly ReportRow[] }
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
export const reportEnum = (value: number | null | undefined, names: readonly string[]): string | null => value == null ? null : names[value] ?? `Unknown (${value})`;
