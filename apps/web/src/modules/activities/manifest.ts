import type { ModuleManifest } from "../contract";

// Oryx Next shows the production board only to production departments.
const view = { kind: "all", permissions: ["CanViewPlannedProducts"], departmentType: 0 } as const;

export const manifest = {
  id: "activities",
  label: "Production board",
  root: "/production/activities",
  order: 51,
  access: view,
  routes: [],
} satisfies ModuleManifest<"activities", "/production/activities">;
