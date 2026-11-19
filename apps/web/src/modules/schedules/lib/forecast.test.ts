import { expect, it } from "vitest";
import { forecastSchema } from "../schemas/forecast-schema";
import { forecastGroups, freeStock, isCovered, shortfall, usableStock } from "./forecast";

const materials = forecastSchema.parse([
  { material: { id: "m1", code: "RM-1", name: "Sugar", kind: 0 }, uoM: { symbol: "g" }, quantityNeeded: 500, quantityOnHand: 900, expiredQuantity: 100, reservedQuantity: 50, isAvailable: true },
  { material: { id: "m2", code: "RM-2", name: "Albendazole", kind: 0 }, uoM: { symbol: "g" }, quantityNeeded: 500, quantityOnHand: 600, expiredQuantity: 400, isAvailable: false },
  { material: { id: "m3", code: "PM-1", name: "Bottle", kind: 1 }, quantityNeeded: 10, quantityOnHand: 10 },
  { material: { id: "m4", name: "Label", kind: null }, quantityNeeded: 1, quantityOnHand: 5, expiredQuantity: 9 },
]);

it("counts only stock that has not expired as usable", () => {
  expect(materials.map(usableStock)).toEqual([800, 200, 10, 0]);
});

it("uses the server's answer, and its rule when there is none: free stock must cover the need", () => {
  expect(materials.map(isCovered)).toEqual([true, false, true, false]);
  expect(materials.map(shortfall)).toEqual([0, 300, 0, 1]);
});

it("does not count stock reserved for other batches, as when production starts", () => {
  // PS017 propylene glycol: 1,510 L usable, 1,500 L reserved elsewhere, 300 L needed.
  const [glycol] = forecastSchema.parse([{ material: { id: "m5", name: "Propylene Glycol", kind: 0 }, quantityNeeded: 300, quantityOnHand: 1510, reservedQuantity: 1500 }]);
  if (!glycol) throw new Error("fixture");
  expect(freeStock(glycol)).toBe(10);
  expect(isCovered(glycol)).toBe(false);
  expect(shortfall(glycol)).toBe(290);
});

it("groups raw and packaging materials with the short ones first, and keeps the rest", () => {
  const groups = forecastGroups(materials);
  expect(groups.raw.map((item) => item.name)).toEqual(["Albendazole", "Sugar"]);
  expect(groups.packaging.map((item) => item.name)).toEqual(["Bottle"]);
  expect(groups.other.map((item) => item.name)).toEqual(["Label"]);
  // Albendazole (server: short) and Label (nothing usable); the Bottle's free stock exactly covers its need.
  expect(groups.short).toBe(2);
  expect(forecastGroups(forecastSchema.parse(null))).toMatchObject({ raw: [], packaging: [], other: [], short: 0 });
});

it("uses the forecast's server-measured usable and free stock", () => {
  const [item] = forecastSchema.parse([{ material: { id: "m1", name: "Artemether" }, uoM: { symbol: "kg" }, quantityNeeded: 24, quantityOnHand: 100, expiredQuantity: 10,
    unavailableQuantity: 15, reservedQuantity: 124.8, usableQuantity: 75, freeQuantity: 0 }]);
  expect(item && usableStock(item)).toBe(75);
  expect(item && freeStock(item)).toBe(0);
});

it("lists each substitute right below its main material, and counts a line short only when neither has enough", () => {
  const row = (id: string, needed: number, free: number, mainOf?: string) => ({ material: { id, code: id, name: id, kind: 0 }, uoM: { symbol: "g" }, quantityNeeded: needed,
    quantityOnHand: free, expiredQuantity: 0, reservedQuantity: 0, freeQuantity: free, ...(mainOf ? { isSubstitute: true, substituteFor: { id: mainOf, code: mainOf, name: mainOf } } : {}) });
  const materials = forecastSchema.parse([row("Sugar", 10, 100), row("Anhydrous", 10, 1), row("Monohydrate", 12, 50, "Anhydrous"), row("Salt", 10, 1)]);
  const groups = forecastGroups(materials);
  // Salt is short with nothing to replace it; Anhydrous is short but its substitute covers the line.
  expect(groups.raw.map((item) => item.name)).toEqual(["Salt", "Sugar", "Anhydrous", "Monohydrate"]);
  expect(groups.short).toBe(1);
  expect(groups.raw[3]?.substituteFor?.name).toBe("Anhydrous");
});
