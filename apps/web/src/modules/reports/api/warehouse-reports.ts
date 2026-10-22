import type { ApiDispatch } from "@/shared/api/api-provider";
import { reportsApi } from "@/shared/api/generated/reports";
import { materialsApi } from "@/shared/api/generated/materials";
import type { ReportFilters } from "../schemas/report-filters";
import { ReportKey, reportsAudit, type ReportOutput } from "../lib/report-model";
import { binaryChoice, fourChoice, departmentParam, expiryParams } from "../lib/filter-params";
import { materialStockSummarySheet, materialStockDetailSheet, inventoryValuationSheet } from "../lib/warehouse-adapters-1";
import { materialMasterSheet } from "../lib/master-data-adapters";
import { materialReportApi } from "./material-report-api";
import { reportRequest } from "./request";
const options = { subscribe: false, forceRefetch: true };
export async function loadWarehouseReport(dispatch: ApiDispatch, key: ReportKey, f: ReportFilters, signal: AbortSignal): Promise<ReportOutput> {
  const materialKind = binaryChoice(f.materialKind?.value);
  const scope = { ...reportsAudit, ...departmentParam(f), ...(materialKind === undefined ? {} : { materialKind }) };
  switch (key) {
    case ReportKey.MaterialList: {
      const rows = await reportRequest(dispatch(materialReportApi.endpoints.readApprovedMaterialReport.initiate({ ...reportsAudit, ...departmentParam(f), ...(materialKind === undefined ? {} : { kind: materialKind }), ...(f.category ? { materialCategoryId: f.category.value } : {}) }, options)), signal);
      return { sheets: [materialMasterSheet(rows)] };
    }
    case ReportKey.MaterialStockSummary: {
      const rows = await reportRequest(dispatch(reportsApi.endpoints.getApiV1ReportWarehouseMaterialsStockSummary.initiate({ ...scope, ...(f.material ? { materialId: f.material.value } : {}) }, options)), signal);
      return { sheets: [materialStockSummarySheet("Material stock summary", rows)] };
    }
    case ReportKey.MaterialStockDetail: {
      const rows = await reportRequest(dispatch(reportsApi.endpoints.getApiV1ReportWarehouseMaterialsStockBatchDetail.initiate({ ...scope, ...expiryParams(f), ...(f.batchNumber ? { batchNumber: f.batchNumber } : {}) }, options)), signal);
      if (!f.material) return { sheets: [materialStockDetailSheet("Material stock details", rows)] };
      const material = await reportRequest(dispatch(materialsApi.endpoints.getApiV1MaterialByMaterialId.initiate({ ...reportsAudit, materialId: f.material.value }, options)), signal);
      if (!material.id || !material.code) throw new Error("The selected material identity/code could not be verified; its filter was not ignored.");
      return { sheets: [materialStockDetailSheet("Material stock details", rows.filter((row) => row.materialCode === material.code))] };
    }
    case ReportKey.InventoryValuation: {
      const division = binaryChoice(f.division?.value); const warehouseType = fourChoice(f.warehouseType?.value);
      const rows = await reportRequest(dispatch(reportsApi.endpoints.getApiV1ReportWarehouseInventoryValuationDetail.initiate({ ...reportsAudit, ...departmentParam(f), ...expiryParams(f),
        ...(division === undefined ? {} : { division }), ...(warehouseType === undefined ? {} : { warehouseType }), ...(f.warehouse ? { warehouseId: f.warehouse.value } : {}), ...(f.material ? { materialId: f.material.value } : {}), ...(f.valuationType ? { valuationType: f.valuationType.value } : {}),
      }, options)), signal);
      return { sheets: [inventoryValuationSheet("Inventory valuation", rows)] };
    }
    default: throw new Error("This report does not belong to warehouse reporting.");
  }
}
