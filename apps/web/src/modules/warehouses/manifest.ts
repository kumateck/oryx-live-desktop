import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "warehouses",
  label: "Stores",
  root: "/settings/warehouses",
  order: 69,
  access: { kind: "all", permissions: ["CanViewWarehouses"] },
} satisfies ModuleManifest<"warehouses", "/settings/warehouses">;
