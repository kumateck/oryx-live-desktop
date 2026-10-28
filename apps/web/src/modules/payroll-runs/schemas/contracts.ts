import { z } from "zod";
const amount = z.number().finite();
const date = z.iso.datetime({ local: true, offset: true });
const text = z
  .string()
  .nullish()
  .transform((value) => value ?? "");
export enum PayrollStatus {
  Draft,
  PendingApproval,
  Approved,
  Processed,
  Cancelled,
}
export const runSchema = z.object({
  id: z.uuid(),
  periodStart: date,
  periodEnd: date,
  status: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  approved: z.boolean(),
  employeeCount: z.number().int().nonnegative(),
  totalGrossPay: amount,
  totalNetPay: amount,
  totalPayeTax: amount,
  totalSsnitEmployeeContribution: amount,
  totalSsnitEmployerContribution: amount,
  createdAt: date,
});
export const slipSchema = z.object({
  id: z.uuid(),
  payrollRunId: z.uuid(),
  periodStart: date,
  periodEnd: date,
  employeeId: z.uuid(),
  employeeName: text,
  staffNumber: text,
  department: text,
  designation: text,
  basicSalary: amount,
  totalAllowances: amount,
  totalAdditions: amount,
  grossPay: amount,
  totalReliefs: amount,
  taxableIncome: amount,
  ssnitEmployeeContribution: amount,
  ssnitEmployerContribution: amount,
  tier2Contribution: amount,
  payeTax: amount,
  totalDeductions: amount,
  netPay: amount,
  lineItems: z.array(
    z.object({ description: text, type: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]), amount }),
  ),
});
const meta = { pageIndex: z.number().int().positive(), pageCount: z.number().int().nonnegative(), totalRecordCount: z.number().int().nonnegative() };
export const runsSchema = z.object({ ...meta, data: z.array(runSchema) });
export const slipsSchema = z.object({ ...meta, data: z.array(slipSchema) });
export type PayrollRun = z.infer<typeof runSchema>;
export type Payslip = z.infer<typeof slipSchema>;
export const payrollAudit = { module: "HR Management", subModule: "Payroll Runs" };
export const payrollRoot = "/hr/payroll-runs";
export const payrollPermissions = {
  view: "CanViewPayrollRuns",
  create: "CanCreatePayrollRun",
  approve: "CanApprovePayrollRun",
  cancel: "CanCancelPayrollRun",
  payslip: "CanViewPayslip",
  advice: "CanExportBankAdvice",
  register: "CanExportPayrollRegister",
} as const;
export const statuses = ["Draft", "Pending approval", "Approved", "Processed", "Cancelled"] as const;
