import { useRef, useState } from "react";
import { toast } from "sonner";
import { hrApi } from "@/shared/api/generated/hr";
import { payrollConfigApi } from "@/shared/payroll/config-api";
import { useAccess } from "@/shared/auth/use-access";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { compensationApi } from "../api/compensation-api";
import { salaryPayload, type SalaryValues } from "../schemas/editor-schema";
import type { Compensation } from "../schemas/contracts";
const audit = { module: "HR Management", subModule: "Employee Compensation" };
export function useSalarySave(employeeId: string, original: Compensation | null, onSaved: () => void) {
  const gate = usePermissionAction({ kind: "all", permissions: ["CanViewCompensation", "CanManageCompensation"] });
  const { allowsNow } = useAccess();
  const running = useRef(false);
  const ambiguous = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [read] = compensationApi.useLazyEmployeeCompensationQuery();
  const [employee] = hrApi.useLazyGetApiV1EmployeeByIdQuery();
  const [grades] = payrollConfigApi.useLazyPayrollGradesQuery();
  const [save] = compensationApi.useSaveEmployeeCompensationMutation();
  const run = async (values: SalaryValues) => {
    if (running.current) return;
    const fail = (message: string) => setError(message);
    const denied = gate.check();
    if (denied) {
      fail(denied);
      return;
    }
    if (ambiguous.current) {
      fail("The previous save was not confirmed. Close this editor and review compensation history before saving again.");
      return;
    }
    const body = salaryPayload(values, employeeId);
    if (!body) {
      fail("Review the salary, allowances and effective date.");
      return;
    }
    running.current = true;
    setBusy(true);
    setError("");
    try {
      const current = await read(employeeId, false);
      if (current.error && !("status" in current.error && current.error.status === 404)) {
        fail(apiErrorMessage(current.error));
        return;
      }
      const fresh = current.data ?? null;
      if (fresh?.employeeId && fresh.employeeId !== employeeId) {
        fail("The server returned compensation for a different employee.");
        return;
      }
      if (JSON.stringify(fresh) !== JSON.stringify(original)) {
        fail("Compensation changed after this editor opened. Reload and review it before saving.");
        return;
      }
      if (fresh && Date.parse(body.effectiveFrom) <= Date.parse(fresh.effectiveFrom)) {
        fail("The new effective date must follow the current record's start date. Saving supersedes that record.");
        return;
      }
      const person = await employee({ ...audit, id: employeeId }, false);
      if ("error" in person) {
        fail(apiErrorMessage(person.error));
        return;
      }
      if (person.data?.id !== employeeId || person.data.status !== 0) {
        fail("The selected employee is no longer active.");
        return;
      }
      if (!allowsNow("CanViewPayrollConfiguration") && (body.payGradeId !== (original?.payGradeId ?? null) || (body.payGradeId && body.basicSalary !== original?.basicSalary))) {
        fail("Changing a graded salary requires access to the current pay-grade range. Obtain payroll configuration view access before changing this salary or grade."); return;
      }
      if (body.payGradeId) {
        if (allowsNow("CanViewPayrollConfiguration")) {
          const result = await grades(undefined, false);
          if ("error" in result) {
            fail(apiErrorMessage(result.error));
            return;
          }
          const grade = result.data?.find((row) => row.id === body.payGradeId);
          if (!grade || body.basicSalary < grade.minSalary || body.basicSalary > grade.maxSalary) {
            fail("The salary must be within the selected current pay grade's range.");
            return;
          }
        } else if (body.payGradeId !== original?.payGradeId) {
          fail("Pay grade selection requires access to payroll configuration. Preserve the current grade or obtain that access.");
          return;
        }
      }
      const revoked = gate.check();
      if (revoked) {
        fail(revoked);
        return;
      }
      const result = await save(body);
      if ("error" in result) {
        if (!result.error || !("status" in result.error) || typeof result.error.status !== "number" || result.error.status >= 500) ambiguous.current = true;
        fail(`${apiErrorMessage(result.error)} Review history before another save.`);
        return;
      }
      toast.success("New effective-dated compensation saved");
      onSaved();
    } catch {
      ambiguous.current = true;
      fail("The save was not confirmed. Review current compensation and history before saving again.");
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return { run, busy, error, allowed: gate.allowed };
}
