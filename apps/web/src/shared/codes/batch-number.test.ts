import { expect, it } from "vitest";
import { batchNumber, batchPrefix } from "./batch-number";

it("builds a product batch number from the product code, year and serial", () => {
  expect(batchPrefix("TAB-R012", 2026)).toBe("B012K");
  expect(batchNumber("TAB012", 2026, 4)).toBe("B012K004");
  expect(batchNumber("syr-7", 2030, 12)).toBe("R7P012");
  expect(batchPrefix("12-TAB", 2026)).toBeNull();
  expect(batchPrefix("TAB012", 2050)).toBeNull();
});
