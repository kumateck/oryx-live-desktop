import { expect, it } from "vitest";
import { formatQuantityNumber, toLargestUnit } from "./quantity";

it("shows a quantity in the largest unit that keeps it at 1 or more", () => {
  expect(toLargestUnit(2_500_000, "mg")?.text).toBe("2.5 kg");
  expect(toLargestUnit(1500, "ml")?.text).toBe("1.5 L");
  expect(toLargestUnit(500, "mg")?.text).toBe("500 mg");
  expect(toLargestUnit(3, "kg")?.text).toBe("3 kg");
  expect(toLargestUnit(2, "L")?.text).toBe("2 L");
  expect(toLargestUnit(0.5, "kg")?.text).toBe("500 g");
});

it("keeps every decimal a person entered", () => {
  expect(toLargestUnit(0.003, "ml")?.text).toBe("0.003 ml");
  expect(toLargestUnit(0.021, "mg")?.text).toBe("0.021 mg");
  expect(toLargestUnit(0.00008, "mg")?.text).toBe("0.00008 mg");
  expect(toLargestUnit(1.05, "mg")?.text).toBe("1.05 mg");
  expect(toLargestUnit(1234.5678, "ml")?.text).toBe("1.2345678 L");
  // Converting units must not introduce floating-point tails.
  expect(toLargestUnit(1005, "mg")?.text).toBe("1.005 g");
  expect(toLargestUnit(0.1 + 0.2, "mg")?.text).toBe("0.3 mg");
});

it("shows a system-calculated quantity to at most four decimals, and never as zero when it is not", () => {
  expect(toLargestUnit(0.003 * 300_000, "ml", "calculated")?.text).toBe("900 ml");
  expect(toLargestUnit(6300.000000000001, "mg", "calculated")?.text).toBe("6.3 g");
  expect(toLargestUnit(1234.56789, "ml", "calculated")?.text).toBe("1.2346 L");
  expect(toLargestUnit(0.00004, "ml", "calculated")?.text).toBe("< 0.0001 ml");
  expect(toLargestUnit(0, "ml", "calculated")?.text).toBe("0 ml");
  expect(formatQuantityNumber(1 / 3, "calculated")).toBe("0.3333");
  expect(formatQuantityNumber(1 / 3, "entered")).toBe("0.333333333333");
});

it("leaves other units alone and tolerates missing data", () => {
  expect(toLargestUnit(12000, "tablets")?.text).toBe("12,000 tablets");
  expect(toLargestUnit(5, null)?.text).toBe("5");
  expect(toLargestUnit(5, "ML")?.unit).toBe("ml");
  expect(toLargestUnit(undefined, "mg")).toBeNull();
  expect(toLargestUnit(Number.NaN, "mg")).toBeNull();
  expect(toLargestUnit(0, "mg")?.text).toBe("0 mg");
});
