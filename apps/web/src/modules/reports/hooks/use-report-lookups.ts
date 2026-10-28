import { prepareReportHistory } from "../api/report-history";
import { historyParams } from "../lib/history";
import { procurementChoices, reportDepartmentChoices, lookupPage } from "../api/lookup-choices";
import { reportSelection, singleReportFilters, selectedReportValue } from "../lib/selections";
import { useCallback } from "react";
import { materialsApi } from "@/shared/api/generated/materials";
import { productsApi } from "@/shared/api/generated/products";
import { warehouseApi } from "@/shared/api/generated/warehouse";
import { procurementApi } from "@/shared/api/generated/procurement";
import { reportsApi } from "@/shared/api/generated/reports";
import { salesApi } from "@/shared/api/generated/sales";
import { settingsApi } from "@/shared/api/generated/settings";
import { useApiDispatch } from "@/shared/api/use-api-dispatch";
import type { SelectPage } from "@/shared/forms/form-wizard-types";
import { reportsAudit, type ReportDefinition, ReportKey } from "../lib/report-model";
import { binaryChoice, fourChoice } from "../lib/filter-params";
import { reportRequest } from "../api/request";
import type { ReportFilters } from "../schemas/report-filters";
export type ReportLookup = "department" | "material" | "product" | "warehouse" | "supplier" | "manufacturer" | "vendor" | "item" | "customer" | "category";
interface NamedPage { data?: { id?: string | null; name?: string | null; code?: string | null }[] | null; pageIndex?: number; pageCount?: number }
function pageOptions(result: NamedPage, page: number): SelectPage {
  return { options: (result.data ?? []).flatMap((item) => item.id && item.name ? [{ value: item.id, label: item.code ? `${item.code} · ${item.name}` : item.name, name: item.name, ...(item.code ? { code: item.code } : {}) }] : []), hasNext: (result.pageIndex ?? page) < (result.pageCount ?? page), hasPrevious: page > 1 };
}
export function useReportLookups(definition: ReportDefinition, selections: ReportFilters) {
  const filters = singleReportFilters(selections); const group=definition.group;
  const dispatch = useApiDispatch();
  const kind = binaryChoice(filters.materialKind?.value); const store = fourChoice(filters.store?.value); const division = binaryChoice(filters.division?.value);
  const departmentId = filters.department?.value;
  return useCallback(async (entity: ReportLookup, searchQuery: string, page: number, signal: AbortSignal): Promise<SelectPage> => {
    const historical = await prepareReportHistory(dispatch, selections, signal, false);
    const args = { ...reportsAudit, ...historyParams(historical), page, pageSize: 30, searchQuery }; const options = { subscribe: false, forceRefetch: true };
    const request = reportRequest;
    if ([ReportKey.SupplierDetail,ReportKey.SupplierSummary].includes(definition.key) && (entity==="supplier"||entity==="manufacturer"||entity==="material")) return procurementChoices(dispatch,selections,entity,searchQuery,page,signal);
    switch (entity) {
      case "department": return reportDepartmentChoices(dispatch,definition,historical,searchQuery,page,signal);
      case "material": {
        if (kind === undefined) {
          const rows = await request(dispatch(materialsApi.endpoints.getApiV1MaterialAll.initiate({ ...reportsAudit, ...historyParams(historical) }, options)), signal);
          const matches = rows.filter((row) => `${row.name ?? ""} ${row.code ?? ""}`.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase()));
          return lookupPage(matches,searchQuery,page);
        }
        return pageOptions(await request(dispatch(materialsApi.endpoints.getApiV1Material.initiate({ ...args, kind }, options)), signal), page);
      }
      case "product": return pageOptions(await request(dispatch(productsApi.endpoints.getApiV1Product.initiate({ ...args, ...(departmentId ? { departmentId } : {}), ...(division === undefined ? {} : { division }) }, options)), signal), page);
      case "warehouse": {
        const types: (0|1|2)[]=group==="warehouse"?[0,1]:[2];
        const rows=(await Promise.all(types.filter((type)=>selectedReportValue(selections,"warehouseType",type)).map((type)=>request(dispatch(warehouseApi.endpoints.getApiV1Warehouse.initiate({...args,type},options)),signal))));
        return {options:rows.flatMap((result)=>pageOptions(result,page).options),hasNext:rows.some((result)=>(result.pageIndex??page)<(result.pageCount??page)),hasPrevious:page>1};
      }
      case "supplier": return pageOptions(await request(dispatch(procurementApi.endpoints.getApiV1ProcurementSupplier.initiate(args, options)), signal), page);
      case "manufacturer": return pageOptions(await request(dispatch(procurementApi.endpoints.getApiV1ProcurementManufacturer.initiate(args, options)), signal), page);
      case "vendor": return lookupPage(await request(dispatch(reportsApi.endpoints.getApiV1ReportHistoryVendors.initiate({ ...reportsAudit, ...historyParams(historical) }, options)), signal), searchQuery, page);
      case "item": return lookupPage(await request(dispatch(reportsApi.endpoints.getApiV1ReportItemsPerStoreType.initiate({ ...reportsAudit, ...historyParams(historical), ...(store === undefined ? {} : { store }) }, options)), signal), searchQuery, page);
      case "customer": return pageOptions(await request(dispatch(salesApi.endpoints.getApiV1Customers.initiate(args, options)), signal), page);
      case "category": {
        const itemType = group === "stores" ? "ItemCategory" : group === "finished-goods" ? "ProductCategory" : "MaterialCategory";
        const rows = await request(dispatch(settingsApi.endpoints.getApiV1CollectionByItemType.initiate({ ...reportsAudit, ...historyParams(historical), itemType, ...(kind === undefined ? {} : { materialKind: kind }) }, options)), signal);
        return { options: rows.flatMap((item) => item.id && item.name && item.name.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase()) ? [{ value: item.id, label: item.name }] : []), hasNext: false, hasPrevious: false };
      }
    }
  }, [dispatch, definition, selections, group, kind, store, division, departmentId]);
}
