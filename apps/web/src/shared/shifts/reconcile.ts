import { assignmentKey, type Assignment, type AssignBody, type SwapBody, type Schedule } from "./contracts";
export function assignmentReconciliation(rows: Assignment[], schedule: Schedule, body: AssignBody): string | null {
  const date = new Date(`${schedule.startDate.slice(0, 10)}T00:00:00Z`);
  const end = schedule.endDate.slice(0, 10);
  const wanted = new Set(body.employeeIds);
  let count = 0;
  for (; date.toISOString().slice(0, 10) <= end; date.setUTCDate(date.getUTCDate() + 1)) {
    if (++count > 366) return "The schedule exceeds the supported 366-day reconciliation limit.";
    const day = date.toISOString().slice(0, 10);
    const row = rows.find(
      (r) => r.scheduleDate.slice(0, 10) === day && r.shiftType.shiftTypeId === body.shiftTypeId && r.shiftCategory.id === body.shiftCategoryId,
    );
    if (!row || [...wanted].some((id) => !row.employees.some((e) => e.employeeId === id)))
      return "The server accepted the assignment request but did not assign every selected employee on every schedule date. Inspect the calendar; do not repeat the batch.";
  }
  return null;
}
export function swapReconciliation(before: Assignment[], after: Assignment[], body: SwapBody): string | null {
  const target = after.find(
    (r) =>
      r.scheduleDate.slice(0, 10) === body.scheduleDate.slice(0, 10) &&
      r.shiftType.shiftTypeId === body.shiftTypeId &&
      r.shiftCategory.id === body.shiftCategoryId,
  );
  if (!target || target.employees.some((e) => e.employeeId === body.employeeId) || !target.employees.some((e) => e.employeeId === body.newEmployeeId))
    return "The replacement was not confirmed in the calendar. Inspect the current assignment before retrying.";
  const unchanged = (rows: Assignment[]) =>
    rows
      .flatMap((r) =>
        r.employees
          .filter(
            (e) =>
              !(
                r.scheduleDate.slice(0, 10) === body.scheduleDate.slice(0, 10) &&
                r.shiftType.shiftTypeId === body.shiftTypeId &&
                r.shiftCategory.id === body.shiftCategoryId &&
                (e.employeeId === body.employeeId || e.employeeId === body.newEmployeeId)
              ),
          )
          .map((e) => `${assignmentKey(r)}:${e.employeeId}`),
      )
      .sort();
  if (JSON.stringify(unchanged(before)) !== JSON.stringify(unchanged(after)))
    return "Other assignments changed during replacement. Review the complete calendar.";
  return null;
}
