import type { ModuleManifest } from "../contract";
export const manifest = {
  id: "payroll-runs",
  label: "Payroll runs",
  root: "/hr/payroll-runs",
  order: 137,
  access: { kind: "all", permissions: ["CanViewPayrollRuns"] },
  routes: [{ pattern: "/hr/payroll-runs/payslips/:id", access: { kind: "all", permissions: ["CanViewPayslip"] } }],
} satisfies ModuleManifest<"payroll-runs", "/hr/payroll-runs">;
