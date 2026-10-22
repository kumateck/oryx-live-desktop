import { useCallback } from "react";
import { identityApi } from "@/shared/api/generated/identity";
import { materialsApi } from "@/shared/api/generated/materials";
import { productsApi } from "@/shared/api/generated/products";
import { warehouseApi } from "@/shared/api/generated/warehouse";
import { procurementApi } from "@/shared/api/generated/procurement";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { salesApi } from "@/shared/api/generated/sales";
import { settingsApi } from "@/shared/api/generated/settings";
import { useApiDispatch } from "@/shared/api/use-api-dispatch";
import type { SelectPage } from "@/shared/forms/form-wizard-types";
import { reportsAudit, type ReportGroup } from "../lib/report-model";
import { binaryChoice, fourChoice } from "../lib/filter-params";
import { reportRequest } from "../api/request";
import type { ReportFilters } from "../schemas/report-filters";
export type ReportLookup = "department" | "material" | "product" | "warehouse" | "supplier" | "manufacturer" | "vendor" | "item" | "customer" | "category";
interface NamedPage { data?: { id?: string | null; name?: string | null; code?: string | null }[] | null; pageIndex?: number; pageCount?: number }
function pageOptions(result: NamedPage, page: number): SelectPage {
  return { options: (result.data ?? []).flatMap((item) => item.id && item.name ? [{ value: item.id, label: item.name }] : []), hasNext: (result.pageIndex ?? page) < (result.pageCount ?? page), hasPrevious: page > 1 };
}
export function useReportLookups(group: ReportGroup, filters: Pick<ReportFilters, "department" | "materialKind" | "store" | "division">) {
  const dispatch = useApiDispatch();
  const kind = binaryChoice(filters.materialKind?.value); const store = fourChoice(filters.store?.value); const division = binaryChoice(filters.division?.value);
  const departmentId = filters.department?.value;
  return useCallback(async (entity: ReportLookup, searchQuery: string, page: number, signal: AbortSignal): Promise<SelectPage> => {
    const args = { ...reportsAudit, page, pageSize: 30, searchQuery }; const options = { subscribe: false, forceRefetch: true };
    const request = reportRequest;
    switch (entity) {
      case "department": return pageOptions(await request(dispatch(identityApi.endpoints.getApiV1Department.initiate(args, options)), signal), page);
      case "material": {
        if (kind === undefined) {
          const rows = await request(dispatch(materialsApi.endpoints.getApiV1MaterialAll.initiate(reportsAudit, options)), signal);
          const matches = rows.filter((row) => `${row.name ?? ""} ${row.code ?? ""}`.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase()));
          return { options: matches.slice((page - 1) * 30, page * 30).flatMap((row) => row.id && row.name ? [{ value: row.id, label: row.name }] : []), hasNext: matches.length > page * 30, hasPrevious: page > 1 };
        }
        return pageOptions(await request(dispatch(materialsApi.endpoints.getApiV1Material.initiate({ ...args, kind }, options)), signal), page);
      }
      case "product": return pageOptions(await request(dispatch(productsApi.endpoints.getApiV1Product.initiate({ ...args, ...(departmentId ? { departmentId } : {}), ...(division === undefined ? {} : { division }) }, options)), signal), page);
      case "warehouse": return pageOptions(await request(dispatch(warehouseApi.endpoints.getApiV1Warehouse.initiate(args, options)), signal), page);
      case "supplier": return pageOptions(await request(dispatch(procurementApi.endpoints.getApiV1ProcurementSupplier.initiate(args, options)), signal), page);
      case "manufacturer": return pageOptions(await request(dispatch(procurementApi.endpoints.getApiV1ProcurementManufacturer.initiate(args, options)), signal), page);
      case "vendor": return pageOptions(await request(dispatch(inventoryApi.endpoints.getApiV1Vendors.initiate(args, options)), signal), page);
      case "item": return pageOptions(await request(dispatch(inventoryApi.endpoints.getApiV1Items.initiate({ ...args, ...(store === undefined ? {} : { store }) }, options)), signal), page);
      case "customer": return pageOptions(await request(dispatch(salesApi.endpoints.getApiV1Customers.initiate(args, options)), signal), page);
      case "category": {
        const itemType = group === "stores" ? "ItemCategory" : group === "finished-goods" ? "ProductCategory" : "MaterialCategory";
        const rows = await request(dispatch(settingsApi.endpoints.getApiV1CollectionByItemType.initiate({ ...reportsAudit, itemType, ...(kind === undefined ? {} : { materialKind: kind }) }, options)), signal);
        return { options: rows.flatMap((item) => item.id && item.name && item.name.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase()) ? [{ value: item.id, label: item.name }] : []), hasNext: false, hasPrevious: false };
      }
    }
  }, [dispatch, group, kind, store, division, departmentId]);
}
