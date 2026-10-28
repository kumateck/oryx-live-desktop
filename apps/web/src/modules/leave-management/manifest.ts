import type { ModuleManifest } from "../contract";
import { leavePermissions as p } from "./lib/leave";
export const manifest = {
  id: "leave-management",
  label: "Leave management",
  root: "/hr/leave-management",
  order: 132,
  access: { kind: "all", permissions: [p.view] },
  routes: [
    { pattern: "/hr/leave-management/create/:category", access: { kind: "all", permissions: [p.view, p.create] } },
    { pattern: "/hr/leave-management/:id/edit", access: { kind: "all", permissions: [p.view, p.edit] } },
  ],
} satisfies ModuleManifest<"leave-management", "/hr/leave-management">;
