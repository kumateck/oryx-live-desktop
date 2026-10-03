import type { ModuleManifest } from "../contract";
export const manifest = { id: "departments", label: "Departments", root: "/settings/departments", order: 83,
  access: { kind: "all", permissions: ["CanViewDepartments"] },
} satisfies ModuleManifest<"departments", "/settings/departments">;
