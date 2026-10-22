import type { DomainEntitiesReportsWarehouseInventoryValuationDetailDto, DomainEntitiesReportsWarehouseMaterialsStockBatchDetailDto, DomainEntitiesReportsWarehouseMaterialsStockSummaryDto } from "@/shared/api/generated/reports";
import { reportSheet, reportDate, reportEnum } from "@/shared/reports/report-data";

export const materialStockSummarySheet = (name: string, rows: readonly DomainEntitiesReportsWarehouseMaterialsStockSummaryDto[]) => reportSheet(name, rows, [
  { label: "No.", read: (row) => row.no },
  { label: "Material name", read: (row) => row.materialName },
  { label: "Material code", read: (row) => row.materialCode },
  { label: "Material type", read: (row) => row.materialType },
  { label: "Production department", read: (row) => row.productionDepartment },
  { label: "Warehouse type", read: (row) => row.warehouseType },
  { label: "No of batches", read: (row) => row.noOfBatches },
  { label: "Total quantity", read: (row) => row.totalQuantity },
  { label: "Unit", read: (row) => row.uom },
]);

export const materialStockDetailSheet = (name: string, rows: readonly DomainEntitiesReportsWarehouseMaterialsStockBatchDetailDto[]) => reportSheet(name, rows, [
  { label: "No.", read: (row) => row.no },
  { label: "Material name", read: (row) => row.materialName },
  { label: "Material code", read: (row) => row.materialCode },
  { label: "Material type", read: (row) => row.materialType },
  { label: "Batch no", read: (row) => row.batchNo },
  { label: "Manufacturing date", read: (row) => reportDate(row.manufacturingDate) },
  { label: "Expiry date", read: (row) => reportDate(row.expiryDate) },
  { label: "Quantity available", read: (row) => row.quantityAvailable },
  { label: "Unit", read: (row) => row.uom },
  { label: "Production department", read: (row) => row.productionDepartment },
  { label: "Warehouse type", read: (row) => row.warehouseType },
  { label: "Storage location", read: (row) => row.storageLocation },
]);

export const inventoryValuationSheet = (name: string, rows: readonly DomainEntitiesReportsWarehouseInventoryValuationDetailDto[]) => reportSheet(name, rows, [
  { label: "No.", read: (row) => row.no },
  { label: "Warehouse type", read: (row) => row.warehouseType },
  { label: "Division", read: (row) => row.division },
  { label: "Warehouse", read: (row) => row.warehouse },
  { label: "Material item", read: (row) => row.materialItem },
  { label: "Code", read: (row) => row.code },
  { label: "Batch no", read: (row) => row.batchNo },
  { label: "Valuation type", read: (row) => row.valuationType },
  { label: "Unit", read: (row) => row.uom },
  { label: "Quantity / UOM", read: (row) => row.quantityUOM },
  { label: "Unit size", read: (row) => row.unitSize },
  { label: "Item count", read: (row) => row.itemCount },
  { label: "Est unit cost val", read: (row) => row.estUnitCostVal },
  { label: "Cost basis", read: (row) => row.costBasis },
  { label: "Total value", read: (row) => row.totalValue },
  { label: "Shelf location", read: (row) => row.shelfLocation },
  { label: "Expiry date", read: (row) => reportDate(row.expiryDate) },
  { label: "Days on shelf", read: (row) => row.daysOnShelf },
]);

