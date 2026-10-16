import { describe, expect, it } from "vitest";

import {
  FORMULA_NUMERIC_POLICY_V1,
  buildFormulaRevisionDraft,
} from "../definition-adapter";

describe("formula builder definition adapter", () => {
  it("compiles Universal sample statistics into distinct governed results", async () => {
    const draft = await buildFormulaRevisionDraft(
      JSON.stringify({
        type: 3,
        expression: ":sampleAvg/:standardAvg",
        standardInTable: true,
        noOfSamples: 2,
        decimalPlaces: 3,
        inputDecimalPlaces: 4,
        tableCalculationDecimalPlaces: 5,
        finalResultDecimalPlaces: 6,
      }),
      "Universal",
    );
    expect(draft.definition.results.map((result) => result.expression)).toEqual(
      [":sample1Avg/:standardAvg", ":sample2Avg/:standardAvg"],
    );
    expect(draft.definition.variables.map((variable) => variable.key)).toEqual([
      "sample1Avg",
      "sample2Avg",
      "standardAvg",
    ]);
    expect(draft.definition.precisionPolicy).toEqual({
      inputDecimalPlaces: 4,
      tableCalculationDecimalPlaces: 5,
    });
    expect(draft.definition.results[0]?.rounding.digits).toBe(6);
  });

  it("expands an unambiguous legacy bare sample input", async () => {
    const draft = await buildFormulaRevisionDraft(
      JSON.stringify({
        type: 3,
        expression: ":sampleAvg/:sampleInput",
        standardInTable: true,
        noOfSamples: 2,
        sampleInputs: [
          [{ key: "wt", label: "Weight (g)", value: "" }],
          [{ key: "wt", label: "Weight (g)", value: "" }],
        ],
      }),
      "Universal",
    );

    expect(draft.definition.results.map((result) => result.expression)).toEqual(
      [":sample1Avg/:sampleInput1.wt", ":sample2Avg/:sampleInput2.wt"],
    );
  });

  it("materializes per-sample named expressions without turning them into inputs", async () => {
    const draft = await buildFormulaRevisionDraft(
      JSON.stringify({
        type: 3,
        variableKeyFormat: 1,
        expression: ":normalized * 100",
        standardInTable: false,
        noOfSamples: 2,
        sampleInput: true,
        sampleInputs: [
          [{ key: "weight", label: "Weight", value: "" }],
          [{ key: "weight", label: "Weight", value: "" }],
        ],
        namedExpressionsEnabled: true,
        namedExpressions: [
          {
            key: "normalized",
            label: "Normalized result",
            expression: ":sampleAvg / :sampleWeight",
            scope: 1,
          },
        ],
      }),
      "Universal",
    );

    expect(draft.definition.derivedExpressions ?? []).toEqual([
      expect.objectContaining({
        key: "sample1Normalized",
        expression: ":sample1Avg / :sample1Weight",
      }),
      expect.objectContaining({
        key: "sample2Normalized",
        expression: ":sample2Avg / :sample2Weight",
      }),
    ]);
    expect(
      draft.definition.results.map(({ expression }) => expression),
    ).toEqual([":sample1Normalized * 100", ":sample2Normalized * 100"]);
    expect(draft.definition.variables.map(({ key }) => key)).not.toContain(
      "sample1Normalized",
    );
  });

  it("normalizes legacy input aliases in a new alphanumeric definition", async () => {
    const draft = await buildFormulaRevisionDraft(
      JSON.stringify({
        expression: ":standardInput.wt / :sampleInput.wt",
        variableKeyFormat: 1,
        standardInTable: true,
        noOfSamples: 2,
        standardInputs: [{ key: "weight", label: "Weight", value: "" }],
        sampleInputs: [
          [{ key: "weight", label: "Weight", value: "" }],
          [{ key: "weight", label: "Weight", value: "" }],
        ],
      }),
      "Universal",
    );

    expect(
      draft.definition.results.map(({ expression }) => expression),
    ).toEqual([
      ":standardWeight / :sample1Weight",
      ":standardWeight / :sample2Weight",
    ]);
    expect(draft.definition.variables.map(({ key }) => key)).toEqual([
      "sample1Weight",
      "sample2Weight",
      "standardWeight",
    ]);
    expect(draft.definition.variables.map(({ label }) => label)).toEqual([
      "Sample 1 Weight",
      "Sample 2 Weight",
      "Standard Weight",
    ]);
  });

  it("rejects symbols in keys for new definitions", async () => {
    await expect(
      buildFormulaRevisionDraft(
        JSON.stringify({
          expression: ":batch_value + 1",
          variableKeyFormat: 1,
          standardInTable: false,
          noOfSamples: 1,
        }),
        "Universal",
      ),
    ).rejects.toThrow("letters and numbers only");
  });

  it("rejects circular named expressions", async () => {
    await expect(
      buildFormulaRevisionDraft(
        JSON.stringify({
          expression: ":first",
          standardInTable: false,
          noOfSamples: 1,
          namedExpressionsEnabled: true,
          namedExpressions: [
            {
              key: "first",
              label: "First",
              expression: ":second + :amount",
              scope: 0,
            },
            {
              key: "second",
              label: "Second",
              expression: ":first + 1",
              scope: 0,
            },
          ],
        }),
        "Universal",
      ),
    ).rejects.toThrow("circular dependency");
  });

  it("rejects invalid Universal decimal controls", async () => {
    await expect(
      buildFormulaRevisionDraft(
        JSON.stringify({
          expression: ":sampleAvg/:standardAvg",
          standardInTable: true,
          inputDecimalPlaces: 2.5,
        }),
        "Universal",
      ),
    ).rejects.toThrow("Input decimal places");
  });

  it("compiles a sample-only Universal worksheet without shifting columns", async () => {
    const draft = await buildFormulaRevisionDraft(
      JSON.stringify({
        expression: ":sampleAvg+:R1sample",
        standardInTable: false,
        noOfSamples: 2,
      }),
      "Universal",
    );

    expect(draft.definition.worksheetPolicy).toEqual({
      standardInTable: false,
    });
    expect(draft.definition.results.map((result) => result.expression)).toEqual(
      [":sample1Avg+:R1sample1", ":sample2Avg+:R1sample2"],
    );
  });

  it("rejects standard-column tokens when the first column is disabled", async () => {
    await expect(
      buildFormulaRevisionDraft(
        JSON.stringify({
          expression: ":sampleAvg/:standardAvg",
          standardInTable: false,
        }),
        "Universal",
      ),
    ).rejects.toThrow("standard-column value");
  });

  it("rejects cyclic and incomplete derived Universal columns", async () => {
    await expect(
      buildFormulaRevisionDraft(
        JSON.stringify({ expression: ":sampleAvg", formulaInTable: true }),
        "Universal",
      ),
    ).rejects.toThrow("unique worksheet headers");
    await expect(
      buildFormulaRevisionDraft(
        JSON.stringify({
          expression: ":sampleAvg",
          formulaInTable: true,
          headers: ["A", "B"],
          columnExpressions: {
            0: { enabled: true, expression: ":B + 1" },
            1: { enabled: true, expression: ":A + 1" },
          },
        }),
        "Universal",
      ),
    ).rejects.toThrow("cycle");
  });

  it("keeps non-Universal worksheet behavior fail-closed", async () => {
    await expect(
      buildFormulaRevisionDraft(
        JSON.stringify({ expression: ":sampleAvg/:standardAvg" }),
        "Uniformity",
      ),
    ).rejects.toThrow("No formula has been saved or converted");
  });

  it("detects worksheet settings even under the Simple preset", async () => {
    await expect(
      buildFormulaRevisionDraft(
        JSON.stringify({ expression: ":a+1", tableData: [["1"]] }),
        "Simple",
      ),
    ).rejects.toThrow("worksheet/source-aware execution");
  });

  it("allows inactive shared fields in a Simple editor payload", async () => {
    const draft = await buildFormulaRevisionDraft(
      JSON.stringify({
        type: 0,
        expression: ":a+1",
        constants: {},
        tableData: [],
        standardInTable: false,
      }),
      "Simple",
    );
    expect(draft.definition.results[0]?.expression).toBe(":a+1");
  });

  it("creates a deterministic governed definition from a legacy payload", async () => {
    const payload = JSON.stringify({
      type: 0,
      expression: ":weight/:volume",
      decimalPlaces: 3,
      variables: {
        weight: { label: "Weight" },
        volume: { label: "Volume" },
      },
    });

    const first = await buildFormulaRevisionDraft(payload, "Simple");
    const second = await buildFormulaRevisionDraft(payload, "Simple");

    expect(first.definitionHash).toBe(second.definitionHash);
    expect(first.numericPolicyVersion).toBe(FORMULA_NUMERIC_POLICY_V1);
    expect(first.definition.variables.map((item) => item.key)).toEqual([
      "volume",
      "weight",
    ]);
    expect(first.definition.results[0]?.rounding.digits).toBe(3);
    expect(first.testCases.length).toBeGreaterThanOrEqual(5);
    expect(first.testCases).toEqual(second.testCases);
  });

  it("unwraps the nested payload emitted by the current question editor", async () => {
    const nested = JSON.stringify({
      type: 0,
      expression: JSON.stringify({ expression: ":a+1", decimalPlaces: 2 }),
    });

    const draft = await buildFormulaRevisionDraft(nested, "Simple");

    expect(draft.definition.results[0]?.expression).toBe(":a+1");
  });

  it("refuses expressions outside the governed language", async () => {
    await expect(
      buildFormulaRevisionDraft(
        JSON.stringify({ expression: "sqrt(:a)", decimalPlaces: 2 }),
        "Simple",
      ),
    ).rejects.toThrow("cannot be governed by v1");
  });
});
