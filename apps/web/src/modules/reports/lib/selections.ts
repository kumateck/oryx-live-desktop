import { reportSelectNames, type ReportFieldName, type ReportFilters, type ReportOption, type ReportSelectName } from "../schemas/report-filters";
export function isReportSelect(name: ReportFieldName): name is ReportSelectName { return reportSelectNames.some((item) => item === name); }
export function reportSelection(filters: ReportFilters, name: ReportSelectName): readonly ReportOption[] {
  const selected = filters.selections[name]; const legacy = filters[name];
  return selected.length ? selected : legacy ? [legacy] : [];
}
/** Retain native single-value query parameters where possible; multiple choices are filtered explicitly. */
export function singleReportFilters(filters: ReportFilters): ReportFilters {
  const result = { ...filters };
  for (const name of reportSelectNames) {
    const selected = reportSelection(filters, name);
    result[name] = selected.length === 1 ? selected[0] ?? null : null;
  }
  return result;
}
export function selectedReportValue(filters: ReportFilters, name: ReportSelectName, value: string | number | null | undefined): boolean {
  const selected = reportSelection(filters, name);
  return !selected.length || (value != null && selected.some((option) => option.value === String(value)));
}
export function selectedReportCode(filters: ReportFilters, name: "material" | "product" | "item", code: string | null | undefined): boolean {
  const selected = reportSelection(filters, name);
  if (!selected.length) return true;
  if (selected.some((option) => !option.code)) throw new Error(`Choose the ${name} again so its code can be verified.`);
  return code != null && selected.some((option) => option.code === code);
}
