import type { ModuleManifest } from "../contract";

// The permissions are the ones the sidebar shows this dashboard for.
export const manifest = {
  id: "hr-dashboard",
  label: "HR dashboard",
  root: "/hr-dashboard",
  order: 101,
  access: { kind: "some", permissions: ["CanViewActiveEmployee", "CanViewCompensation", "CanViewPayrollConfiguration", "CanViewPayrollRuns", "CanViewPayslip", "CanViewOwnPayslip", "CanViewPerformanceCycles", "CanViewOwnGoals", "CanViewTeamGoals", "CanViewPerformanceReviews"] },
} satisfies ModuleManifest<"hr-dashboard", "/hr-dashboard">;
