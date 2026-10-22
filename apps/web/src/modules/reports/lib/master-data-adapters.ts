import type { DomainEntitiesProductsProductListDto } from "@/shared/api/generated/products";
import type { DomainEntitiesItemsItemDto } from "@/shared/api/generated/inventory";
import { richTextToPlain } from "@/shared/rich-text/rich-text-view";
import { reportSheet, reportDate, reportEnum } from "@/shared/reports/report-data";
import type { ApprovedMaterialRow, VendorSummaryRow } from "../api/material-report-api";
export const materialMasterSheet = (rows: readonly ApprovedMaterialRow[]) => reportSheet("Approved materials", rows, [
  { label: "Material code", read: (row) => row.material?.code }, { label: "Material", read: (row) => row.material?.name }, { label: "Material type", read: (row) => reportEnum(row.material?.kind, ["Raw material", "Packaging material"]) },
  { label: "Category", read: (row) => row.material?.materialCategory?.name }, { label: "Unit", read: (row) => row.unitOfMeasure?.symbol ?? row.unitOfMeasure?.name },
  { label: "Available quantity", read: (row) => row.totalAvailableQuantity }, { label: "Reserved quantity", read: (row) => row.reservedQuantity },
]);
export const productMasterSheet = (rows: readonly DomainEntitiesProductsProductListDto[]) => reportSheet("Products", rows, [
  { label: "Product", read: (row) => row.name }, { label: "Code", read: (row) => row.code }, { label: "Division", read: (row) => reportEnum(row.division, ["Betalactam", "Non-betalactam"]) },
  { label: "Category", read: (row) => row.category?.name }, { label: "Department", read: (row) => row.department?.name }, { label: "Generic name", read: (row) => row.genericName },
  { label: "Description", read: (row) => row.description ? richTextToPlain(row.description) : null }, { label: "Storage condition", read: (row) => row.storageCondition }, { label: "Package style", read: (row) => row.packageStyle },
  { label: "Filled weight", read: (row) => row.filledWeight }, { label: "Shelf life", read: (row) => row.shelfLife }, { label: "Action / use", read: (row) => row.actionUse },
  { label: "FDA registration", read: (row) => row.fdaRegistrationNumber }, { label: "Master formula number", read: (row) => row.masterFormulaNumber },
  { label: "Primary packaging", read: (row) => row.primaryPackDescription }, { label: "Secondary packaging", read: (row) => row.secondaryPackDescription }, { label: "Tertiary packaging", read: (row) => row.tertiaryPackDescription },
  { label: "Base quantity", read: (row) => row.baseQuantity }, { label: "Full batch size", read: (row) => row.fullBatchSize }, { label: "Base unit", read: (row) => row.baseUoM?.symbol ?? row.baseUoM?.name },
  { label: "Equipment", read: (row) => row.equipment?.name }, { label: "Price", read: (row) => row.price }, { label: "Price unit", read: (row) => row.priceUoM },
  { label: "Label claim", read: (row) => row.labelClaim }, { label: "Verified", read: (row) => row.isVerified }, { label: "Document number", read: (row) => row.documentNumber },
  { label: "Revision", read: (row) => row.revisionNumber }, { label: "Created", read: (row) => reportDate(row.createdAt) },
]);
export const itemMasterSheet = (rows: readonly DomainEntitiesItemsItemDto[]) => reportSheet("Inventory items", rows, [
  { label: "Item", read: (row) => row.name }, { label: "Code", read: (row) => row.code }, { label: "Classification", read: (row) => reportEnum(row.classification, ["Recoverable", "Non-recoverable"]) },
  { label: "Category", read: (row) => row.itemCategory?.name }, { label: "Store", read: (row) => reportEnum(row.store, ["Equipment store", "General store", "IT store", "Reagent store"]) },
  { label: "Available quantity", read: (row) => row.availableQuantity }, { label: "Unit", read: (row) => row.unitOfMeasure?.symbol ?? row.unitOfMeasure?.name },
  { label: "Minimum level", read: (row) => row.minimumLevel }, { label: "Maximum level", read: (row) => row.maximumLevel }, { label: "Reorder level", read: (row) => row.reorderLevel },
  { label: "Has batch", read: (row) => row.hasBatch }, { label: "Active", read: (row) => row.isActive }, { label: "Description", read: (row) => row.description ? richTextToPlain(row.description) : null },
]);
export const vendorSummarySheet = (rows: readonly VendorSummaryRow[]) => reportSheet("Vendor count by item", rows, [
  { label: "Store", read: (row) => reportEnum(row.store, ["Equipment store", "General store", "IT store", "Reagent store"]) },
  { label: "Item", read: (row) => row.itemName }, { label: "Code", read: (row) => row.itemCode }, { label: "Category", read: (row) => row.category },
  { label: "Classification", read: (row) => reportEnum(row.classification, ["Recoverable", "Non-recoverable"]) }, { label: "Vendor count", read: (row) => row.vendorCount },
]);
