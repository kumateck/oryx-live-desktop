import { expect, it } from "vitest";
import { payrollActionProblem, payrollReconciliation } from "./lib/integrity";
import { payrollRun as run, payslip as slip, employeeId } from "./payroll-fixture";
it("does not regenerate retained payslips in a rejected draft", () => {
  expect(payrollActionProblem({ ...run, status: 0 }, "submit")).toContain("duplicates");
  expect(payrollActionProblem({ ...run, status: 0, employeeCount: 0 }, "submit")).toBeNull();
});
it("requires approved status and the approved flag before recording payroll as paid", () => {
  expect(payrollActionProblem({ ...run, status: 2 }, "process")).not.toBeNull();
  expect(payrollActionProblem({ ...run, status: 2, approved: true }, "process")).toBeNull();
  expect(payrollActionProblem({ ...run, status: 3, approved: true }, "cancel")).not.toBeNull();
});
it("reconciles full active employee coverage, unique identities and every payroll summary total", () => {
  expect(payrollReconciliation(run, [slip], [employeeId])).toBeNull();
  expect(payrollReconciliation(run, [slip], [employeeId, "missing"])).toContain("cover exactly");
  expect(payrollReconciliation({ ...run, totalNetPay: 79 }, [slip], [employeeId])).toContain("summary totals");
  expect(payrollReconciliation({ ...run, employeeCount: 2 }, [slip, slip], [employeeId])).toContain("repeated");
});
it("does not approve negative net pay, wrong periods or an unreconciled individual payslip", () => {
  expect(payrollReconciliation(run, [{ ...slip, periodEnd: "2025-01-01T00:00:00Z" }], [employeeId])).not.toBeNull();
  expect(payrollReconciliation(run, [{ ...slip, netPay: -1 }], [employeeId])).not.toBeNull();
  expect(payrollReconciliation(run, [{ ...slip, totalDeductions: 19 }], [employeeId])).not.toBeNull();
});
