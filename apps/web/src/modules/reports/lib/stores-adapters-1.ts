import { stores } from "@/shared/inventory/stores";
import type { DomainEntitiesItemsStoreItemStockSummaryDto, DomainEntitiesItemsVendorStoreItemStockSummaryDto } from "@/shared/api/generated/reports";
import { reportSheet, reportDate, reportEnum, reportQuantity } from "@/shared/reports/report-data";

export const storeStockSheet = (name: string, rows: readonly DomainEntitiesItemsStoreItemStockSummaryDto[]) => reportSheet(name, rows, [
  { label: "No.", read: (row) => row.no },
  { label: "Store", read: (row) => reportEnum(row.store, stores) },
  { label: "Item name", read: (row) => row.itemName },
  { label: "Item code", read: (row) => row.itemCode },
  { label: "Category", read: (row) => row.category },
  { label: "Total quantity", read: (row) => reportQuantity(row.totalQuantity, row.unitOfMeasure) },
]);

export const vendorItemsSheet = (name: string, rows: readonly DomainEntitiesItemsVendorStoreItemStockSummaryDto[]) => reportSheet(name, rows, [
  { label: "No.", read: (row) => row.no },
  { label: "Store", read: (row) => reportEnum(row.store, stores) },
  { label: "Item name", read: (row) => row.itemName },
  { label: "Item code", read: (row) => row.itemCode },
  { label: "Category", read: (row) => row.category },
  { label: "Total quantity", read: (row) => reportQuantity(row.totalQuantity, row.unitOfMeasure) },
  { label: "Vendor name", read: (row) => row.vendorName },
  { label: "Inventory classification", read: (row) => reportEnum(row.inventoryClassification, ["Recoverable", "Non-recoverable"]) },
]);

