import type { ModuleManifest } from "../contract";
import { overtimePermissions as p } from "./lib/overtime";
export const manifest = {
  id: "overtime",
  label: "Overtime management",
  root: "/hr/overtime-management",
  order: 133,
  access: { kind: "all", permissions: [p.view] },
  routes: [
    { pattern: "/hr/overtime-management/create", access: { kind: "all", permissions: [p.view, p.create] } },
    { pattern: "/hr/overtime-management/:id/edit", access: { kind: "all", permissions: [p.view, p.edit] } },
  ],
} satisfies ModuleManifest<"overtime", "/hr/overtime-management">;
