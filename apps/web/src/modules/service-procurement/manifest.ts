import type { ModuleManifest } from "../contract";
// Service procurement after a job order goes out: quotations, comparison, proforma invoices and memos. Pages live in service-procurement.
export const manifest = {
  id: "service-procurement", label: "Service quote responses", root: "/extrals/service-quotation-response", order: 158,
  access: { kind: "some", permissions: ["CanViewServicesQuotationResponses"] },
} satisfies ModuleManifest<"service-procurement", "/extrals/service-quotation-response">;
