import { expect, it } from "vitest";
import { convertUnit } from "../units/quantity";
import { comparablePrice, formatMoney, formatUnitPrice, isNegligibleLine, lineCost, quantityInPriceUnit } from "./price";

it("converts between units of one family and refuses anything else", () => {
  expect(convertUnit(2, "kg", "g")).toBe(2_000);
  expect(convertUnit(1_500_000, "mg", "kg")).toBe(1.5);
  expect(convertUnit(250, "ml", "L")).toBe(0.25);
  expect(convertUnit(12, "pcs", "pcs")).toBe(12);
  expect(convertUnit(12, "pcs", "box")).toBeNull();
  expect(convertUnit(1, "kg", "L")).toBeNull();
  expect(convertUnit(1, "kg", null)).toBeNull();
});

it("costs a line from the stored quantity and the unit the price is quoted in", () => {
  // 25 kg stored as milligrams, quoted at 12 per kg.
  expect(quantityInPriceUnit({ quantity: 25_000_000, unit: "mg", priceUnit: "kg" })).toBe(25);
  expect(lineCost({ quantity: 25_000_000, unit: "mg", price: 12, priceUnit: "kg" })).toBe(300);
  expect(lineCost({ quantity: 40, unit: "pcs", price: 2.5, priceUnit: "pcs" })).toBe(100);
  // No guess is made when the price has no unit, or the units do not convert.
  expect(lineCost({ quantity: 25_000_000, unit: "mg", price: 12, priceUnit: null })).toBeNull();
  expect(lineCost({ quantity: 25_000_000, unit: "mg", price: 12, priceUnit: "L" })).toBeNull();
  expect(lineCost({ quantity: 25_000_000, unit: "mg", price: null, priceUnit: "kg" })).toBeNull();
});

it("ranks quotes given per g and per kg on the same footing", () => {
  const perKilo = comparablePrice({ unit: "mg", price: 12, priceUnit: "kg" });
  const perGram = comparablePrice({ unit: "mg", price: 0.011, priceUnit: "g" });
  expect(perKilo).not.toBeNull();
  expect(perGram).not.toBeNull();
  expect((perGram ?? 0) < (perKilo ?? 0)).toBe(true);
});

it("flags a quantity that is a tiny fraction of the priced unit", () => {
  expect(isNegligibleLine({ quantity: 5, unit: "mg", priceUnit: "kg" })).toBe(true);
  expect(isNegligibleLine({ quantity: 25_000_000, unit: "mg", priceUnit: "kg" })).toBe(false);
  expect(isNegligibleLine({ quantity: 0, unit: "mg", priceUnit: "kg" })).toBe(false);
  expect(isNegligibleLine({ quantity: 5, unit: "mg", priceUnit: null })).toBe(false);
});

it("shows money to two decimals without rounding a real amount to nothing", () => {
  expect(formatMoney(1234.5, "$")).toBe("$ 1,234.50");
  expect(formatMoney(0.00006, "$")).toBe("$ 0.00006");
  expect(formatMoney(null, "$")).toBe("–");
  expect(formatUnitPrice(12.3456, "GHS", "kg")).toBe("GHS 12.3456 / kg");
  expect(formatUnitPrice(null, "GHS", "kg")).toBe("–");
});
