import { describe, expect, it } from "vitest";

import {
  isCanonicalDecimal,
  normalizeCanonicalDecimal,
  normalizeDecimalLiteral,
} from "../decimal";

describe("decimal normalization", () => {
  it.each([
    ["001.2300", "1.23"],
    [".5", "0.5"],
    ["1.", "1"],
    ["000", "0"],
  ])("normalizes expression literal %s", (source, expected) => {
    expect(normalizeDecimalLiteral(source)).toBe(expected);
  });

  it("normalizes signed input values and negative zero", () => {
    expect(normalizeCanonicalDecimal("-001.2300")).toBe("-1.23");
    expect(normalizeCanonicalDecimal("-0.000")).toBe("0");
    expect(normalizeCanonicalDecimal("+1")).toBeNull();
  });

  it("recognizes persisted canonical decimal syntax", () => {
    expect(isCanonicalDecimal("1.2300")).toBe(true);
    expect(isCanonicalDecimal("01")).toBe(false);
    expect(isCanonicalDecimal("-0.0")).toBe(false);
    expect(isCanonicalDecimal("1e3")).toBe(false);
  });
});
