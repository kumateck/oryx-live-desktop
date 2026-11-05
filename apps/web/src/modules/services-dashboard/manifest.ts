import type { ModuleManifest } from "../contract";

// Each dashboard has its own view key, which the server checks too.
export const manifest = {
  id: "services-dashboard",
  label: "Services dashboard",
  root: "/services-dashboard",
  order: 106,
  access: { kind: "all", permissions: ["CanViewServicesDashboard"] },
} satisfies ModuleManifest<"services-dashboard", "/services-dashboard">;
