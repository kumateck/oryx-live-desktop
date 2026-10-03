import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "customers",
  label: "Customers",
  root: "/crm/customers",
  order: 90,
  access: { kind: "some", permissions: ["CanViewCustomers", "ViewCustomerCreditStatus", "ViewCustomerQuotations"] },
  routes: [
    { pattern: "/crm/customers/:id", access: { kind: "all", permissions: ["CanViewCustomers"] } },
    { pattern: "/crm/customers/:id/quotations/create", access: { kind: "all", permissions: ["CreateCustomerQuotation"] } },
  ],
} satisfies ModuleManifest<"customers", "/crm/customers">;
