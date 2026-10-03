import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "billing-sheets",
  label: "Billing sheets",
  root: "/logistics/billing-sheets",
  order: 55,
  access: { kind: "all", permissions: ["CanViewBillingSheet"] },
  routes: [
    { pattern: "/logistics/billing-sheets/create", access: { kind: "all", permissions: ["CanCreateBillingSheet"] } },
    { pattern: "/logistics/billing-sheets/:id/edit", access: { kind: "all", permissions: ["CanEditBillingSheet"] } },
  ],
} satisfies ModuleManifest<"billing-sheets", "/logistics/billing-sheets">;
