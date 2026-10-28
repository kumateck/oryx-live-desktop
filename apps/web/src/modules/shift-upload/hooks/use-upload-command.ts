import { z } from "zod";
import { useRef, useState } from "react";
import { hrApi } from "@/shared/api/generated/hr";
import { settingsApi } from "@/shared/api/generated/settings";
import { readAllPages } from "@/shared/api/read-all-pages";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { sessionUserId } from "@/shared/auth/session-api";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { assignmentSchema, scheduleSchema, audit, type Schedule, type AssignBody } from "@/shared/shifts/contracts";
import { assignmentProblem, scheduleWriteProblem, day } from "@/shared/shifts/calendar";
import { assignmentReconciliation } from "@/shared/shifts/reconcile";
import { policiesSchema, batchPolicyProblem } from "@/shared/shifts/batch-policy";
import { shiftUploadApi } from "../api/upload-api";
import type { ShiftPreview } from "../lib/workbook";
export const uploadRequirement = {
  kind: "all",
  permissions: [
    "CanSubmitShiftScheduleReportUpload",
    "CanViewShiftSchedule",
    "CanViewDepartmentEmployee",
    "CanViewShiftCategories",
    "CanViewWorkingHoursPolicy",
  ],
} as const;
export function useUploadCommand() {
  const gate = usePermissionAction(uploadRequirement);
  const running = useRef(false);
  const written = useRef(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [read] = hrApi.useLazyGetApiV1ShiftSchedulesByIdQuery();
  const [employees] = hrApi.useLazyGetApiV1EmployeeDepartmentsByIdQuery();
  const [categories] = hrApi.useLazyGetApiV1ShiftCategoryQuery();
  const [policy] = settingsApi.useLazyGetApiV1WorkingHoursPolicyQuery();
  const [calendar] = hrApi.useLazyGetApiV1ShiftSchedulesByScheduleIdViewQuery();
  const [upload] = shiftUploadApi.useUploadShiftWorkbookMutation();
  const run = async (file: File, original: Schedule, preview: ShiftPreview): Promise<string | null> => {
    if (running.current) return "An import is already running.";
    const denied = gate.check();
    if (denied) return denied;
    if (written.current) return "An import was already sent. Inspect the calendar before importing any further rows.";
    const actor = sessionUserId();
    if (!actor) return "Sign in before importing shifts.";
    running.current = true;
    setBusy(true);
    setResult("");
    try {
      const fresh = scheduleSchema.parse(await read({ ...audit, id: original.id }, false).unwrap());
      if (JSON.stringify(original) !== JSON.stringify(fresh)) return "The selected schedule changed. Review it again before importing.";
      const blocked = scheduleWriteProblem(fresh);
      if (blocked) return blocked;
      if (fresh.startDate.slice(0, 10) < day(new Date())) return "Historical schedule dates cannot be imported here.";
      const [staff, allCategories, rates, existing] = await Promise.all([
        employees({ ...audit, id: fresh.departmentId }, false).unwrap(),
        readAllPages(
          (page) => categories({ ...audit, page, pageSize: 100 }, false).unwrap(),
          (r) => r.id,
          new AbortController().signal,
        ),
        policy({ ...audit }, false).unwrap(),
        calendar({ ...audit, scheduleId: fresh.id, startDate: fresh.startDate, endDate: fresh.endDate }, false).unwrap(),
      ]);
      const current = z.array(assignmentSchema).parse(existing);
      const invalid = assignmentProblem(current, fresh);
      if (invalid) return invalid;
      const policies = policiesSchema.parse(rates);
      const planned: AssignBody[] = [];
      for (const row of preview.rows) {
        const matched = staff.filter((e) => e.staffNumber?.trim().toUpperCase() === row.staff.toUpperCase() && e.department?.id === fresh.departmentId);
        if (matched.length !== 1 || !matched[0]?.id || matched[0].status !== 0)
          return `Row ${row.number}: STAFF ID must identify one active employee in the schedule's exact department.`;
        const types = fresh.shiftType.filter((t) => t.shiftName.trim().toUpperCase() === row.type.toUpperCase());
        const cats = allCategories.filter((c) => c.name?.trim().toUpperCase() === row.category.toUpperCase());
        const employeeId = matched[0].id;
        const type = types[0];
        const category = cats[0];
        if (types.length !== 1 || cats.length !== 1 || !type || !category?.id)
          return `Row ${row.number}: category and shift type must uniquely match existing values in the selected schedule.`;
        const violation = batchPolicyProblem(fresh, type.id, policies);
        if (violation) return `Row ${row.number}: ${violation}`;
        if (current.some((a) => a.employees.some((e) => e.employeeId === employeeId)))
          return `Row ${row.number}: this employee already has assignments in the schedule. Inspect the calendar before importing.`;
        planned.push({ employeeIds: [employeeId], shiftScheduleId: fresh.id, shiftCategoryId: category.id, shiftTypeId: type.id });
      }
      const revoked = gate.check();
      if (revoked) return revoked;
      if (sessionUserId() !== actor) return "The signed-in account changed. Review the import again.";
      written.current = true;
      const response = await upload({ file, departmentId: fresh.departmentId, shiftId: fresh.id });
      if ("error" in response) return `${apiErrorMessage(response.error)} Inspect the calendar before submitting another import.`;
      const after = z
        .array(assignmentSchema)
        .parse(await calendar({ ...audit, scheduleId: fresh.id, startDate: fresh.startDate, endDate: fresh.endDate }, false).unwrap());
      const problem = assignmentProblem(after, fresh);
      if (problem) return `Import accepted, but calendar verification failed: ${problem}`;
      const missing = planned.filter((body) => assignmentReconciliation(after, fresh, body));
      if (missing.length)
        return `Import accepted, but ${missing.length} of ${planned.length} employees are missing some expected dates. Inspect the calendar; do not repeat the entire file.`;
      setResult(`Verified ${planned.length} imported employees across every date in the schedule.`);
      return null;
    } catch {
      return written.current
        ? "The import or its reconciliation was not confirmed. Inspect the calendar before any further import."
        : "The current schedule, staff, categories or policy could not be verified. No import was sent.";
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return { run, busy, result, allowed: gate.allowed };
}
