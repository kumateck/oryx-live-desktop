import type { ModuleManifest } from "../contract";
export const manifest = {
  id: "payroll-configuration",
  label: "Payroll configuration",
  root: "/hr/payroll-configuration",
  order: 135,
  access: { kind: "all", permissions: ["CanViewPayrollConfiguration"] },
} satisfies ModuleManifest<"payroll-configuration", "/hr/payroll-configuration">;
