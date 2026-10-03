import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "fg-invoices",
  label: "Invoices",
  root: "/crm/invoices",
  order: 97,
  access: { kind: "some", permissions: ["CanViewInvoice", "CanViewWaybillForFgw"] },
} satisfies ModuleManifest<"fg-invoices", "/crm/invoices">;
