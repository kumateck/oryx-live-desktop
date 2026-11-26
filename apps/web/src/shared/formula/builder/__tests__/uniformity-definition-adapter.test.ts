import { describe, expect, it } from "vitest";

import { buildFormulaRevisionDraft } from "../definition-adapter";
import { compileFormulaDefinitionV1 } from "../../core/definition";
import { evaluateCompiledFormulaV1 } from "../../core/evaluate";
import {
  FORMULA_V1_EVALUATION_LIMITS,
  FORMULA_V1_RUNTIME_LIMITS,
} from "../../core/runtime-limits";
import { FormulaNumericScale, FormulaScope } from "../../core/contracts";

type Settings = {
  mode: "capsule" | "tablet" | "tube";
  sampleCount?: number;
  nominal?: number | null;
  decimalPlaces?: number | "";
  percent?: boolean;
};

/** The builder's settings as the question form stores them: wrapped in the option payload. */
const stored = (settings: Settings) =>
  JSON.stringify({
    type: 2,
    expression: JSON.stringify({
      type: 2,
      sampleCount: 20,
      nominal: 622.5,
      decimalPlaces: 4,
      percent: false,
      ...settings,
    }),
    variableScopes: {},
  });

const evaluate = async (
  settings: Settings,
  inputs: Record<string, string>,
) => {
  const draft = await buildFormulaRevisionDraft(stored(settings), "Uniformity");
  const compiled = compileFormulaDefinitionV1(
    draft.definition,
    FORMULA_V1_RUNTIME_LIMITS,
  );
  if (!compiled.ok) throw new Error("Uniformity fixture did not compile");
  const evaluation = evaluateCompiledFormulaV1(
    compiled.definition,
    inputs,
    FORMULA_V1_EVALUATION_LIMITS,
  );
  return Object.fromEntries(
    evaluation.results.map(({ key, roundedResult }) => [key, roundedResult]),
  );
};

/** The worksheet evaluator's arithmetic, so the governed results are checked against it. */
const legacyDeviation = (extreme: number, nominal: number, digits: number) =>
  (((extreme - nominal) / nominal) * 100).toFixed(digits);

describe("Uniformity of Weight governed definition", () => {
  it("governs capsules from content weights, matching the worksheet", async () => {
    const results = await evaluate(
      { mode: "capsule" },
      {
        capsulesWeight: "13000",
        shellsWeight: "1500",
        maximumContentWeight: "640",
        minimumContentWeight: "600",
      },
    );
    expect(results).toEqual({
      contentWeight: "11500.0000",
      averageCapsuleWeight: "650.0000",
      plusDeviation: legacyDeviation(640, 622.5, 4),
      minusDeviation: legacyDeviation(600, 622.5, 4),
    });
    expect(results.plusDeviation).toBe("2.8112");
    expect(results.minusDeviation).toBe("-3.6145");
  });

  it.each(["tablet", "tube"] as const)(
    "governs %s from the individual weights, matching the worksheet",
    async (mode) => {
      const results = await evaluate(
        { mode, sampleCount: 10, nominal: 250, decimalPlaces: 2 },
        { combinedWeight: "2510", maximumWeight: "262.5", minimumWeight: "240" },
      );
      expect(results).toEqual({
        averageWeight: "251.00",
        plusDeviation: legacyDeviation(262.5, 250, 2),
        minusDeviation: legacyDeviation(240, 250, 2),
      });
    },
  );

  it("declares every value as this question's own, and deviations as percentages", async () => {
    const draft = await buildFormulaRevisionDraft(
      stored({ mode: "tablet" }),
      "Uniformity",
    );
    expect(draft.definition.variables.map(({ key, scope }) => [key, scope])).toEqual([
      ["combinedWeight", FormulaScope.Placement],
      ["maximumWeight", FormulaScope.Placement],
      ["minimumWeight", FormulaScope.Placement],
    ]);
    const deviations = draft.definition.results.filter(({ key }) =>
      key.endsWith("Deviation"),
    );
    expect(deviations.map(({ unit, numericScale }) => [unit, numericScale])).toEqual([
      ["%", FormulaNumericScale.PercentagePoints],
      ["%", FormulaNumericScale.PercentagePoints],
    ]);
    expect(draft.testCases.length).toBeGreaterThan(0);
  });

  it("ignores the display-only percentage switch", async () => {
    const off = await buildFormulaRevisionDraft(
      stored({ mode: "capsule", percent: false }),
      "Uniformity",
    );
    const on = await buildFormulaRevisionDraft(
      stored({ mode: "capsule", percent: true }),
      "Uniformity",
    );
    expect(on.definitionHash).toBe(off.definitionHash);
  });

  it("changes the definition when the nominal weight or sample count changes", async () => {
    const base = await buildFormulaRevisionDraft(stored({ mode: "tablet" }), "Uniformity");
    const nominal = await buildFormulaRevisionDraft(
      stored({ mode: "tablet", nominal: 600 }),
      "Uniformity",
    );
    const samples = await buildFormulaRevisionDraft(
      stored({ mode: "tablet", sampleCount: 10 }),
      "Uniformity",
    );
    expect(new Set([base, nominal, samples].map((d) => d.definitionHash)).size).toBe(3);
  });

  it("uses six decimals when decimals are left automatic", async () => {
    const results = await evaluate(
      { mode: "tablet", decimalPlaces: "" },
      { combinedWeight: "12450", maximumWeight: "640", minimumWeight: "600" },
    );
    expect(results.plusDeviation).toBe("2.811245");
  });

  it.each([
    [{ mode: "tablet", nominal: null }, "nominal weight"],
    [{ mode: "capsule", nominal: 0 }, "nominal content weight"],
    [{ mode: "tablet", sampleCount: 0 }, "Sample count"],
    [{ mode: "tablet", decimalPlaces: 11 }, "Decimal places"],
  ] as const)("refuses an incomplete configuration %j", async (settings, message) => {
    await expect(
      buildFormulaRevisionDraft(stored(settings), "Uniformity"),
    ).rejects.toThrow(message);
  });
});
