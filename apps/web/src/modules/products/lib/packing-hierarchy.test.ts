import { expect, it } from "vitest";
import { baseUnitsPerPack, matchingPackLevel, hierarchySummary, packsPerShipper, pluralUnit, splitPacks, unitHint, unitName } from "./packing-hierarchy";

const row = (label: string, quantity: number) => ({ uom: { label }, quantity });
const units = [row("Shipper (s)", 80), row("Outer Carton (Out ctn)", 20), row("Inner Carton (Inner ctn)", 10)];

it("reads a unit's name from its picker label", () => {
  expect(unitName("Outer Carton (Out ctn)")).toBe("Outer Carton");
  expect(unitName("Tablet")).toBe("Tablet");
  expect(unitName("")).toBeNull();
  expect(unitName(undefined)).toBeNull();
});

it("pluralises unit names", () => {
  expect(pluralUnit("Tablet")).toBe("Tablets");
  expect(pluralUnit("Box")).toBe("Boxes");
  expect(pluralUnit("Battery")).toBe("Batteries");
  expect(pluralUnit("Tray")).toBe("Trays");
});

it("says what each unit holds, ending in base units", () => {
  expect(unitHint(units, 0, "Tablet (tablet)")).toBe("1 Shipper = 80 Outer Cartons");
  expect(unitHint(units, 1, "Tablet (tablet)")).toBe("1 Outer Carton = 20 Inner Cartons");
  expect(unitHint(units, 2, "Tablet (tablet)")).toBe("1 Inner Carton = 10 Tablets");
  expect(unitHint([row("Box (bx)", 1)], 0, "Bottle (btl)")).toBe("1 Box = 1 Bottle");
});

it("handles rows that are not filled in yet", () => {
  expect(unitHint([row("Shipper (s)", Number.NaN), row("Box (bx)", 4)], 0, "Tablet")).toBe("1 Shipper = how many Boxes?");
  expect(unitHint([row("Shipper (s)", 12), row("", 4)], 0, "Tablet")).toBe("1 Shipper = 12 of the next unit");
  expect(unitHint([row("", 12)], 0, "")).toBe("1 unit = 12 base packing units");
  expect(unitHint([row("Box (bx)", Number.NaN)], 0, null)).toBe("1 Box = how many base packing units?");
});

it("totals the hierarchy in base units once every row is filled in", () => {
  expect(hierarchySummary(units, "Tablet (tablet)")).toBe("1 Shipper = 80 × 20 × 10 = 16,000 Tablets");
  expect(hierarchySummary(units.slice(2), "Tablet (tablet)")).toBeNull();
  expect(hierarchySummary([units[0]!, row("Outer Carton (Out ctn)", Number.NaN)], "Tablet")).toBeNull();
  expect(hierarchySummary(units, "")).toBeNull();
});

it("works out packs per shipper across one or more rows", () => {
  expect(packsPerShipper(units, 0, 1)).toBe(80);
  expect(packsPerShipper(units, 0, 2)).toBe(1600);
  expect(packsPerShipper(units, 0, 3)).toBe(16000);
  expect(packsPerShipper(units, 1, 3)).toBe(200);
  expect(packsPerShipper(units, 1, 1)).toBeNull();
  expect(packsPerShipper([units[0]!, row("Box", Number.NaN)], 0, 2)).toBeNull();
  expect(baseUnitsPerPack(units, 1)).toBe(200);
  expect(baseUnitsPerPack(units, 3)).toBe(1);
});

it("finds the pack level that matches the entered packs per shipper", () => {
  expect(matchingPackLevel(units, 80)).toBe(1);
  expect(matchingPackLevel(units, 1600)).toBe(2);
  expect(matchingPackLevel(units, 16000)).toBe(3);
  expect(matchingPackLevel(units, 999)).toBeNull();
  expect(matchingPackLevel(units, Number.NaN)).toBeNull();
  // A quantity of 1 gives two levels the same count; the outer one wins.
  expect(matchingPackLevel([row("Shipper", 24), row("Box", 1)], 24)).toBe(1);
  expect(matchingPackLevel([row("Box (bx)", 24)], 24)).toBe(1);
});

it("splits packs into full shippers and loose packs", () => {
  expect(splitPacks(2000, 1600)).toEqual({ shippers: 1, loose: 400 });
  expect(splitPacks(160, 80)).toEqual({ shippers: 2, loose: 0 });
  expect(splitPacks(79, 80)).toEqual({ shippers: 0, loose: 79 });
  expect(splitPacks(-1, 80)).toBeNull();
  expect(splitPacks(10, 0)).toBeNull();
});
