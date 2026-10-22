import type { ModuleManifest } from "../contract";
export const manifest = {
  id: "store-vendors",
  label: "Store vendors",
  root: "/extrals/vendors",
  order: 145,
  access: { kind: "all", permissions: ["CanViewVendors"] },
} satisfies ModuleManifest<"store-vendors", "/extrals/vendors">;
