import { describe, expect, it } from "vitest";
import type { Employee } from "./api/employee-api";
import { EmployeeType } from "./lib/access";
import { employeeFormValues, employeePayload } from "./lib/employee-payload";
import { employeeEvidence, preservedEmploymentState } from "./lib/employee-evidence";
import { employeeSchema, emptyEmployee } from "./schemas/employee-schema";
const employee: Employee = { id: "employee-1", firstName: "Ama", lastName: "Test", gender: 0, type: 0, status: 1, inactiveStatus: 3, level: 0, staffNumber: "TEST001", dateOfBirth: "1990-01-02T00:00:00Z", dateEmployed: "2020-02-03T00:00:00Z", father: { fullName: "Father", lifeStatus: 0 }, mother: { fullName: "Mother", lifeStatus: 1 }, children: [{ fullName: "Child", gender: 0, dateOfBirth: "2010-03-04" }], siblings: [{ fullName: "Sibling", gender: 1, contact: "123" }], educationBackground: [{ schoolName: "School", major: "Science", qualificationEarned: "Certificate", startDate: "2000-01-01", endDate: "2006-01-01" }], employmentHistory: [{ companyName: "Employer", position: "Staff", startDate: "2007-01-01", endDate: "2019-01-01" }] };
describe("employee profile integrity", () => {
  it("preserves family/history and enum zero through editing", () => {
    const form = employeeFormValues(employee); const payload = employeePayload(form, EmployeeType.Casual);
    expect(payload).toMatchObject({ firstName: "Ama", type: 0, gender: 0, father: { fullName: "Father", lifeStatus: 0 }, mother: { lifeStatus: 1 }, children: [{ fullName: "Child", gender: 0 }], siblings: [{ fullName: "Sibling", gender: 1 }], educationBackground: [{ schoolName: "School", qualificationEarned: "Certificate" }], employmentHistory: [{ companyName: "Employer", position: "Staff" }] });
    expect(preservedEmploymentState(employee)).toEqual({ status: 1, inactiveStatus: 3, level: 0 });
    expect(payload).not.toHaveProperty("status");
  });
  it("detects changed employment state and missing identity instead of silently reactivating", () => {
    expect(employeeEvidence(employee)).not.toBe(employeeEvidence({ ...employee, status: 0 }));
    expect(employeeEvidence(employee)).not.toBe(employeeEvidence({ ...employee, firstName: "Changed" }));
    expect(employeeEvidence({ ...employee, id: "" })).toBeNull();
  });
  it("validates identities, card format, future birth dates and reversed histories", () => {
    expect(employeeSchema.safeParse(emptyEmployee()).success).toBe(false);
    expect(employeeSchema.safeParse({ ...employeeFormValues(employee), ghanaCardNumber: "invalid" }).success).toBe(false);
    expect(employeeSchema.safeParse({ ...employeeFormValues(employee), dateOfBirth: new Date(2100, 0, 1) }).success).toBe(false);
    expect(employeeSchema.safeParse({ ...employeeFormValues(employee), employmentHistory: [{ companyName: "Employer", position: "Staff", startDate: new Date(2020, 0, 1), endDate: new Date(2019, 0, 1) }] }).success).toBe(false);
    expect(employeeSchema.safeParse(employeeFormValues(employee)).success).toBe(true);
  });
});
