import { describe, expect, it } from "vitest";

import {
  divideRational,
  parseRationalDecimal,
  rationalEvidence,
  roundRationalHalfUp,
} from "../rational";

const decimal = (value: string) => parseRationalDecimal(value, 100)!;

describe("exact rational arithmetic", () => {
  it("retains a non-terminating quotient as exact evidence", () => {
    const result = divideRational(decimal("1"), decimal("3"));

    expect(rationalEvidence(result)).toBe("1/3");
    expect(roundRationalHalfUp(result, 4)).toBe("0.3333");
  });

  it("applies decimal-place HalfUp symmetrically", () => {
    expect(roundRationalHalfUp(decimal("1.005"), 2)).toBe("1.01");
    expect(roundRationalHalfUp(decimal("-1.005"), 2)).toBe("-1.01");
  });

  it("rejects ambiguous and over-budget input representations", () => {
    expect(parseRationalDecimal(" 1.2", 10)).toBeNull();
    expect(parseRationalDecimal("1e3", 10)).toBeNull();
    expect(parseRationalDecimal("123.45", 4)).toBeNull();
  });
});
