import type { ModuleManifest } from "../contract";
// Procurement of store items: sourcing store purchase requisitions, trusted-vendor quotations, open-market quotes,
// price comparison, memos and what has been bought. Each page has its own keys, as the server checks them.
const all = (...permissions: string[]) => ({ kind: "all", permissions }) as const;
const some = (...permissions: string[]) => ({ kind: "some", permissions }) as const;
export const manifest = {
  id: "store-procurement", label: "Store procurement", root: "/extrals/procurement", order: 155,
  access: some("CanViewPurchaseRequisitionsSourcing", "CanViewQuotationRequestsForTrustedVendors", "CanViewQuotationResponsesForTrustedVendors",
    "CanViewTrustedVendorPricingSelection", "CanViewOpenMarketPricingSelection", "CanViewMemoForTrustedVendors", "CanViewOpenMarketMemo",
    "CanViewOpenMarketQuotationSheets", "CanViewPurchaseOrdersForTrustedVendors", "CanViewOpenMarketPurchaseOrders"),
  routes: [
    { pattern: "/extrals/procurement/purchase-requisition-sourcing", access: all("CanViewPurchaseRequisitionsSourcing") },
    { pattern: "/extrals/procurement/purchase-requisition-sourcing/:id", access: all("CanViewPurchaseRequisitionsSourcing") },
    { pattern: "/extrals/procurement/vendor-quotations", access: all("CanViewQuotationRequestsForTrustedVendors") },
    { pattern: "/extrals/procurement/quotation-responses", access: all("CanViewQuotationResponsesForTrustedVendors") },
    { pattern: "/extrals/procurement/price-comparison", access: some("CanViewTrustedVendorPricingSelection", "CanViewOpenMarketPricingSelection") },
    { pattern: "/extrals/procurement/memo", access: some("CanViewMemoForTrustedVendors", "CanViewOpenMarketMemo") },
    { pattern: "/extrals/procurement/memo/:id", access: some("CanViewMemoForTrustedVendors", "CanViewOpenMarketMemo") },
    { pattern: "/extrals/procurement/open-market-collection", access: all("CanViewOpenMarketQuotationSheets") },
    { pattern: "/extrals/procurement/open-market-collection/:id", access: all("CanViewOpenMarketQuotationSheets") },
    { pattern: "/extrals/procurement/purchased-items", access: some("CanViewPurchaseOrdersForTrustedVendors", "CanViewOpenMarketPurchaseOrders") },
  ],
} satisfies ModuleManifest<"store-procurement", "/extrals/procurement">;
