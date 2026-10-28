import { describe, expect, it } from "vitest";

import {
  FORMULA_LANGUAGE_V1,
  type FormulaDefinitionV1,
  FormulaDataType,
  FormulaIssueCode,
  FormulaNumericScale,
  FormulaRoundingKind,
  FormulaScope,
  FormulaValueShape,
} from "../contracts";
import {
  compileFormulaDefinitionV1,
  hashCompiledFormulaDefinitionV1,
} from "../definition";
import { decodeFormulaDefinitionV1 } from "../decode";

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

const definition = (expression: string): FormulaDefinitionV1 => ({
  formulaLanguageVersion: FORMULA_LANGUAGE_V1,
  numericPolicyVersion: "oryx-decimal-v1-draft",
  variables: ["sampleAvg", "standardAvg"].map((key) => ({
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
      key: "assay",
      label: "Assay",
      expression,
      unit: "%",
      numericScale: FormulaNumericScale.PercentagePoints,
      rounding: { kind: FormulaRoundingKind.DecimalPlaces, digits: 2 },
    },
  ],
});

describe("compileFormulaDefinitionV1", () => {
  it("compiles declared dependencies into canonical AST", () => {
    const compiled = compileFormulaDefinitionV1(
      definition(":sampleAvg / :standardAvg * 100"),
      limits,
    );

    expect(compiled.ok).toBe(true);
    if (!compiled.ok) return;
    expect(compiled.definition.results[0]?.dependencies).toEqual([
      "sampleAvg",
      "standardAvg",
    ]);
    expect(compiled.canonical).not.toContain(":sampleAvg");
  });

  it("gives semantically identical source formatting the same hash", async () => {
    const first = compileFormulaDefinitionV1(
      definition(":sampleAvg/100.0"),
      limits,
    );
    const second = compileFormulaDefinitionV1(
      definition(" :sampleAvg / 100 "),
      limits,
    );
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    expect(await hashCompiledFormulaDefinitionV1(first.definition)).toBe(
      await hashCompiledFormulaDefinitionV1(second.definition),
    );
  });

  it("excludes labels and variable order from the executable hash", async () => {
    const firstSource = definition(":sampleAvg / :standardAvg");
    const secondSource = definition(":sampleAvg / :standardAvg");
    secondSource.variables.reverse();
    secondSource.variables[0]!.label = "A different display label";
    secondSource.results[0]!.label = "A different result label";
    const first = compileFormulaDefinitionV1(firstSource, limits);
    const second = compileFormulaDefinitionV1(secondSource, limits);
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    expect(await hashCompiledFormulaDefinitionV1(first.definition)).toBe(
      await hashCompiledFormulaDefinitionV1(second.definition),
    );
  });

  it("rejects undeclared variables", () => {
    const compiled = compileFormulaDefinitionV1(
      definition(":sampleAvg / :claim"),
      limits,
    );

    expect(compiled.ok).toBe(false);
    if (compiled.ok) return;
    expect(compiled.issues).toContainEqual(
      expect.objectContaining({
        code: FormulaIssueCode.UnknownVariable,
        variableKey: "claim",
      }),
    );
  });

  it("rejects duplicate variable and result keys", () => {
    const source = definition(":sampleAvg");
    source.variables.push({ ...source.variables[0]! });
    source.results[0]!.key = "sampleAvg";
    const compiled = compileFormulaDefinitionV1(source, limits);

    expect(compiled.ok).toBe(false);
    if (compiled.ok) return;
    expect(
      compiled.issues.filter(
        (item) => item.code === FormulaIssueCode.DuplicateKey,
      ),
    ).toHaveLength(2);
  });

  it("strictly decodes untrusted API objects", () => {
    const input = { ...definition(":sampleAvg"), unexpected: true };
    const decoded = decodeFormulaDefinitionV1(input, limits);

    expect(decoded.ok).toBe(false);
    if (decoded.ok) return;
    expect(decoded.issues[0]?.code).toBe(FormulaIssueCode.InvalidDefinition);
  });

  it("applies definition-level resource limits", () => {
    const compiled = compileFormulaDefinitionV1(definition(":sampleAvg"), {
      ...limits,
      maxVariables: 1,
    });

    expect(compiled.ok).toBe(false);
    if (compiled.ok) return;
    expect(compiled.issues).toContainEqual(
      expect.objectContaining({
        code: FormulaIssueCode.ResourceLimit,
        path: "variables",
      }),
    );
  });
});
