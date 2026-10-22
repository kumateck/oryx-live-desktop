import type { ModuleManifest } from "../contract";
// Service procurement after a job order goes out: quotations, comparison, proforma invoices and memos. Pages live in service-procurement.
export const manifest = {
  id: "service-proformas", label: "Service proforma invoices", root: "/extrals/service-proforma-request", order: 160,
  access: { kind: "some", permissions: ["CanViewServicesProformaRequests", "CanViewServicesProformaResponses", "CanViewServicesPurchaseOrders"] },
} satisfies ModuleManifest<"service-proformas", "/extrals/service-proforma-request">;
