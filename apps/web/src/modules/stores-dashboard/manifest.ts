import type { ModuleManifest } from "../contract";

// The permissions are the ones the sidebar shows this dashboard for.
export const manifest = {
  id: "stores-dashboard",
  label: "Stores dashboard",
  root: "/stores-dashboard",
  order: 107,
  access: { kind: "some", permissions: ["CanViewItemsInReagentStore", "CanViewItemsInEquipmentStore", "CanViewItemsInGeneralStore", "CanViewItemsInItStore", "CanViewReagentStoreReceivingArea", "CanViewEquipmentStoreReceivingArea", "CanViewGeneralStoreReceivingArea", "CanViewItStoreReceivingArea", "CanViewReagentStoreAvailableStocks", "CanViewEquipmentStoreAvailableStocks", "CanViewGeneralStoreAvailableStocks", "CanViewItStoreAvailableStocks", "CanViewReagentStorePurchaseRequisitions", "CanViewEquipmentStorePurchaseRequisitions", "CanViewGeneralStorePurchaseRequisitions", "CanViewItStorePurchaseRequisitions", "CanViewReagentStoreStockRequisitions", "CanViewEquipmentStoreStockRequisitions", "CanViewGeneralStoreStockRequisitions", "CanViewItStoreStockRequisitions", "CanViewReagentStoreIssueStocks", "CanViewEquipmentStoreIssueStocks", "CanViewGeneralStoreIssueStocks", "CanViewItStoreIssueStocks", "CanViewReagentStoreReturnItems", "CanViewEquipmentStoreReturnItems", "CanViewGeneralStoreReturnItems", "CanViewItStoreReturnItems", "CanViewReagentStoreDamageMissingItems", "CanViewEquipmentStoreDamageMissingItems", "CanViewGeneralStoreDamageMissingItems", "CanViewItStoreDamageMissingItems", "CanViewPurchaseRequisitionsSourcing", "CanViewQuotationRequestsForTrustedVendors", "CanViewQuotationResponsesForTrustedVendors", "CanViewTrustedVendorPricingSelection", "CanViewMemoForTrustedVendors", "CanViewPurchaseOrdersForTrustedVendors", "CanViewOpenMarketQuotationSheets", "CanViewOpenMarketPricingSelection", "CanViewOpenMarketMemo", "CanViewOpenMarketPurchaseOrders"] },
} satisfies ModuleManifest<"stores-dashboard", "/stores-dashboard">;
