import { expect, it } from "vitest";
import { minutes, overtimeDuration, overtimeEvidence, type Overtime } from "./lib/overtime";
import { overtimeDefaults, overtimeSchema, overtimePayload } from "./schemas/overtime-schema";
const id = "258da105-a506-44a9-8ff5-8d005a54f294";
const row: Overtime = {
  id,
  code: "OT001",
  departmentId: id,
  employees: [{ id }],
  overtimeDate: "2026-11-01T00:00:00Z",
  startTime: "01:30 PM",
  endTime: "03:00 PM",
  status: 0,
};
it("preserves pending status, converts clock fields to the backend's 12-hour format, and retains employee IDs", () => {
  const values = overtimeDefaults(row);
  expect(overtimeSchema.safeParse(values).success).toBe(true);
  expect(overtimePayload(values)).toMatchObject({ code: "OT001", startTime: "1:30 PM", endTime: "3:00 PM", departmentId: id, employeeIds: [id] });
  expect(overtimeEvidence(row)).not.toBeNull();
  expect(overtimeEvidence({ ...row, status: 1 })).not.toBe(overtimeEvidence(row));
});
it("calculates fractional same-day hours without copying the backend's truncation or negative overnight totals", () => {
  expect(overtimeDuration("1:30 PM", "3:00 PM")).toBe(1.5);
  expect(minutes("12:00 AM")).toBe(0);
  expect(minutes("12:00 PM")).toBe(720);
  expect(minutes("00:30 AM")).toBeNull();
  expect(minutes("13:30 PM")).toBeNull();
  expect(overtimeDuration("11:00 PM", "1:00 AM")).toBeNull();
  expect(overtimeDuration("1:00 PM", "1:00 PM")).toBeNull();
});
it("rejects duplicate or missing employees and an invalid same-day period", () => {
  const values = overtimeDefaults(row);
  expect(overtimeSchema.safeParse({ ...values, employees: [...values.employees, ...values.employees] }).success).toBe(false);
  expect(overtimeSchema.safeParse({ ...values, employees: [] }).success).toBe(false);
  expect(overtimeSchema.safeParse({ ...values, start: "11:00 PM", end: "1:00 AM" }).success).toBe(false);
  expect(overtimeEvidence({ ...row, employees: [{}] })).toBeNull();
});
