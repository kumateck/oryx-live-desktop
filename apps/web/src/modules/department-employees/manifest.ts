import type { ModuleManifest } from "../contract";
export const manifest = { id: "department-employees", label: "Department employees", root: "/hr/department-employee-export", order: 133,
  access: { kind: "all", permissions: ["CanViewDepartmentEmployee"] },
} satisfies ModuleManifest<"department-employees", "/hr/department-employee-export">;
