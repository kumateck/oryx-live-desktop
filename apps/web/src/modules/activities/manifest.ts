import type { ModuleManifest } from "../contract";

// Oryx Next shows the production board only to production departments.
const view = { kind: "all", permissions: ["CanViewPlannedProducts"], departmentType: 0 } as const;

export const manifest = {
  id: "activities",
  label: "Production board",
  root: "/production/activities",
  order: 51,
  access: view,
  routes: [
    { pattern: "/production/activities/:activityId/extra-material", access: { kind: "all", permissions: ["CanViewPlannedProducts", "CanRequestExtraPacking"], departmentType: 0 } },
    { pattern: "/production/activities/:activityId/final-packing", access: { kind: "all", permissions: ["CanViewPlannedProducts", "CanRecordFinalPacking", "CanReturnProductionMaterials"], departmentType: 0 } },
  ],
} satisfies ModuleManifest<"activities", "/production/activities">;
