import type { ModuleManifest } from "../contract";
export const manifest = {
  id: "product-recalls", label: "Product recalls", root: "/warehouse/product-recalls", order: 98,
  access: { kind: "all", permissions: ["CanViewProductRecalls"] },
} satisfies ModuleManifest<"product-recalls", "/warehouse/product-recalls">;
