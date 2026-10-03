import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "approved-products",
  label: "Approved products",
  root: "/warehouse/approved-products",
  order: 94,
  access: { kind: "all", permissions: ["CanViewApprovedProducts"] },
} satisfies ModuleManifest<"approved-products", "/warehouse/approved-products">;
