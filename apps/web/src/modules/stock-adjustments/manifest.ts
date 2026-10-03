import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "stock-adjustments",
  label: "Stock adjustments",
  root: "/warehouse/stock-adjustments",
  order: 68,
  access: { kind: "all", permissions: ["CanViewMaterialStockAdjustment"] },
  routes: [{ pattern: "/warehouse/stock-adjustments/new", access: { kind: "all", permissions: ["CanCreateMaterialStockAdjustment"] } }],
} satisfies ModuleManifest<"stock-adjustments", "/warehouse/stock-adjustments">;
