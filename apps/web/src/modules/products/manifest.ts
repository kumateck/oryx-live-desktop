import type { ModuleManifest } from "../contract";
import { anyChangeKeys, productKeys } from "./lib/product-keys";

// Oryx Next shows planned products only to production departments.
const production = { departmentType: 0 } as const;

export const manifest = {
  id: "products",
  label: "Planned products",
  root: "/production/products",
  order: 40,
  access: { kind: "all", permissions: [productKeys.production.list], ...production },
  routes: [
    { pattern: "/production/products/create", access: { kind: "all", permissions: ["CanCreateProductionProduct"], ...production } },
    // The edit area serves every section: any section change key opens it, and each section checks its own keys.
    { pattern: "/production/products/:id/edit/:tab", access: { kind: "some", permissions: anyChangeKeys("production"), ...production } },
  ],
} satisfies ModuleManifest<"products", "/production/products">;
