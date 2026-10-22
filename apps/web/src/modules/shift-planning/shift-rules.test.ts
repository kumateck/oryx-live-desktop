import { expect, it } from "vitest";
import { CalendarMode, ScheduleStatus, type Schedule, type Assignment } from "./schemas/contracts";
import { calendarRange, visibleAssignments, assignmentProblem } from "./lib/calendar";
import { assignmentReconciliation, swapReconciliation } from "./lib/reconcile";
import { batchPolicyProblem, type ShiftPolicy } from "./lib/batch-policy";
const id = "01a152ee-6948-7e40-a0f0-8c01e2a43ea9";
const employeeId = "79e15fc7-4f91-45e3-abbb-330d35956510";
const schedule: Schedule = {
  id,
  scheduleName: "Week",
  startDate: "2099-01-05T00:00:00Z",
  endDate: "2099-01-06T00:00:00Z",
  frequency: 0,
  departmentId: id,
  scheduleStatus: ScheduleStatus.New,
  shiftType: [{ id, shiftName: "Day", startTime: "08:00:00", endTime: "16:00:00" }],
};
const row: Assignment = {
  employees: [{ employeeId, firstName: "Employee" }],
  scheduleDate: schedule.startDate,
  shiftCategory: { id, name: "A" },
  shiftType: { shiftTypeId: id, shiftName: "Day" },
  shiftSchedule: { scheduleId: id, scheduleName: "Week", startDate: schedule.startDate, endDate: schedule.endDate },
};
const body = { shiftScheduleId: id, shiftCategoryId: id, shiftTypeId: id, employeeIds: [employeeId] };
it("filters actual dates despite the server returning every assignment for a day query", () => {
  const rows = [row, { ...row, scheduleDate: schedule.endDate }];
  expect(visibleAssignments(rows, new Date("2099-01-05T00:00:00"), CalendarMode.Day)).toEqual([row]);
  expect(calendarRange(new Date("2026-10-21T00:00:00"), CalendarMode.Week)).toEqual({ from: "2026-10-19", to: "2026-10-25" });
  expect(calendarRange(new Date("2024-02-15T00:00:00"), CalendarMode.Month)).toEqual({ from: "2024-02-01", to: "2024-02-29" });
});
it("rejects duplicate employee groups, foreign schedule identity and out-of-range dates", () => {
  expect(assignmentProblem([row], schedule)).toBeNull();
  expect(assignmentProblem([row, row], schedule)).toMatch(/repeated/);
  expect(assignmentProblem([{ ...row, employees: [...row.employees, ...row.employees] }], schedule)).toMatch(/repeated employee/);
  expect(assignmentProblem([{ ...row, scheduleDate: "2100-01-01T00:00:00Z" }], schedule)).toMatch(/outside/);
});
it("does not report full batch completion when a day or employee was skipped", () => {
  expect(assignmentReconciliation([row], schedule, body)).toMatch(/did not assign every/);
  expect(assignmentReconciliation([row, { ...row, scheduleDate: schedule.endDate }], schedule, body)).toBeNull();
});
it("verifies a replacement and preserves all other assignments", () => {
  const newId = "02157256-a433-4895-a50d-ea5d67beb3b9";
  const command = { shiftScheduleId: id, shiftCategoryId: id, shiftTypeId: id, scheduleDate: row.scheduleDate, employeeId, newEmployeeId: newId };
  expect(swapReconciliation([row], [{ ...row, employees: [{ employeeId: newId }] }], command)).toBeNull();
  expect(swapReconciliation([row], [row], command)).toMatch(/not confirmed/);
});
it("checks the whole proposed batch against weekly limits rather than one new shift at a time", () => {
  const policy: ShiftPolicy = {
    id,
    maxHoursPerDay: 8,
    maxHoursPerWeek: 40,
    minDailyRestHours: 12,
    minWeeklyRestHours: 48,
    effectiveFrom: "2098-01-01T00:00:00Z",
    effectiveTo: null,
  };
  expect(batchPolicyProblem(schedule, id, [policy])).toBeNull();
  expect(batchPolicyProblem({ ...schedule, startDate: "2099-01-05T00:00:00Z", endDate: "2099-01-11T00:00:00Z" }, id, [policy])).toMatch(/weekly/);
  expect(
    batchPolicyProblem({ ...schedule, shiftType: [{ ...schedule.shiftType[0], id, shiftName: "Long", startTime: "08:00:00", endTime: "23:00:00" }] }, id, [
      policy,
    ]),
  ).toMatch(/daily/);
});
