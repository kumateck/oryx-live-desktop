import type { ModuleManifest } from "../contract";
export const manifest = {
  id: "compensation",
  label: "Employee compensation",
  root: "/hr/employee-compensation",
  order: 136,
  access: { kind: "all", permissions: ["CanViewCompensation"] },
} satisfies ModuleManifest<"compensation", "/hr/employee-compensation">;
