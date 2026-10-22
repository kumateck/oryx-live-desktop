import { expect, it } from "vitest";
import { staffDefaults, staffSchema, staffPayload } from "./schemas/staff-schema";
import { staffEvidence, mayChangeStaff, type StaffRequest } from "./lib/staff";
const id = "258da105-a506-44a9-8ff5-8d005a54f294";
const row: StaffRequest = {
  id,
  departmentId: id,
  designationId: id,
  staffRequired: 2,
  qualification: "Qualified",
  educationalQualification: "Diploma",
  appointmentType: 0,
  budgetStatus: 0,
  staffRequisitionStatus: 0,
  requestUrgency: "2026-11-01T09:30:00Z",
  additionalRequests: "Other request",
  additionalRequirements: "Requirement",
};
it("preserves both zero enums, distinct request text, and an unchanged deadline timestamp", () => {
  const values = staffDefaults(row);
  expect(staffSchema.safeParse(values).success).toBe(true);
  expect(staffPayload(values, row)).toMatchObject({
    appointmentType: 0,
    budgetStatus: 0,
    additionalRequests: "Other request",
    additionalRequirements: "Requirement",
    requestUrgency: row.requestUrgency,
  });
  expect(staffPayload(values, null)?.requestUrgency).toBe("2026-11-01T23:59:59Z");
});
it("requires a positive whole staff count, both qualification fields and an actual appointment selection", () => {
  const values = staffDefaults(row);
  for (const invalid of [{ staff: 1.5 }, { staff: 0 }, { education: "" }, { qualification: "x".repeat(256) }, { appointment: null }])
    expect(staffSchema.safeParse({ ...values, ...invalid }).success).toBe(false);
});
it("preserves closed workflow evidence and refuses edits to approved, rejected and expired requests", () => {
  expect(mayChangeStaff(row)).toBe(true);
  expect(mayChangeStaff({ ...row, staffRequisitionStatus: 1 })).toBe(true);
  for (const staffRequisitionStatus of [2, 3, 4] as const) expect(mayChangeStaff({ ...row, staffRequisitionStatus })).toBe(false);
  expect(staffEvidence(row)).not.toBe(staffEvidence({ ...row, budgetStatus: 1 }));
  expect(staffEvidence(row)).not.toBe(staffEvidence({ ...row, additionalRequests: "Different" }));
});
