import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "available-stock",
  label: "Available stock",
  root: "/stock/available",
  order: 85,
  access: { kind: "some", permissions: ["CanViewRawMaterialStock", "CanViewPackingMaterialStock"] },
} satisfies ModuleManifest<"available-stock", "/stock/available">;
