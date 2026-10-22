import type { ModuleManifest } from "../contract";
// Service procurement after a job order goes out: quotations, comparison, proforma invoices and memos. Pages live in service-procurement.
export const manifest = {
  id: "service-comparison", label: "Service price comparison", root: "/extrals/service-price-comparison", order: 159,
  access: { kind: "some", permissions: ["CanViewServicesPricingSelection"] },
} satisfies ModuleManifest<"service-comparison", "/extrals/service-price-comparison">;
