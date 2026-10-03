import type { ModuleManifest } from "../contract";

// The permissions are the ones the sidebar shows this dashboard for.
export const manifest = {
  id: "procurement-dashboard",
  label: "Procurement dashboard",
  root: "/procurement-dashboard",
  order: 105,
  access: { kind: "some", permissions: ["CanViewPurchaseRequisitions"] },
} satisfies ModuleManifest<"procurement-dashboard", "/procurement-dashboard">;
