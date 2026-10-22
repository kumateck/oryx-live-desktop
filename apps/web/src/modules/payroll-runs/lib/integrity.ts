import type { PayrollRun, Payslip } from "../schemas/contracts";
import { PayrollStatus } from "../schemas/contracts";
export type PayrollAction = "submit" | "approve" | "reject" | "process" | "cancel";
export function payrollActionProblem(run: PayrollRun, action: PayrollAction): string | null {
  if (action === "submit")
    return run.status !== PayrollStatus.Draft
      ? "Only draft payroll can be submitted."
      : run.employeeCount !== 0
        ? "This draft retains payslips from an earlier submission. The server would generate duplicates. Cancel it and create a replacement run before submitting."
        : null;
  if (action === "approve" || action === "reject") return run.status !== PayrollStatus.PendingApproval ? "Only a pending payroll run can be reviewed." : null;
  if (action === "process") return run.status !== PayrollStatus.Approved || !run.approved ? "Only an approved payroll run can be marked processed." : null;
  return run.status === PayrollStatus.Processed || run.status === PayrollStatus.Cancelled ? "Processed or cancelled payroll cannot be cancelled." : null;
}
const sameMoney = (a: number, b: number): boolean => Math.abs(a - b) < 0.005;
export function payrollReconciliation(run: PayrollRun, slips: readonly Payslip[], activeIds: readonly string[]): string | null {
  if (!slips.length || run.employeeCount !== slips.length)
    return "The generated payslip count does not match the run. Review the complete payroll before approval.";
  if (new Set(activeIds).size !== activeIds.length || new Set(slips.map((slip) => slip.employeeId)).size !== slips.length)
    return "Payroll contains repeated or invalid employee identities.";
  const selected = new Set(slips.map((slip) => slip.employeeId));
  if (activeIds.length !== selected.size || activeIds.some((id) => !selected.has(id)))
    return "The generated payroll does not cover exactly the current active employee register. The server may have skipped calculation failures, or employment changed. Reconcile this run before approving it.";
  if (
    slips.some(
      (slip) =>
        slip.payrollRunId !== run.id ||
        slip.periodStart !== run.periodStart ||
        slip.periodEnd !== run.periodEnd ||
        slip.netPay < 0 ||
        !sameMoney(slip.grossPay - slip.totalDeductions, slip.netPay),
    )
  )
    return "A payslip has mismatched period/identity, negative net pay, or unreconciled totals. Review it before approval.";
  const fields = [
    ["totalGrossPay", "grossPay"],
    ["totalNetPay", "netPay"],
    ["totalPayeTax", "payeTax"],
    ["totalSsnitEmployeeContribution", "ssnitEmployeeContribution"],
    ["totalSsnitEmployerContribution", "ssnitEmployerContribution"],
  ] as const;
  return fields.some(
    ([total, item]) =>
      !sameMoney(
        run[total],
        slips.reduce((sum, row) => sum + row[item], 0),
      ),
  )
    ? "Payroll summary totals do not match the complete payslip register."
    : null;
}
export const runEvidence = (run: PayrollRun): string => JSON.stringify(run);
