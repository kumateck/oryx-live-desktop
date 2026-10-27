import { historyParams } from "../lib/history";
import { singleReportFilters, reportSelection, selectedReportValue, selectedReportCode } from "../lib/selections";
import type { ApiDispatch } from "@/shared/api/api-provider";
import { reportsApi } from "@/shared/api/generated/reports";
import type { ReportFilters } from "../schemas/report-filters";
import { ReportKey, reportsAudit, type ReportOutput } from "../lib/report-model";
import { binaryChoice, fourChoice, departmentParam, expiryParams } from "../lib/filter-params";
import { materialStockSummarySheet, materialStockDetailSheet, inventoryValuationSheet } from "../lib/warehouse-adapters-1";
import { materialMasterSheet } from "../lib/master-data-adapters";
import { materialReportApi } from "./material-report-api";
import { reportRequest } from "./request";
const options = { subscribe: false, forceRefetch: true };
export async function loadWarehouseReport(dispatch: ApiDispatch, key: ReportKey, filters: ReportFilters, signal: AbortSignal): Promise<ReportOutput> {
  const f = singleReportFilters(filters);
  const materialKind = binaryChoice(f.materialKind?.value);
  const scope = { ...reportsAudit, ...historyParams(filters), ...departmentParam(f), ...(materialKind === undefined ? {} : { materialKind }) };
  switch (key) {
    case ReportKey.MaterialList: {
      const rows = await reportRequest(dispatch(materialReportApi.endpoints.readApprovedMaterialReport.initiate({ ...reportsAudit, ...historyParams(filters), ...departmentParam(f), ...(materialKind === undefined ? {} : { kind: materialKind }), ...(f.category ? { materialCategoryId: f.category.value } : {}) }, options)), signal);
      return { sheets: [materialMasterSheet(rows.filter((row)=>selectedReportValue(filters,"category",row.material?.materialCategory?.id)))] };
    }
    case ReportKey.MaterialStockSummary: {
      const rows = await reportRequest(dispatch(reportsApi.endpoints.getApiV1ReportWarehouseMaterialsStockSummary.initiate({ ...scope, ...(f.material ? { materialId: f.material.value } : {}) }, options)), signal);
      return { sheets: [materialStockSummarySheet("Material stock summary", rows.filter((row)=>(row.warehouseType==="Raw Warehouse"||row.warehouseType==="Packaging Warehouse")&&(reportSelection(filters,"material").length<2||selectedReportCode(filters,"material",row.materialCode))))] };
    }
    case ReportKey.MaterialStockDetail: {
      const rows = await reportRequest(dispatch(reportsApi.endpoints.getApiV1ReportWarehouseMaterialsStockBatchDetail.initiate({ ...scope, ...expiryParams(f), ...(f.material ? { materialId: f.material.value } : {}), ...(f.batchNumber ? { batchNumber: f.batchNumber } : {}) }, options)), signal);
      return { sheets: [materialStockDetailSheet("Material stock details", rows.filter((row) => row.warehouseType === "Raw Warehouse" || row.warehouseType === "Packaging Warehouse"))] };
    }
    case ReportKey.InventoryValuation: {
      const division = binaryChoice(f.division?.value); const warehouseType = fourChoice(f.warehouseType?.value);
      const rows = await reportRequest(dispatch(reportsApi.endpoints.getApiV1ReportWarehouseInventoryValuationDetail.initiate({ ...reportsAudit, ...historyParams(filters), ...departmentParam(f), ...expiryParams(f),
        ...(division === undefined ? {} : { division }), ...(warehouseType === undefined ? {} : { warehouseType }), ...(f.warehouse ? { warehouseId: f.warehouse.value } : {}), ...(f.material ? { materialId: f.material.value } : {}), ...(f.valuationType ? { valuationType: f.valuationType.value } : {}),
      }, options)), signal);
      return { sheets: [inventoryValuationSheet("Inventory valuation", rows.filter((row)=>(row.warehouseType==="RawMaterialStorage"||row.warehouseType==="PackagedStorage")&&selectedReportValue(filters,"warehouseType",row.warehouseType==="RawMaterialStorage"?0:1)&&(reportSelection(filters,"material").length<2||selectedReportCode(filters,"material",row.code))))] };
    }
    default: throw new Error("This report does not belong to warehouse reporting.");
  }
}
