import { describe, expect, it } from "vitest";
import { validationMessage } from "@/modules/questions/lib/formula-question";
import { formulaValidationSchema, validationPassed } from "./governance-api";

// Shaped like the backend's relayed calculation-service reply: outcomes carry no resolvedInputs and errors carry a null variableKey.
const backendReply = {
  status: 5, statusName: "Completed", definitionIssues: [], requestIssues: [], evaluatorVersion: "oryx-formula-evaluator-v1", engineBuildHash: "af42",
  testOutcomes: [
    { id: "nominal", name: "Nominal calculation", category: 0, passed: true, expectedStatus: 0, actualStatus: 0,
      expectedResults: { sample1: "8928.57" }, actualResults: { sample1: "8928.57" }, errors: [] },
    { id: "zero", name: "Zero denominator rejected", category: 4, passed: true, expectedStatus: 3, actualStatus: 3,
      expectedResults: {}, actualResults: {}, errors: [{ status: 3, path: "results.sample1", message: "Division by zero.", variableKey: null }] },
  ],
};

describe("formula validation reply", () => {
  it("keeps the server's outcomes when they carry no resolved inputs", () => {
    const validation = formulaValidationSchema.parse(backendReply);
    expect(validation.testOutcomes).toHaveLength(2);
    expect(validation.testOutcomes[1]?.errors[0]?.message).toBe("Division by zero.");
    expect(validationPassed(validation)).toBe(true);
  });

  it("explains a completed reply with no outcomes instead of showing its status name", () => {
    const validation = formulaValidationSchema.parse({ ...backendReply, testOutcomes: [] });
    expect(validationPassed(validation)).toBe(false);
    expect(validationMessage(validation, true)).toMatch(/no calculation check results/);
  });
});
