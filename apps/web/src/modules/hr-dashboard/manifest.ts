import type { ModuleManifest } from "../contract";

// Each dashboard has its own view key, which the server checks too.
export const manifest = {
  id: "hr-dashboard",
  label: "HR dashboard",
  root: "/hr-dashboard",
  order: 101,
  access: { kind: "all", permissions: ["CanViewHrDashboard"] },
} satisfies ModuleManifest<"hr-dashboard", "/hr-dashboard">;
