import type { ModuleManifest } from "../contract";

// Each dashboard has its own view key, which the server checks too.
export const manifest = {
  id: "production-health-dashboard",
  label: "Production health dashboard",
  root: "/production-health-dashboard",
  order: 109,
  access: { kind: "all", permissions: ["CanViewProductionHealthDashboard"] },
} satisfies ModuleManifest<"production-health-dashboard", "/production-health-dashboard">;
