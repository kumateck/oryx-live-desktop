import type { ModuleManifest } from "../contract";
import { employeePermissions as p } from "./lib/access";
export const manifest = { id: "employees", label: "Employee management", root: "/hr/employee-management", order: 125,
  access: { kind: "some", permissions: [p.active, p.inactive, p.new] },
  query: { key: "status", choices: [{ value: "0", access: { kind: "all", permissions: [p.active] } }, { value: "1", access: { kind: "all", permissions: [p.inactive] } }, { value: "2", access: { kind: "all", permissions: [p.new] } }] },
  routes: [{ pattern: "/hr/employee-management/create/:type", access: { kind: "all", permissions: [p.register] } },
    { pattern: "/hr/employee-management/:id/edit/:type", access: { kind: "all", permissions: [p.update] } },
    { pattern: "/hr/employee-management/:id/details", access: { kind: "all", permissions: [p.details] } }],
} satisfies ModuleManifest<"employees", "/hr/employee-management">;
