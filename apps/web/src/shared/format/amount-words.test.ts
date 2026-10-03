import { expect, it } from "vitest";
import { amountInWords, numberInWords } from "./amount-words";

it("writes whole numbers in words, British style", () => {
  expect(numberInWords(0)).toBe("zero");
  expect(numberInWords(19)).toBe("nineteen");
  expect(numberInWords(45)).toBe("forty-five");
  expect(numberInWords(100)).toBe("one hundred");
  expect(numberInWords(1_004)).toBe("one thousand and four");
  expect(numberInWords(1_204)).toBe("one thousand two hundred and four");
  expect(numberInWords(2_000_000)).toBe("two million");
  expect(numberInWords(12_345_678)).toBe("twelve million three hundred and forty-five thousand six hundred and seventy-eight");
});

it("writes an amount of money for a document, rounding to two decimals", () => {
  expect(amountInWords(12_500, "US Dollar")).toBe("Twelve thousand five hundred US Dollar only");
  expect(amountInWords(12_500.5, "US Dollar")).toBe("Twelve thousand five hundred US Dollar and 50/100");
  expect(amountInWords(0.999, null)).toBe("One only");
  expect(amountInWords(0.07, "Ghana Cedi")).toBe("Zero Ghana Cedi and 07/100");
  expect(amountInWords(Number.NaN, "US Dollar")).toBeNull();
  expect(amountInWords(-5, "US Dollar")).toBeNull();
});
