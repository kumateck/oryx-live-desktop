import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "purchase-order-lists",
  label: "Order lists",
  root: "/procurement/purchase-order-lists",
  order: 51,
  access: { kind: "some", permissions: ["CanViewForeignPurchaseOrder", "CanViewLocalPurchaseOrder"] },
} satisfies ModuleManifest<"purchase-order-lists", "/procurement/purchase-order-lists">;
