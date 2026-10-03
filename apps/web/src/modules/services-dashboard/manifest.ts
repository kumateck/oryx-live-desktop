import type { ModuleManifest } from "../contract";

// The permissions are the ones the sidebar shows this dashboard for.
export const manifest = {
  id: "services-dashboard",
  label: "Services dashboard",
  root: "/services-dashboard",
  order: 106,
  access: { kind: "some", permissions: ["CanViewServices", "CanViewContractors", "CanViewJobRequests", "CanViewJobOrders", "CanViewServicesQuotationResponses", "CanViewServicesPricingSelection", "CanViewServicesProformaRequests", "CanViewServicesProformaResponses", "CanViewServicesMemo", "CanViewServicesPurchaseOrders"] },
} satisfies ModuleManifest<"services-dashboard", "/services-dashboard">;
