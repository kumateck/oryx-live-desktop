import { stores } from "@/shared/inventory/stores";
import type { DomainEntitiesProductsProductListDto } from "@/shared/api/generated/products";
import type { DomainEntitiesItemsItemDto } from "@/shared/api/generated/inventory";
import { richTextToPlain } from "@/shared/rich-text/rich-text-view";
import { reportSheet, reportDate, reportEnum, reportQuantity } from "@/shared/reports/report-data";
import type { ApprovedMaterialRow, VendorSummaryRow } from "../api/material-report-api";
const unitOf = (unit: { symbol?: string | null | undefined; name?: string | null | undefined } | null | undefined) => unit?.symbol ?? unit?.name;
export const materialMasterSheet = (rows: readonly ApprovedMaterialRow[]) => reportSheet("Approved materials", rows, [
  { label: "Material code", read: (row) => row.material?.code }, { label: "Material", read: (row) => row.material?.name }, { label: "Material type", read: (row) => reportEnum(row.material?.kind, ["Raw material", "Packaging material"]) },
  { label: "Category", read: (row) => row.material?.materialCategory?.name },
  { label: "Available quantity", read: (row) => reportQuantity(row.totalAvailableQuantity, unitOf(row.unitOfMeasure)) },
  { label: "Reserved quantity", read: (row) => reportQuantity(row.reservedQuantity, unitOf(row.unitOfMeasure)) },
]);
export const productMasterSheet = (rows: readonly DomainEntitiesProductsProductListDto[]) => reportSheet("Products", rows, [
  { label: "Product", read: (row) => row.name }, { label: "Code", read: (row) => row.code }, { label: "Division", read: (row) => reportEnum(row.division, ["Betalactam", "Non-betalactam"]) },
  { label: "Category", read: (row) => row.category?.name }, { label: "Department", read: (row) => row.department?.name }, { label: "Generic name", read: (row) => row.genericName },
  { label: "Description", read: (row) => row.description ? richTextToPlain(row.description) : null }, { label: "Storage condition", read: (row) => row.storageCondition }, { label: "Package style", read: (row) => row.packageStyle },
  { label: "Filled weight", read: (row) => row.filledWeight }, { label: "Shelf life", read: (row) => row.shelfLife }, { label: "Action / use", read: (row) => row.actionUse },
  { label: "FDA registration", read: (row) => row.fdaRegistrationNumber }, { label: "Master formula number", read: (row) => row.masterFormulaNumber },
  { label: "Primary packaging", read: (row) => row.primaryPackDescription }, { label: "Secondary packaging", read: (row) => row.secondaryPackDescription }, { label: "Tertiary packaging", read: (row) => row.tertiaryPackDescription },
  // Both sizes are kept in the product's base unit and were typed by a person, so every decimal stays.
  { label: "Base quantity", read: (row) => reportQuantity(row.baseQuantity, unitOf(row.baseUoM), "entered") },
  { label: "Full batch size", read: (row) => reportQuantity(row.fullBatchSize, unitOf(row.baseUoM), "entered") },
  { label: "Equipment", read: (row) => row.equipment?.name }, { label: "Price", read: (row) => row.price }, { label: "Price unit", read: (row) => row.priceUoM },
  { label: "Label claim", read: (row) => row.labelClaim }, { label: "Verified", read: (row) => row.isVerified }, { label: "Document number", read: (row) => row.documentNumber },
  { label: "Revision", read: (row) => row.revisionNumber }, { label: "Created", read: (row) => reportDate(row.createdAt) },
]);
export const itemMasterSheet = (rows: readonly DomainEntitiesItemsItemDto[]) => reportSheet("Inventory items", rows, [
  { label: "Item", read: (row) => row.name }, { label: "Code", read: (row) => row.code }, { label: "Classification", read: (row) => reportEnum(row.classification, ["Recoverable", "Non-recoverable"]) },
  { label: "Category", read: (row) => row.itemCategory?.name }, { label: "Store", read: (row) => reportEnum(row.store, stores) },
  { label: "Available quantity", read: (row) => reportQuantity(row.availableQuantity, unitOf(row.unitOfMeasure)) },
  { label: "Minimum level", read: (row) => reportQuantity(row.minimumLevel, unitOf(row.unitOfMeasure), "entered") },
  { label: "Maximum level", read: (row) => reportQuantity(row.maximumLevel, unitOf(row.unitOfMeasure), "entered") },
  { label: "Reorder level", read: (row) => reportQuantity(row.reorderLevel, unitOf(row.unitOfMeasure), "entered") },
  { label: "Active", read: (row) => row.isActive }, { label: "Description", read: (row) => row.description ? richTextToPlain(row.description) : null },
]);
export const vendorSummarySheet = (rows: readonly VendorSummaryRow[]) => reportSheet("Vendor count by item", rows, [
  { label: "Store", read: (row) => reportEnum(row.store, stores) },
  { label: "Item", read: (row) => row.itemName }, { label: "Code", read: (row) => row.itemCode }, { label: "Category", read: (row) => row.category },
  { label: "Classification", read: (row) => reportEnum(row.classification, ["Recoverable", "Non-recoverable"]) }, { label: "Vendor count", read: (row) => row.vendorCount },
]);
