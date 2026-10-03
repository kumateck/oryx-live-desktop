import type { ModuleManifest } from "../contract";

// The permissions are the ones the sidebar shows this dashboard for.
export const manifest = {
  id: "production-health-dashboard",
  label: "Production health dashboard",
  root: "/production-health-dashboard",
  order: 109,
  access: { kind: "some", permissions: ["CanViewPlannedProducts"] },
} satisfies ModuleManifest<"production-health-dashboard", "/production-health-dashboard">;
