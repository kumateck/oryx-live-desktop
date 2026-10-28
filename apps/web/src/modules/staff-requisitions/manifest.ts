import type { ModuleManifest } from "../contract";
import { staffPermissions as p } from "./lib/staff";
export const manifest = {
  id: "staff-requisitions",
  label: "Staff requisitions",
  root: "/hr/staff-requisition",
  order: 134,
  access: { kind: "all", permissions: [p.view] },
  routes: [
    { pattern: "/hr/staff-requisition/create", access: { kind: "all", permissions: [p.view, p.create] } },
    { pattern: "/hr/staff-requisition/:id/edit", access: { kind: "all", permissions: [p.view, p.edit] } },
  ],
} satisfies ModuleManifest<"staff-requisitions", "/hr/staff-requisition">;
