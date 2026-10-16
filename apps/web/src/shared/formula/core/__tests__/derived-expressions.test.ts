import { describe, expect, it } from "vitest";

import {
  FORMULA_LANGUAGE_V1,
  FormulaDataType,
  FormulaIssueCode,
  FormulaNumericScale,
  FormulaRoundingKind,
  FormulaScope,
  FormulaValueShape,
  type FormulaDefinitionV1,
} from "../contracts";
import { compileFormulaDefinitionV1 } from "../definition";
import { evaluateCompiledFormulaV1 } from "../evaluate";
import { FormulaEvaluationStatus } from "../evaluation-contracts";

const limits = {
  maxTokens: 100,
  maxAstNodes: 100,
  maxDepth: 20,
  maxVariableReferences: 20,
  maxVariables: 20,
  maxResults: 10,
  maxKeyLength: 80,
  maxExpressionLength: 1_000,
};

const source = (): FormulaDefinitionV1 => ({
  formulaLanguageVersion: FORMULA_LANGUAGE_V1,
  numericPolicyVersion: "oryx-decimal-v1-half-up",
  variables: ["amount", "divisor"].map((key) => ({
    key,
    label: key,
    dataType: FormulaDataType.Decimal,
    valueShape: FormulaValueShape.Scalar,
    scope: FormulaScope.Placement,
    unit: null,
    required: true,
  })),
  derivedExpressions: [
    { key: "doubled", label: "Doubled", expression: ":ratio * 2", unit: null },
    {
      key: "ratio",
      label: "Ratio",
      expression: ":amount / :divisor",
      unit: null,
    },
  ],
  results: [
    {
      key: "result",
      label: "Result",
      expression: ":doubled + 1",
      unit: null,
      numericScale: FormulaNumericScale.Absolute,
      rounding: { kind: FormulaRoundingKind.DecimalPlaces, digits: 2 },
    },
  ],
});

describe("governed derived expressions", () => {
  it("orders dependencies and evaluates them before final results", () => {
    const compiled = compileFormulaDefinitionV1(source(), limits);
    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;
    expect(
      compiled.definition.derivedExpressions?.map(({ key }) => key),
    ).toEqual(["ratio", "doubled"]);

    const evaluation = evaluateCompiledFormulaV1(
      compiled.definition,
      { amount: "9", divisor: "3" },
      {
        maxOperations: 100,
        maxTraceSteps: 20,
        maxInputDigits: 100,
        maxResultDigits: 100,
      },
    );
    expect(evaluation.status).toBe(FormulaEvaluationStatus.Valid);
    expect(evaluation.results[0]?.roundedResult).toBe("7.00");
    expect(evaluation.trace.map(({ operation }) => operation)).toContain(
      "DERIVED:ratio",
    );
  });

  it("rejects a dependency cycle", () => {
    const cyclic = source();
    cyclic.derivedExpressions = [
      { key: "first", label: "First", expression: ":second", unit: null },
      { key: "second", label: "Second", expression: ":first", unit: null },
    ];
    cyclic.results[0]!.expression = ":first";
    const compiled = compileFormulaDefinitionV1(cyclic, limits);
    expect(compiled.ok).toBe(false);
    if (compiled.ok) return;
    expect(compiled.issues).toContainEqual(
      expect.objectContaining({ code: FormulaIssueCode.CyclicDependency }),
    );
  });
});
