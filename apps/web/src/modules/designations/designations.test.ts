import { expect, it } from "vitest";
import { designationFormSchema, leaveTypeBody, leaveTypeFormSchema, leaveTypeRowsSchema } from "./designations";

it("keeps whether a leave type is active when it is edited, and starts a new one active", () => {
  const values = { name: "Annual", isPaid: true, deductFromBalance: false, days: 21, designations: [{ value: "g1", label: "Analyst" }] };
  // Not deducting from the balance must not switch the leave type off.
  expect(leaveTypeBody(values, null)).toEqual({ name: "Annual", isPaid: true, deductFromBalance: false, numberOfDays: 21, designationList: ["g1"], isActive: true });
  const [existing] = leaveTypeRowsSchema.parse([{ id: "l1", name: "Annual", isActive: false, deductionLimit: 5, designations: [{ id: "g1", name: "Analyst" }] }]);
  expect(leaveTypeBody(values, existing!)).toMatchObject({ isActive: false, deductionLimit: 5 });
});

it("requires a designation's departments and a sensible number of leave days", () => {
  expect(designationFormSchema.safeParse({ name: "Analyst", departments: [], leaveDays: 21 }).error?.issues[0]?.message).toBe("Choose at least one department");
  expect(designationFormSchema.safeParse({ name: "Analyst", departments: [{ value: "d", label: "QC" }], leaveDays: 0 }).error?.issues[0]?.message).toBe("The paid leave days must be more than 0");
  expect(leaveTypeFormSchema.safeParse({ name: "Sick", isPaid: true, deductFromBalance: false, days: 2.5, designations: [{ value: "g", label: "A" }] }).error?.issues[0]?.message).toBe("Use whole days");
});
