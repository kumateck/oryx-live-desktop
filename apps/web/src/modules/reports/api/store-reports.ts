import { historyParams } from "../lib/history";
import { filterStoreSelection } from "./store-selection";
import { singleReportFilters, selectedReportValue } from "../lib/selections";
import type { ApiDispatch } from "@/shared/api/api-provider";
import { reportsApi } from "@/shared/api/generated/reports";
import type { ReportFilters } from "../schemas/report-filters";
import { ReportKey, reportsAudit, type ReportOutput } from "../lib/report-model";
import { binaryChoice, fourChoice } from "../lib/filter-params";
import { storeStockSheet, vendorItemsSheet } from "../lib/stores-adapters-1";
import { itemMasterSheet, vendorSummarySheet } from "../lib/master-data-adapters";
import { materialReportApi } from "./material-report-api";
import { reportRequest } from "./request";
const options = { subscribe: false, forceRefetch: true };
export async function loadStoreReport(dispatch: ApiDispatch, key: ReportKey, filters: ReportFilters, signal: AbortSignal): Promise<ReportOutput> {
  const f = singleReportFilters(filters);
  const store = fourChoice(f.store?.value); const classification = binaryChoice(f.classification?.value);
  const params = { ...reportsAudit, ...historyParams(filters), ...(store === undefined ? {} : { store }), ...(classification === undefined ? {} : { classification }), ...(f.item ? { itemId: f.item.value } : {}), ...(f.category ? { categoryId: f.category.value } : {}) };
  switch (key) {
    case ReportKey.StoreItems: {
      const rows = await reportRequest(dispatch(reportsApi.endpoints.getApiV1ReportItemsPerStoreType.initiate({ ...params, ...(classification === undefined ? {} : { inventoryClassification: classification }) }, options)), signal);
      return { sheets: [itemMasterSheet(rows.filter((row)=>selectedReportValue(filters,"store",row.store)&&selectedReportValue(filters,"item",row.id)&&selectedReportValue(filters,"category",row.itemCategory?.id)&&selectedReportValue(filters,"classification",row.classification)))] };
    }
    case ReportKey.VendorItems: {
      const rows = await reportRequest(dispatch(reportsApi.endpoints.getApiV1ReportVendorItem.initiate({ ...params, ...(f.vendor ? { vendorId: f.vendor.value } : {}) }, options)), signal);
      return { sheets: [vendorItemsSheet("Vendor item mappings", await filterStoreSelection(dispatch,rows,filters,signal))] };
    }
    case ReportKey.VendorSummary: {
      const rows = await reportRequest(dispatch(materialReportApi.endpoints.readVendorItemSummaryReport.initiate(params, options)), signal);
      return { sheets: [vendorSummarySheet(await filterStoreSelection(dispatch,rows,filters,signal))] };
    }
    case ReportKey.StoreStock: {
      const all = await reportRequest(dispatch(reportsApi.endpoints.getApiV1ReportStockSummaryPerStoreType.initiate({ ...reportsAudit, ...historyParams(filters) }, options)), signal);
      return {sheets:[storeStockSheet("Store stock summary",await filterStoreSelection(dispatch,all,filters,signal))]};
    }
    default: throw new Error("This report does not belong to store inventory reporting.");
  }
}
