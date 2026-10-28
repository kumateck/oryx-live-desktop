import { expect, it } from "vitest";
import { compensationSchema } from "./schemas/contracts";
import { salaryDefaults, salaryPayload, salarySchema, adjustmentPayload, adjustmentDurationProblem } from "./schemas/editor-schema";
const employeeId = "258da105-a506-44a9-8ff5-8d005a54f294";
it("retains all current allowance, bank and zero values but requires an explicit new effective date", () => {
  const row = compensationSchema.parse({
    id: employeeId,
    employeeId,
    basicSalary: 0,
    tier3VoluntaryEnrolled: false,
    effectiveFrom: "2026-01-01T00:00:00Z",
    totalAllowances: 0,
    bankAccountNumber: "0000123",
    allowances: [{ id: employeeId, type: 0, amount: 0, isTaxable: false }],
  });
  const values = salaryDefaults(row);
  expect(salarySchema.safeParse(values).success).toBe(false);
  const body = salaryPayload({ ...values, from: new Date(2026, 10, 1) }, employeeId);
  expect(body).toMatchObject({
    basicSalary: 0,
    bankAccountNumber: "0000123",
    tier3VoluntaryEnrolled: false,
    effectiveFrom: "2026-11-01T00:00:00Z",
    allowances: [{ type: 0, amount: 0, isTaxable: false }],
  });
});
it("maps annual relief separately from addition/deduction amounts and preserves zero type", () => {
  const values = {
    type: { value: "0", label: "Type" },
    amount: 0,
    description: "",
    recurring: false,
    taxable: false,
    from: new Date(2026, 0, 1),
    to: new Date(2026, 1, 1),
  };
  expect(adjustmentPayload(values, employeeId, "relief")).toMatchObject({ type: 0, annualAmount: 0, effectiveTo: "2026-02-01T00:00:00Z" });
  expect(adjustmentPayload({ ...values, type: { value: "6", label: "Other relief" } }, employeeId, "deduction")).toBeNull();
  expect(adjustmentDurationProblem({ ...values, to: null }, "addition")).toContain("end date");
  expect(adjustmentDurationProblem({ ...values, to: null }, "relief")).toBeNull();
});
