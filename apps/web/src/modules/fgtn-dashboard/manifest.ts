import type { ModuleManifest } from "../contract";

// The permissions are the ones the sidebar shows this dashboard for.
export const manifest = {
  id: "fgtn-dashboard",
  label: "FGTN dashboard",
  root: "/fgtn-dashbord",
  order: 110,
  access: { kind: "some", permissions: ["CanViewOrder"] },
} satisfies ModuleManifest<"fgtn-dashboard", "/fgtn-dashbord">;
