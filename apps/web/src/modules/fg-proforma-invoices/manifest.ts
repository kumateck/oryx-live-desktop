import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "fg-proforma-invoices",
  label: "Proforma invoices",
  root: "/crm/proforma-invoice",
  order: 96,
  access: { kind: "all", permissions: ["CanViewProformaInvoice"] },
} satisfies ModuleManifest<"fg-proforma-invoices", "/crm/proforma-invoice">;
