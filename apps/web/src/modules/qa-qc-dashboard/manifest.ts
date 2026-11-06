import type { ModuleManifest } from "../contract";

// Each dashboard has its own view key, which the server checks too.
export const manifest = {
  id: "qa-qc-dashboard",
  label: "QA and QC dashboards",
  root: "/qa-qc-dashboard",
  order: 103,
  access: { kind: "some", permissions: ["CanViewQcDashboard", "CanViewQaDashboard"] },
  routes: [
    { pattern: "/qa-qc-dashboard/qc", access: { kind: "all", permissions: ["CanViewQcDashboard"] } },
    { pattern: "/qa-qc-dashboard/qa", access: { kind: "all", permissions: ["CanViewQaDashboard"] } },
  ],
} satisfies ModuleManifest<"qa-qc-dashboard", "/qa-qc-dashboard">;
