import { expect, it } from "vitest";
import { toLargestUnit } from "./quantity";

it("shows a quantity in the largest unit that keeps it at 1 or more", () => {
  expect(toLargestUnit(2_500_000, "mg")?.text).toBe("2.5 kg");
  expect(toLargestUnit(1500, "ml")?.text).toBe("1.5 L");
  expect(toLargestUnit(500, "mg")?.text).toBe("500 mg");
  expect(toLargestUnit(3, "kg")?.text).toBe("3 kg");
  expect(toLargestUnit(2, "L")?.text).toBe("2 L");
  expect(toLargestUnit(0.5, "kg")?.text).toBe("500 g");
});

it("leaves other units alone and tolerates missing data", () => {
  expect(toLargestUnit(12000, "tablets")?.text).toBe("12,000 tablets");
  expect(toLargestUnit(5, null)?.text).toBe("5");
  expect(toLargestUnit(5, "ML")?.unit).toBe("ml");
  expect(toLargestUnit(undefined, "mg")).toBeNull();
  expect(toLargestUnit(Number.NaN, "mg")).toBeNull();
  expect(toLargestUnit(0, "mg")?.text).toBe("0 mg");
});
