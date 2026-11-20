/** Which issued records to list and print: the product's department and a range of issue days (yyyy-mm-dd, inclusive). */
export interface IssuedFilters { departmentId: string; from: string; to: string }
export const noFilters: IssuedFilters = { departmentId: "", from: "", to: "" };

/** The list and register query arguments for the filters; empty ones are left out. */
export function filterArgs(filters: IssuedFilters): { departmentId?: string; issuedFrom?: string; issuedTo?: string } {
  return { ...(filters.departmentId ? { departmentId: filters.departmentId } : {}), ...(filters.from ? { issuedFrom: filters.from } : {}),
    ...(filters.to ? { issuedTo: filters.to } : {}) };
}

/** Why the filters cannot be used, or null. */
export const filterProblem = (filters: IssuedFilters) => filters.from && filters.to && filters.to < filters.from ? "The end date is before the start date." : null;

/** The filters in words, for the printed header: "Syrup · 1 Nov 2026 – 20 Nov 2026". */
export function filterSummary(filters: IssuedFilters, department: string | null, format: (value: string) => string): string {
  const range = filters.from && filters.to ? `${format(filters.from)} – ${format(filters.to)}` : filters.from ? `from ${format(filters.from)}` : filters.to ? `up to ${format(filters.to)}` : "all dates";
  return [department ?? "All departments", range].join(" · ");
}
