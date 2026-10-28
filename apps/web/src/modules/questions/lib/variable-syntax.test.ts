import { describe, expect, it } from "vitest";

import {
  findBareFormulaVariableNames,
  findBareVariableNames,
  getFormulaVariableSyntaxError,
} from "./variable-syntax";
import { questionFormulaSchema } from "../schemas/formula-question-schema";

describe("formula variable syntax", () => {
  it("flags words entered without the variable prefix", () => {
    expect(findBareVariableNames("((1/2)*(stdconc/splconc))*purity")).toEqual([
      "stdconc",
      "splconc",
      "purity",
    ]);
  });

  it("accepts prefixed variables, function calls, and scientific notation", () => {
    expect(
      findBareVariableNames("sqrt(:stdconc / :splconc) * :purity + 1e-3"),
    ).toEqual([]);
  });

  it("validates the main and nested universal expressions", () => {
    const payload = JSON.stringify({
      expression: ":purity * 2",
      columnExpressions: {
        1: { enabled: true, expression: "sampleWeight / :standardWeight" },
      },
      manualVarExpressions: { factor: ":a + correction" },
    });

    expect(findBareFormulaVariableNames(payload)).toEqual([
      "sampleWeight",
      "correction",
    ]);
  });

  it("does not mistake formula JSON property names for variables", () => {
    const payload = JSON.stringify({
      type: 3,
      expression: ":stdconc / :splconc * :purity",
      calculateAvgInTable: true,
    });

    expect(getFormulaVariableSyntaxError(payload)).toBeNull();
  });

  it("returns a correction message for every bare variable", () => {
    expect(getFormulaVariableSyntaxError(":stdconc / splconc * purity")).toBe(
      'Variables must start with ":". Change splconc to :splconc, purity to :purity.',
    );
  });

  it("blocks the question form when an expression contains a bare variable", () => {
    const result = questionFormulaSchema.safeParse({
      label: "Assay",
      description: "",
      reference: "",
      formulaType: { label: "Simple", value: "0" },
      expression: JSON.stringify({ expression: ":stdconc / splconc" }),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.expression?.[0]).toContain(
        "splconc to :splconc",
      );
    }
  });
});
