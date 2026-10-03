import type { ModuleManifest } from "../contract";

// The permissions are the ones the sidebar shows this dashboard for.
export const manifest = {
  id: "warehouse-dashboard",
  label: "Warehouse dashboard",
  root: "/warehouse-dashboard",
  order: 104,
  access: { kind: "some", permissions: ["CanViewRawMaterialsItems", "CanViewPackagingMaterialsItems"] },
} satisfies ModuleManifest<"warehouse-dashboard", "/warehouse-dashboard">;
