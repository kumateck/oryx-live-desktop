import { describe, expect, it } from "vitest";

import { formatFormulaEquationResult } from "../formula-result-display";

describe("formatFormulaEquationResult", () => {
  it("inserts each percentage formula result instead of coercing it to zero", () => {
    expect(
      formatFormulaEquationResult({
        value: 0.3538125,
        percentageResults: true,
        decimalPlaces: 2,
      }),
    ).toBe("35.38%");
    expect(
      formatFormulaEquationResult({
        value: 0.10483333333333333,
        percentageResults: true,
        decimalPlaces: 2,
      }),
    ).toBe("10.48%");
  });

  it("keeps missing results empty", () => {
    expect(formatFormulaEquationResult({ value: null })).toBeNull();
  });
});
