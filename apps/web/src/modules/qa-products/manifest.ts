import type { ModuleManifest } from "../contract";
export const manifest = { id: "qa-products", label: "Products", root: "/qa/products", order: 70,
  access: { kind: "all", permissions: ["CanViewPlannedProducts"] },
  routes: [{ pattern: "/qa/products/:id/edit/:tab", access: { kind: "all", permissions: ["CanViewPlannedProducts", "CanEditProductionPlan"] } }],
} satisfies ModuleManifest<"qa-products", "/qa/products">;
