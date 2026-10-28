import { describe, expect, it } from "vitest";
import { formulaValidationIdentity } from "../validation-identity";
import { FORMULA_TEST_CASES_V1, FormulaTestCategory } from "../test-contracts";
import { FormulaEvaluationStatus } from "../evaluation-contracts";

describe("validation display identity", () => {
  const revision = {
    id: "revision-1",
    definitionHash: "a".repeat(64),
    testCases: [
      {
        schemaVersion: FORMULA_TEST_CASES_V1,
        id: "nominal",
        name: "Independent reference case",
        category: FormulaTestCategory.Nominal,
        resolvedInputs: { x: "1" },
        expectedStatus: FormulaEvaluationStatus.Valid,
        expectedResults: { result: "2.00" },
      },
    ],
  };

  it("does not reuse outcomes after definition, revision, or expectation changes", () => {
    const initial = formulaValidationIdentity(revision);
    expect(formulaValidationIdentity(structuredClone(revision))).toBe(initial);
    expect(
      formulaValidationIdentity({ ...revision, id: "revision-2" }),
    ).not.toBe(initial);
    expect(
      formulaValidationIdentity({
        ...revision,
        definitionHash: "b".repeat(64),
      }),
    ).not.toBe(initial);
    const changed = structuredClone(revision);
    changed.testCases[0]!.expectedResults.result = "3.00";
    expect(formulaValidationIdentity(changed)).not.toBe(initial);
  });
});
