import { z } from "zod";
import { settingsApi } from "@/shared/api/generated/settings";
import { policiesSchema, batchPolicyProblem } from "../lib/batch-policy";
import { useRef, useState } from "react";
import { hrApi, shiftCommandApi } from "../api/shift-api";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { sessionUserId } from "@/shared/auth/session-api";
import { scheduleSchema, assignmentSchema, employeeSchema, audit, type Schedule, type Assignment, type AssignBody, type SwapBody } from "../schemas/contracts";
import { assignmentProblem, scheduleWriteProblem } from "../lib/calendar";
import { assignmentReconciliation, swapReconciliation } from "../lib/reconcile";
export function useShiftCommand(original: Schedule, action: "assign" | "swap", snapshot: Assignment[] | null, onDone: () => void) {
  const gate = usePermissionAction({
    kind: "all",
    permissions: [
      action === "assign" ? "CanCreateShiftSchedule" : "CanEditShiftSchedule",
      "CanViewShiftSchedule",
      "CanViewEmployeeDetails",
      "CanViewShiftCategories",
      ...(action === "assign" ? ["CanViewWorkingHoursPolicy"] : []),
    ],
  });
  const running = useRef(false);
  const written = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [policy] = settingsApi.useLazyGetApiV1WorkingHoursPolicyQuery();
  const [read] = hrApi.useLazyGetApiV1ShiftSchedulesByIdQuery();
  const [assignments] = hrApi.useLazyGetApiV1ShiftSchedulesByScheduleIdViewQuery();
  const [employee] = hrApi.useLazyGetApiV1EmployeeByIdQuery();
  const [category] = hrApi.useLazyGetApiV1ShiftCategoryByIdQuery();
  const [available] = hrApi.useLazyGetApiV1EmployeeByShiftScheduleIdAvailableQuery();
  const [assign] = shiftCommandApi.useAssignPlannedShiftMutation();
  const [swap] = shiftCommandApi.useSwapPlannedShiftMutation();
  const run = async (body: AssignBody | SwapBody): Promise<string | null> => {
    const fail = (m: string) => {
      setError(m);
      return m;
    };
    if (running.current) return "A shift change is already running.";
    const denied = gate.check();
    if (denied) return fail(denied);
    if (written.current) return fail("A change was already sent. Close and inspect the calendar before taking another action.");
    const actor = sessionUserId();
    if (!actor) return fail("Sign in before changing assignments.");
    running.current = true;
    setBusy(true);
    setError("");
    try {
      const fresh = scheduleSchema.parse(await read({ ...audit, id: original.id }, false).unwrap());
      if (JSON.stringify(fresh) !== JSON.stringify(original) || body.shiftScheduleId !== original.id)
        return fail("The schedule changed. Reopen the assignment dialog.");
      const today = new Date();
      const currentDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      if (("scheduleDate" in body ? body.scheduleDate : fresh.startDate).slice(0, 10) < currentDay)
        return fail("Historical shifts cannot be created or replaced here.");
      if (action === "assign") {
        const rates = policiesSchema.parse(await policy({ ...audit }, false).unwrap());
        const violation = batchPolicyProblem(fresh, body.shiftTypeId, rates);
        if (violation) return fail(violation);
      }
      const blocked = scheduleWriteProblem(fresh);
      if (blocked) return fail(blocked);
      const rows = z
        .array(assignmentSchema)
        .parse(await assignments({ ...audit, scheduleId: fresh.id, startDate: fresh.startDate, endDate: fresh.endDate }, false).unwrap());
      const problem = assignmentProblem(rows, fresh);
      if (problem) return fail(problem);
      if (snapshot && JSON.stringify(rows) !== JSON.stringify(snapshot)) return fail("The calendar changed. Refresh it before replacing an employee.");
      if (!fresh.shiftType.some((s) => s.id === body.shiftTypeId)) return fail("This shift type does not belong to the schedule.");
      const cat = await category({ ...audit, id: body.shiftCategoryId }, false).unwrap();
      if (cat.id !== body.shiftCategoryId) return fail("The shift category could not be verified.");
      const ids = "employeeIds" in body ? body.employeeIds : [body.newEmployeeId];
      if (!ids.length || new Set(ids).size !== ids.length) return fail("Choose distinct employees.");
      if (
        action === "assign" &&
        "employeeIds" in body &&
        rows.some((r) => r.shiftCategory.id === body.shiftCategoryId && r.shiftType.shiftTypeId === body.shiftTypeId)
      )
        return fail("This category and shift type already have assignments. Inspect the existing calendar instead of repeating the batch.");
      if (
        action === "swap" &&
        "newEmployeeId" in body &&
        (body.employeeId === body.newEmployeeId ||
          !rows.some(
            (r) =>
              r.scheduleDate.slice(0, 10) === body.scheduleDate.slice(0, 10) &&
              r.shiftCategory.id === body.shiftCategoryId &&
              r.shiftType.shiftTypeId === body.shiftTypeId &&
              r.employees.some((e) => e.employeeId === body.employeeId),
          ))
      )
        return fail("The original assignment could not be verified.");
      const availableRows = z
        .array(employeeSchema)
        .parse(await available({ ...audit, shiftScheduleId: fresh.id, date: "scheduleDate" in body ? body.scheduleDate : fresh.startDate }, false).unwrap());
      if (ids.some((id) => !availableRows.some((e) => e.employeeId === id)))
        return fail("A selected employee is no longer available. Refresh the employee choices.");
      for (const id of ids) {
        const e = await employee({ ...audit, id }, false).unwrap();
        if (e.id !== id || e.status !== 0 || e.department?.id !== fresh.departmentId)
          return fail("Each employee must be active and belong to the schedule's department.");
      }
      const revoked = gate.check();
      if (revoked) return fail(revoked);
      if (sessionUserId() !== actor) return fail("The signed-in account changed. Reopen the dialog.");
      written.current = true;
      const result = action === "assign" && "employeeIds" in body ? await assign(body) : action === "swap" && "newEmployeeId" in body ? await swap(body) : null;
      if (!result) return fail("The assignment command is incomplete.");
      if ("error" in result) return fail(`${apiErrorMessage(result.error)} Refresh the calendar before trying again.`);
      const after = z
        .array(assignmentSchema)
        .parse(await assignments({ ...audit, scheduleId: fresh.id, startDate: fresh.startDate, endDate: fresh.endDate }, false).unwrap());
      const invalid = assignmentProblem(after, fresh);
      if (invalid) return fail(`The request was accepted, but reconciliation failed: ${invalid}`);
      const reconciliation = "employeeIds" in body ? assignmentReconciliation(after, fresh, body) : swapReconciliation(rows, after, body);
      if (reconciliation) return fail(reconciliation);
      onDone();
      return null;
    } catch {
      return fail(
        written.current
          ? "The write or its reconciliation was not confirmed. Inspect the calendar before repeating any assignment."
          : "Current schedule and employee availability could not be verified. No assignment was sent.",
      );
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return { run, busy, error, allowed: gate.allowed };
}
