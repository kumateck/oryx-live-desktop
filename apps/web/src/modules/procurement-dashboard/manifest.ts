import type { ModuleManifest } from "../contract";

// Each dashboard has its own view key, which the server checks too.
export const manifest = {
  id: "procurement-dashboard",
  label: "Procurement dashboard",
  root: "/procurement-dashboard",
  order: 105,
  access: { kind: "all", permissions: ["CanViewProcurementDashboard"] },
} satisfies ModuleManifest<"procurement-dashboard", "/procurement-dashboard">;
