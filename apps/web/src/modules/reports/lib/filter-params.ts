import type { ReportFilters } from "../schemas/report-filters";
export const binaryChoice = (value: string | undefined): 0 | 1 | undefined => value === "0" ? 0 : value === "1" ? 1 : undefined;
export const ternaryChoice = (value: string | undefined): 0 | 1 | 2 | undefined => value === "2" ? 2 : binaryChoice(value);
export const fourChoice = (value: string | undefined): 0 | 1 | 2 | 3 | undefined => value === "3" ? 3 : ternaryChoice(value);
export function reportBoundary(date: Date, end = false): string {
  const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return `${day}T${end ? "23:59:59.999" : "00:00:00.000"}Z`;
}
export const periodParams = (filters: ReportFilters) => ({ ...(filters.startDate ? { startDate: reportBoundary(filters.startDate) } : {}), ...(filters.endDate ? { endDate: reportBoundary(filters.endDate, true) } : {}) });
export const expiryParams = (filters: ReportFilters) => ({ ...(filters.expiryDateFrom ? { expiryDateFrom: reportBoundary(filters.expiryDateFrom) } : {}), ...(filters.expiryDateTo ? { expiryDateTo: reportBoundary(filters.expiryDateTo, true) } : {}) });
export const departmentParam = (filters: ReportFilters) => filters.department ? { departmentId: filters.department.value } : {};
export const productWarehouseParams = (filters: ReportFilters) => ({ ...(filters.product ? { productId: filters.product.value } : {}), ...(filters.warehouse ? { warehouseId: filters.warehouse.value } : {}) });
