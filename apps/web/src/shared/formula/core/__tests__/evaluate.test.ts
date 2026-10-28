import { describe, expect, it } from "vitest";

import {
  FORMULA_LANGUAGE_V1,
  type FormulaDefinitionV1,
  FormulaDataType,
  FormulaNumericScale,
  FormulaRoundingKind,
  FormulaScope,
  FormulaValueShape,
} from "../contracts";
import { compileFormulaDefinitionV1 } from "../definition";
import { evaluateCompiledFormulaV1 } from "../evaluate";
import { FormulaEvaluationStatus } from "../evaluation-contracts";

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

const compiled = (
  expression: string,
  minimum?: string,
  inputDecimalPlaces?: number,
) => {
  const definition: FormulaDefinitionV1 = {
    formulaLanguageVersion: FORMULA_LANGUAGE_V1,
    numericPolicyVersion: "oryx-decimal-v1-draft",
    ...(inputDecimalPlaces === undefined
      ? {}
      : {
          precisionPolicy: {
            inputDecimalPlaces,
            tableCalculationDecimalPlaces: 4,
          },
        }),
    variables: ["a", "b"].map((key) => ({
      key,
      label: key,
      dataType: FormulaDataType.Decimal,
      valueShape: FormulaValueShape.Scalar,
      scope: FormulaScope.Placement,
      unit: null,
      required: true,
      ...(key === "a" && minimum ? { validation: { minimum } } : {}),
    })),
    results: [
      {
        key: "result",
        label: "Result",
        expression,
        unit: null,
        numericScale: FormulaNumericScale.Absolute,
        rounding: { kind: FormulaRoundingKind.DecimalPlaces, digits: 2 },
      },
    ],
  };
  const result = compileFormulaDefinitionV1(definition, formulaLimits);
  if (!result.ok) throw new Error("Test definition did not compile.");
  return result.definition;
};

describe("candidate scalar evaluator", () => {
  it("evaluates exact arithmetic with bounded trace and governed rounding", () => {
    const result = evaluateCompiledFormulaV1(
      compiled(":a/:b"),
      { a: "1", b: "3" },
      evaluationLimits,
    );

    expect(result.status).toBe(FormulaEvaluationStatus.Valid);
    expect(result.results[0]).toEqual(
      expect.objectContaining({ exactResult: "1/3", roundedResult: "0.33" }),
    );
    expect(result.trace).toHaveLength(1);
  });

  it.each([
    [{ b: "2" }, FormulaEvaluationStatus.MissingInput],
    [{ a: "not-a-number", b: "2" }, FormulaEvaluationStatus.InvalidInput],
    [{ a: "1", b: "0" }, FormulaEvaluationStatus.DivideByZero],
    [{ a: "1", b: "2", c: "3" }, FormulaEvaluationStatus.InvalidInput],
  ])("fails closed for %o", (inputs, status) => {
    expect(
      evaluateCompiledFormulaV1(compiled(":a/:b"), inputs, evaluationLimits)
        .status,
    ).toBe(status);
  });

  it("enforces declared input bounds", () => {
    const result = evaluateCompiledFormulaV1(
      compiled(":a+:b", "0"),
      { a: "-0.1", b: "2" },
      evaluationLimits,
    );

    expect(result.status).toBe(FormulaEvaluationStatus.OutOfRange);
  });

  it("rejects input values beyond the controlled decimal scale", () => {
    const result = evaluateCompiledFormulaV1(
      compiled(":a+:b", undefined, 2),
      { a: "1.234", b: "2" },
      evaluationLimits,
    );

    expect(result.status).toBe(FormulaEvaluationStatus.InvalidInput);
    expect(result.errors[0]?.message).toContain("exceeds 2 decimal places");
  });

  it("caps trace independently from the operation limit", () => {
    const result = evaluateCompiledFormulaV1(
      compiled(":a+:b+:a"),
      { a: "1", b: "2" },
      { ...evaluationLimits, maxTraceSteps: 1 },
    );

    expect(result.status).toBe(FormulaEvaluationStatus.Valid);
    expect(result.operationCount).toBe(2);
    expect(result.trace).toHaveLength(1);
    expect(result.traceTruncated).toBe(true);
  });
});
