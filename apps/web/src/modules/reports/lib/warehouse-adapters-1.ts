import type { DomainEntitiesReportsWarehouseInventoryValuationDetailDto, DomainEntitiesReportsWarehouseMaterialsStockBatchDetailDto, DomainEntitiesReportsWarehouseMaterialsStockSummaryDto } from "@/shared/api/generated/reports";
import { reportSheet, reportDate, reportEnum, reportQuantity } from "@/shared/reports/report-data";

export const materialStockSummarySheet = (name: string, rows: readonly DomainEntitiesReportsWarehouseMaterialsStockSummaryDto[]) => reportSheet(name, rows, [
  { label: "No.", read: (row) => row.no },
  { label: "Material name", read: (row) => row.materialName },
  { label: "Material code", read: (row) => row.materialCode },
  { label: "Material type", read: (row) => row.materialType },
  { label: "Production department", read: (row) => row.productionDepartment },
  { label: "Warehouse type", read: (row) => row.warehouseType },
  { label: "No of batches", read: (row) => row.noOfBatches },
  { label: "Total quantity", read: (row) => reportQuantity(row.totalQuantity, row.uom) },
]);

export const materialStockDetailSheet = (name: string, rows: readonly DomainEntitiesReportsWarehouseMaterialsStockBatchDetailDto[]) => reportSheet(name, rows, [
  { label: "No.", read: (row) => row.no },
  { label: "Material name", read: (row) => row.materialName },
  { label: "Material code", read: (row) => row.materialCode },
  { label: "Material type", read: (row) => row.materialType },
  { label: "Batch no", read: (row) => row.batchNo },
  { label: "Manufacturing date", read: (row) => reportDate(row.manufacturingDate) },
  { label: "Expiry date", read: (row) => reportDate(row.expiryDate) },
  { label: "Quantity available", read: (row) => reportQuantity(row.quantityAvailable, row.uom) },
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
  // The server sends the quantity twice (as text and as "item count"); one quantity column shows it in its largest unit.
  { label: "Quantity", read: (row) => reportQuantity(row.itemCount, row.uom) },
  { label: "Unit size", read: (row) => row.unitSize },
  // Costs stay per stored unit (per mg); the column says so, because the quantity is shown in a larger unit.
  { label: "Est unit cost (per base unit)", read: (row) => row.estUnitCostVal },
  { label: "Cost basis", read: (row) => row.uom ? `Per ${row.uom}` : row.costBasis },
  { label: "Total value", read: (row) => row.totalValue },
  { label: "Shelf location", read: (row) => row.shelfLocation },
  { label: "Expiry date", read: (row) => reportDate(row.expiryDate) },
  { label: "Days on shelf", read: (row) => row.daysOnShelf },
]);

