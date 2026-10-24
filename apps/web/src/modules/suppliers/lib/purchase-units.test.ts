import { expect, it } from "vitest";
import { purchaseUnitDisplayOptions, purchaseUnitOptions, readMaterialPurchaseUnits } from "@/shared/procurement/purchase-units";

it("expands and orders mass and volume symbols without requiring collection IDs", () => {
  expect(purchaseUnitOptions([{ symbol: "mg" }]).map((option) => option.value)).toEqual(["mg", "g", "kg"]);
  expect(purchaseUnitOptions([{ symbol: "ML" }]).map((option) => option.value)).toEqual(["ml", "L"]);
  expect(purchaseUnitOptions([{ symbol: "PCS" }])).toEqual([{ value: "PCS", label: "PCS" }]);
});
it("unions all departments and removes repeated symbols and overlapping families", () => {
  expect(purchaseUnitOptions([{ symbol: "mg" }, { symbol: "KG" }, { symbol: "L" }, { symbol: " ml " }, { symbol: "PCS" }, { symbol: "pcs" }])
    .map((option) => option.value)).toEqual(["mg", "g", "kg", "ml", "L", "PCS"]);
  expect(purchaseUnitOptions([])).toEqual([]);
  expect(purchaseUnitOptions([{ name: "Kilogram" }])).toEqual([]);
});
it("validates singleton and array response shapes without guessing symbols", () => {
  const unit = { id: "u-mg", symbol: "mg", name: "Milligram" };
  expect(readMaterialPurchaseUnits(unit)).toEqual([unit]);
  expect(readMaterialPurchaseUnits([unit])).toEqual([unit]);
  expect(readMaterialPurchaseUnits(null)).toEqual([]);
  expect(readMaterialPurchaseUnits({ symbol: 7 })).toEqual([]);
});
it("retains a saved symbol through loading without making it an allowed replacement", () => {
  const saved = { value: "kg", label: "kg" };
  expect(purchaseUnitDisplayOptions([], saved)).toEqual([{ ...saved, disabled: true }]);
  const options = purchaseUnitOptions([{ symbol: "mg" }]);
  expect(purchaseUnitDisplayOptions(options, saved)).toBe(options);
});
