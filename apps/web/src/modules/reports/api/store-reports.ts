import type { ApiDispatch } from "@/shared/api/api-provider";
import { reportsApi } from "@/shared/api/generated/reports";
import { inventoryApi } from "@/shared/api/generated/inventory";
import type { ReportFilters } from "../schemas/report-filters";
import { ReportKey, reportsAudit, type ReportOutput } from "../lib/report-model";
import { binaryChoice, fourChoice } from "../lib/filter-params";
import { storeStockSheet, vendorItemsSheet } from "../lib/stores-adapters-1";
import { itemMasterSheet, vendorSummarySheet } from "../lib/master-data-adapters";
import { materialReportApi } from "./material-report-api";
import { allReportPages } from "./all-pages";
import { reportRequest } from "./request";
const options = { subscribe: false, forceRefetch: true };
export async function loadStoreReport(dispatch: ApiDispatch, key: ReportKey, f: ReportFilters, signal: AbortSignal): Promise<ReportOutput> {
  const store = fourChoice(f.store?.value); const classification = binaryChoice(f.classification?.value);
  const params = { ...reportsAudit, ...(store === undefined ? {} : { store }), ...(classification === undefined ? {} : { classification }), ...(f.item ? { itemId: f.item.value } : {}), ...(f.category ? { categoryId: f.category.value } : {}) };
  switch (key) {
    case ReportKey.StoreItems: {
      const rows = await reportRequest(dispatch(reportsApi.endpoints.getApiV1ReportItemsPerStoreType.initiate({ ...params, ...(classification === undefined ? {} : { inventoryClassification: classification }) }, options)), signal);
      return { sheets: [itemMasterSheet(rows)] };
    }
    case ReportKey.VendorItems: {
      const rows = await reportRequest(dispatch(reportsApi.endpoints.getApiV1ReportVendorItem.initiate({ ...params, ...(f.vendor ? { vendorId: f.vendor.value } : {}) }, options)), signal);
      return { sheets: [vendorItemsSheet("Vendor item mappings", rows)] };
    }
    case ReportKey.VendorSummary: {
      const rows = await reportRequest(dispatch(materialReportApi.endpoints.readVendorItemSummaryReport.initiate(params, options)), signal);
      return { sheets: [vendorSummarySheet(rows)] };
    }
    case ReportKey.StoreStock: {
      const all = await reportRequest(dispatch(reportsApi.endpoints.getApiV1ReportStockSummaryPerStoreType.initiate(reportsAudit, options)), signal);
      const scoped = store === undefined ? all : all.filter((row) => row.store === store);
      if (classification === undefined && !f.item && !f.category) return { sheets: [storeStockSheet("Store stock summary", scoped)] };
      const items = await allReportPages((page) => reportRequest(dispatch(inventoryApi.endpoints.getApiV1Items.initiate({ ...reportsAudit, page, pageSize: 100, ...(store === undefined ? {} : { store }) }, options)), signal), (row) => row.id, signal);
      const itemMap = new Map<string, typeof items>();
      for (const item of items) { const code = `${item.store}:${item.code ?? ""}`; itemMap.set(code, [...(itemMap.get(code) ?? []), item]); }
      const filtered = scoped.filter((row) => {
        const matching = itemMap.get(`${row.store}:${row.itemCode ?? ""}`);
        if (!row.itemCode || matching?.length !== 1) throw new Error("A stock summary item could not be uniquely matched to the inventory catalog. No unverified filtered export was created.");
        const item = matching[0];
        return item && (classification === undefined || item.classification === classification) && (!f.item || item.id === f.item.value) && (!f.category || item.itemCategory?.id === f.category.value);
      });
      return { sheets: [storeStockSheet("Store stock summary", filtered)] };
    }
    default: throw new Error("This report does not belong to store inventory reporting.");
  }
}
