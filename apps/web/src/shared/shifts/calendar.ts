import { CalendarMode, assignmentKey, type Assignment, type Schedule } from "./contracts";
export const day = (v: Date): string => `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}`;
export function calendarRange(anchor: Date, mode: CalendarMode): { from: string; to: string } {
  const from = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  const to = new Date(from);
  if (mode === CalendarMode.Week) {
    from.setDate(from.getDate() - ((from.getDay() + 6) % 7));
    to.setTime(from.getTime());
    to.setDate(to.getDate() + 6);
  }
  if (mode === CalendarMode.Month) {
    from.setDate(1);
    to.setMonth(to.getMonth() + 1, 0);
  }
  if (mode === CalendarMode.Year) {
    from.setMonth(0, 1);
    to.setMonth(11, 31);
  }
  return { from: day(from), to: day(to) };
}
export function assignmentProblem(rows: Assignment[], schedule: Schedule): string | null {
  const keys = new Set<string>();
  for (const row of rows) {
    const key = assignmentKey(row);
    if (keys.has(key)) return "The calendar contains repeated assignment groups. Refresh and reconcile before making changes.";
    keys.add(key);
    if (row.shiftSchedule.scheduleId !== schedule.id || !schedule.shiftType.some((s) => s.id === row.shiftType.shiftTypeId))
      return "The server returned an assignment outside this schedule or its shift types.";
    if (new Set(row.employees.map((e) => e.employeeId)).size !== row.employees.length)
      return "An assignment contains a repeated employee. Reconcile the source before changing it.";
    const date = row.scheduleDate.slice(0, 10);
    if (date < schedule.startDate.slice(0, 10) || date > schedule.endDate.slice(0, 10))
      return "An assignment date is outside the schedule period. Reconcile the source before changing it.";
  }
  return null;
}
export function visibleAssignments(rows: Assignment[], anchor: Date, mode: CalendarMode): Assignment[] {
  const range = calendarRange(anchor, mode);
  return rows
    .filter((r) => r.scheduleDate.slice(0, 10) >= range.from && r.scheduleDate.slice(0, 10) <= range.to)
    .sort((a, b) => assignmentKey(a).localeCompare(assignmentKey(b)));
}
export function scheduleWriteProblem(schedule: Schedule, now = new Date()): string | null {
  if (schedule.scheduleStatus === 3 || schedule.scheduleStatus === 4) return "Cancelled or expired schedules cannot receive assignment changes.";
  if (schedule.endDate.slice(0, 10) < day(now)) return "This schedule ended. Historical assignments cannot be changed here.";
  return null;
}
