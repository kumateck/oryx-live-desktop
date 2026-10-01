import { expect, it } from "vitest";
import { forecastSchema } from "../schemas/forecast-schema";
import { forecastGroups, isCovered, shortfall, usableStock } from "./forecast";

const materials = forecastSchema.parse([
  { material: { id: "m1", code: "RM-1", name: "Sugar", kind: 0 }, uoM: { symbol: "g" }, quantityNeeded: 500, quantityOnHand: 900, expiredQuantity: 100, reservedQuantity: 50, isAvailable: true },
  { material: { id: "m2", code: "RM-2", name: "Albendazole", kind: 0 }, uoM: { symbol: "g" }, quantityNeeded: 500, quantityOnHand: 600, expiredQuantity: 400, isAvailable: false },
  { material: { id: "m3", code: "PM-1", name: "Bottle", kind: 1 }, quantityNeeded: 10, quantityOnHand: 10 },
  { material: { id: "m4", name: "Label", kind: null }, quantityNeeded: 1, quantityOnHand: 5, expiredQuantity: 9 },
]);

it("counts only stock that has not expired as usable", () => {
  expect(materials.map(usableStock)).toEqual([800, 200, 10, 0]);
});

it("uses the server's answer, and its rule when there is none", () => {
  // Exactly enough is not enough by the server's rule: usable stock must be more than what is needed.
  expect(materials.map(isCovered)).toEqual([true, false, false, false]);
  expect(materials.map(shortfall)).toEqual([0, 300, 0, 1]);
});

it("groups raw and packaging materials with the short ones first, and keeps the rest", () => {
  const groups = forecastGroups(materials);
  expect(groups.raw.map((item) => item.name)).toEqual(["Albendazole", "Sugar"]);
  expect(groups.packaging.map((item) => item.name)).toEqual(["Bottle"]);
  expect(groups.other.map((item) => item.name)).toEqual(["Label"]);
  expect(groups.short).toBe(3);
  expect(forecastGroups(forecastSchema.parse(null))).toMatchObject({ raw: [], packaging: [], other: [], short: 0 });
});
