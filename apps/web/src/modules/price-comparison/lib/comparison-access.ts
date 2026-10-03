import type { SupplierType } from "@/shared/procurement/supplier-type";

export const viewComparisonPermissions: Record<SupplierType, string> = { 0: "CanViewForeignVendorPricing", 1: "CanViewLocalVendorPricing" };
/** Awarding each material to a supplier, which creates the purchase orders. */
export const awardPermissions: Record<SupplierType, string> = { 0: "CanApplyChangesForForeignVendorPricingSelection", 1: "CanApplyChangesForLocalVendorPricingSelection" };
export const audit = { module: "Procurement", subModule: "Price Comparison" } as const;
