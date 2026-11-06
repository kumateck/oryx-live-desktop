import type { ModuleManifest } from "../contract";

export const manifest = {
  id: "logistics-dashboard",
  label: "Logistics dashboard",
  root: "/logistics-dashboard",
  order: 86,
  access: { kind: "all", permissions: ["CanViewLogisticsDashboard"] },
} satisfies ModuleManifest<"logistics-dashboard", "/logistics-dashboard">;
