import type { ModuleManifest } from "../contract";

// Each dashboard has its own view key, which the server checks too.
export const manifest = {
  id: "fgtn-dashboard",
  label: "FGTN dashboard",
  root: "/fgtn-dashbord",
  order: 110,
  access: { kind: "all", permissions: ["CanViewFgtnDashboard"] },
} satisfies ModuleManifest<"fgtn-dashboard", "/fgtn-dashbord">;
