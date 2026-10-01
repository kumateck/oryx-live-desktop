import { expect, it } from "vitest";
import { generateCode } from "./generate-code";

const rule = (namingType: number, minimumLength = 4, maximumLength = 6) => ({ prefix: "NL-", namingType, minimumLength, maximumLength });

it("numbers a sequential code from the records that already exist", () => {
  expect(generateCode(rule(0), 46)).toBe("NL-0047");
  expect(generateCode(rule(0), 0)).toBe("NL-0001");
  expect(generateCode(rule(0), Number.NaN)).toBe("NL-0001");
  // Past the maximum length the digits that change are kept.
  expect(generateCode(rule(0, 2, 3), 12344)).toBe("NL-345");
});

it("builds random and timestamp codes within the length limits, and nothing for an unknown rule", () => {
  expect(generateCode(rule(1), 0, () => 0.123456789)).toBe("NL-123456");
  expect(generateCode(rule(2, 4, 20), 0, Math.random, () => 1790000000000)).toBe("NL-1790000000000");
  expect(generateCode(rule(9), 5)).toBe("");
  expect(generateCode({ prefix: "", namingType: 0, minimumLength: 0, maximumLength: 0 }, 4)).toBe("5");
});
