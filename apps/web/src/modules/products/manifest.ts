import type { ModuleManifest } from "../contract";

// Oryx Next shows planned products only to production departments.
const production = { departmentType: 0 } as const;

export const manifest = {
  id: "products",
  label: "Planned products",
  root: "/production/products",
  order: 40,
  access: { kind: "all", permissions: ["CanViewPlannedProducts"], ...production },
  routes: [
    { pattern: "/production/products/create", access: { kind: "all", permissions: ["CanCreateNewProductionPlan"], ...production } },
    { pattern: "/production/products/:id/edit/:tab", access: { kind: "all", permissions: ["CanEditProductionPlan"], ...production } },
  ],
} satisfies ModuleManifest<"products", "/production/products">;
