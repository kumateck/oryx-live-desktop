import { runSchema, slipSchema } from "./schemas/contracts";
export const runId = "558da105-a506-44a9-8ff5-8d005a54f294";
export const employeeId = "658da105-a506-44a9-8ff5-8d005a54f294";
export const requesterId = "758da105-a506-44a9-8ff5-8d005a54f294";
export const payrollRun = runSchema.parse({
  id: runId,
  periodStart: "2026-10-01T00:00:00Z",
  periodEnd: "2026-10-31T00:00:00Z",
  status: 1,
  approved: false,
  employeeCount: 1,
  totalGrossPay: 100,
  totalNetPay: 80,
  totalPayeTax: 10,
  totalSsnitEmployeeContribution: 10,
  totalSsnitEmployerContribution: 5,
  createdAt: "2026-10-31T00:00:00Z",
});
export const payslip = slipSchema.parse({
  id: "858da105-a506-44a9-8ff5-8d005a54f294",
  payrollRunId: runId,
  employeeId,
  periodStart: payrollRun.periodStart,
  periodEnd: payrollRun.periodEnd,
  basicSalary: 100,
  totalAllowances: 0,
  totalAdditions: 0,
  grossPay: 100,
  totalReliefs: 0,
  taxableIncome: 90,
  ssnitEmployeeContribution: 10,
  ssnitEmployerContribution: 5,
  tier2Contribution: 2,
  payeTax: 10,
  totalDeductions: 20,
  netPay: 80,
  lineItems: [{ type: 4, amount: 10, description: "PAYE" }],
});
