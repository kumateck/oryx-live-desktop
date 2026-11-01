import type { ModuleManifest } from "../contract";

// Every product of a division, for the finished goods warehouse to manage packing styles. Saving a style needs
// CanEditApprovedProductPackingStyle, checked on the page and by the server.
export const manifest = {
  id: "fg-products",
  label: "FG products",
  root: "/warehouse/fg-products",
  order: 93,
  access: { kind: "all", permissions: ["CanViewApprovedProducts"] },
} satisfies ModuleManifest<"fg-products", "/warehouse/fg-products">;
