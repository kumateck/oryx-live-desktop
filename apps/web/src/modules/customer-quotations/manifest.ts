import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "customer-quotations",
  label: "Customer quotations",
  root: "/crm/quotations",
  order: 91,
  access: { kind: "all", permissions: ["ViewCustomerQuotations"] },
} satisfies ModuleManifest<"customer-quotations", "/crm/quotations">;
