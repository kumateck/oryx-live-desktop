import type { ModuleManifest } from "../contract";

// The permissions are the ones the sidebar shows this dashboard for.
export const manifest = {
  id: "inventory-command-center",
  label: "Inventory command centre",
  root: "/inventory-command-center",
  order: 108,
  access: { kind: "some", permissions: ["CanViewRawMaterialsItems", "CanViewPackagingMaterialsItems"] },
} satisfies ModuleManifest<"inventory-command-center", "/inventory-command-center">;
