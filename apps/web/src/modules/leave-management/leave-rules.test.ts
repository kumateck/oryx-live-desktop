import { expect, it } from "vitest";
import { day, recallBalanceProblem, uniqueRecallTarget, leaveEvidence, mayCancel, mayRecall, mayEdit, weekdays, LeaveStatus, type Leave } from "./lib/leave";
import { leaveSchema, leaveDefaults, changeProblem } from "./schemas/leave-schema";
const employee = "258da105-a506-44a9-8ff5-8d005a54f294";
const leaveType = "558da105-a506-44a9-8ff5-8d005a54f294";
const date = (value: string) => new Date(`${value}T12:00:00`);
const base: Leave = {
  id: "request-1",
  employeeId: employee,
  leaveStatus: 0,
  requestCategory: 0,
  startDate: "2026-10-26T00:00:00Z",
  endDate: "2026-10-27T00:00:00Z",
  paidDays: 0,
  unpaidDays: 2,
  leaveTypeId: leaveType,
};
it("accepts the zero-valued leave category and preserves zero leave totals", () => {
  const values = leaveDefaults(0, base);
  expect(leaveSchema.safeParse(values).success).toBe(true);
  expect(leaveEvidence(base)).toContain(",0,0,");
  expect(mayEdit(base)).toBe(true);
});
it("allows official duty without inventing a leave type, requiring a destination", () => {
  const values = { ...leaveDefaults(3, { ...base, leaveTypeId: null }), destination: "Supplier site" };
  expect(leaveSchema.safeParse(values).success).toBe(true);
  expect(leaveSchema.safeParse({ ...values, destination: "" }).success).toBe(false);
});
it("counts weekdays exactly and validates absence contacts and duration", () => {
  expect(weekdays(date("2026-10-23"), date("2026-10-26"))).toBe(2);
  expect(weekdays(date("2026-10-19"), date("2026-11-02"))).toBe(11);
  const values = { ...leaveDefaults(1, base), contactPerson: "Contact", contactPhone: "+233 200 000 000" };
  expect(leaveSchema.safeParse(values).success).toBe(true);
  expect(leaveSchema.safeParse({ ...values, contactPhone: "" }).success).toBe(false);
  expect(leaveSchema.safeParse({ ...values, to: date("2026-10-28") }).success).toBe(false);
});
it("requires one calendar day for an exit pass and validates all date orderings", () => {
  const values = leaveDefaults(2, { ...base, leaveTypeId: null });
  expect(leaveSchema.safeParse(values).success).toBe(false);
  expect(leaveSchema.safeParse({ ...values, to: values.from }).success).toBe(true);
  expect(leaveSchema.safeParse({ ...leaveDefaults(0, base), to: date("2026-10-25") }).success).toBe(false);
});
it("cancels only future approved requests, using the server's calendar-day boundary", () => {
  expect(mayCancel({ ...base, leaveStatus: 1 }, "2026-10-25")).toBe(true);
  expect(mayCancel({ ...base, leaveStatus: 1 }, "2026-10-26")).toBe(false);
  expect(mayCancel(base, "2026-10-25")).toBe(false);
});
it("recalls only ongoing approved leave or official duty, including the final day", () => {
  expect(mayRecall({ ...base, leaveStatus: 1 }, "2026-10-27")).toBe(true);
  expect(mayRecall({ ...base, leaveStatus: 1, requestCategory: 3 }, "2026-10-27")).toBe(true);
  expect(mayRecall({ ...base, leaveStatus: 1, requestCategory: 1 }, "2026-10-27")).toBe(false);
  expect(mayRecall({ ...base, leaveStatus: 1 }, "2026-10-28")).toBe(false);
  expect(changeProblem(base, "recall", { date: date("2026-10-28"), end: null, reason: "Need staff" })).toContain("within");
});
it("preserves state evidence and allows reapplication only after rejection", () => {
  expect(leaveEvidence({ ...base, leaveStatus: LeaveStatus.Approved })).not.toBe(leaveEvidence(base));
  expect(leaveEvidence({ ...base, paidDays: 2 })).not.toBe(leaveEvidence(base));
  expect(leaveEvidence({ ...base, employeeId: "" })).toBeNull();
  expect(mayEdit({ ...base, leaveStatus: LeaveStatus.Cancelled })).toBe(false);
  const values = { date: date("2026-11-02"), end: date("2026-11-03"), reason: "New dates" };
  expect(changeProblem(base, "reapply", values)).toContain("rejected");
  expect(changeProblem({ ...base, leaveStatus: 2 }, "reapply", values)).toBeNull();
  expect(day(values.date)).toBe("2026-11-02");
});

it("refuses employee-only recall when another historical approved request could be selected", () => {
  const approved = { ...base, leaveStatus: LeaveStatus.Approved };
  expect(uniqueRecallTarget(approved, [approved])).toBe(true);
  expect(uniqueRecallTarget(approved, [approved, { ...approved, id: "old-request", startDate: "2020-01-01", endDate: "2020-01-02" }])).toBe(false);
  expect(uniqueRecallTarget(approved, [{ ...approved, id: "different" }])).toBe(false);
  expect(uniqueRecallTarget(approved, [approved, { ...approved, id: "other-employee", employeeId: "other" }])).toBe(true);
});

it("does not recall official duty or non-deducting leave through the server's unconditional balance-credit command", () => {
  expect(recallBalanceProblem({ ...base, requestCategory: 3 })).toContain("credits annual leave");
  expect(recallBalanceProblem({ ...base, leaveType: { deductFromBalance: false } })).not.toBeNull();
  expect(recallBalanceProblem({ ...base, leaveType: { deductFromBalance: true } })).toBeNull();
});
