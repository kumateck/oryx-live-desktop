import type { ModuleManifest } from "../contract";

// Oryx Next shows production schedules only to production departments.
const production = { departmentType: 0 } as const;

export const manifest = {
  id: "schedules",
  label: "Production schedules",
  root: "/production/schedules",
  order: 50,
  access: { kind: "all", permissions: ["CanViewProductSchedules"], ...production },
  routes: [
    { pattern: "/production/schedules/create", access: { kind: "all", permissions: ["CanCreateProductSchedule"], ...production } },
    { pattern: "/production/schedules/:id/products/add", access: { kind: "all", permissions: ["CanAddProductsToProductSchedule"], ...production } },
    { pattern: "/production/schedules/:id/products/remove", access: { kind: "all", permissions: ["CanRemoveProductsFromProductSchedule"], ...production } },
    { pattern: "/production/schedules/:id/edit", access: { kind: "all", permissions: ["CanEditProductSchedule"], ...production } },
  ],
} satisfies ModuleManifest<"schedules", "/production/schedules">;
