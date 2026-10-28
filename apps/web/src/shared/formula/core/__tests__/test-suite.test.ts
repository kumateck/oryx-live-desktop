import { describe, expect, it } from "vitest";

import {
  FORMULA_LANGUAGE_V1,
  FormulaDataType,
  FormulaEvaluationStatus,
  FormulaNumericScale,
  FormulaRoundingKind,
  FormulaScope,
  FormulaTestCategory,
  FormulaValueShape,
  compileFormulaDefinitionV1,
  type FormulaDefinitionV1,
} from "../index";
import {
  buildDefaultFormulaTestCasesV1,
  runFormulaTestCasesV1,
} from "../test-suite";

const formulaLimits = {
  maxTokens: 100,
  maxAstNodes: 100,
  maxDepth: 20,
  maxVariableReferences: 20,
  maxVariables: 20,
  maxResults: 10,
  maxKeyLength: 80,
  maxExpressionLength: 1_000,
};
const evaluationLimits = {
  maxOperations: 100,
  maxTraceSteps: 10,
  maxInputDigits: 100,
  maxResultDigits: 1_000,
};

const compiled = (expression = ":sample/:standard") => {
  const definition: FormulaDefinitionV1 = {
    formulaLanguageVersion: FORMULA_LANGUAGE_V1,
    numericPolicyVersion: "oryx-decimal-v1-half-up",
    variables: ["sample", "standard"].map((key) => ({
      key,
      label: key,
      dataType: FormulaDataType.Decimal,
      valueShape: FormulaValueShape.Scalar,
      scope: FormulaScope.Placement,
      unit: null,
      required: true,
    })),
    results: [
      {
        key: "result",
        label: "Result",
        expression,
        unit: "%",
        numericScale: FormulaNumericScale.PercentagePoints,
        rounding: { kind: FormulaRoundingKind.DecimalPlaces, digits: 2 },
      },
    ],
  };
  const result = compileFormulaDefinitionV1(definition, formulaLimits);
  if (!result.ok) throw new Error("Test definition did not compile.");
  return result.definition;
};

describe("governed formula test suite", () => {
  it("never accepts an always-divide-by-zero formula as nominally valid", () => {
    const definition = compiled(":sample / (:standard - :standard)");
    const cases = buildDefaultFormulaTestCasesV1(definition, evaluationLimits);
    const result = runFormulaTestCasesV1(definition, cases, evaluationLimits);
    expect(result.passed).toBe(false);
    expect(result.outcomes.find(({ id }) => id === "nominal")).toMatchObject({
      expectedStatus: FormulaEvaluationStatus.Valid,
      actualStatus: FormulaEvaluationStatus.DivideByZero,
      passed: false,
    });
  });

  it("rejects an error relabeled as a passing nominal or rounding case", () => {
    const definition = compiled();
    const cases = buildDefaultFormulaTestCasesV1(definition, evaluationLimits);
    for (const testCase of cases.filter(
      ({ category }) =>
        category === FormulaTestCategory.Nominal ||
        category === FormulaTestCategory.Rounding,
    )) {
      testCase.resolvedInputs.standard = "0";
      testCase.expectedStatus = FormulaEvaluationStatus.DivideByZero;
      testCase.expectedResults = {};
    }
    const result = runFormulaTestCasesV1(definition, cases, evaluationLimits);
    expect(result.passed).toBe(false);
    expect(result.outcomes[0]!.passed).toBe(false);
  });
  it("generates and passes required cases including divide by zero", () => {
    const definition = compiled();
    const cases = buildDefaultFormulaTestCasesV1(definition, evaluationLimits);
    const result = runFormulaTestCasesV1(definition, cases, evaluationLimits);

    expect(result.passed).toBe(true);
    expect(cases.map(({ category }) => category)).toEqual(
      expect.arrayContaining([
        FormulaTestCategory.Nominal,
        FormulaTestCategory.Boundary,
        FormulaTestCategory.MissingInput,
        FormulaTestCategory.InvalidInput,
        FormulaTestCategory.DivideByZero,
        FormulaTestCategory.Rounding,
      ]),
    );
  });

  it("fails when a frozen expectation does not match", () => {
    const definition = compiled();
    const cases = buildDefaultFormulaTestCasesV1(definition, evaluationLimits);
    cases[0]!.expectedResults.result = "999.00";

    const result = runFormulaTestCasesV1(definition, cases, evaluationLimits);

    expect(result.passed).toBe(false);
    expect(result.outcomes[0]).toMatchObject({
      expectedStatus: FormulaEvaluationStatus.Valid,
      passed: false,
    });
  });
});
