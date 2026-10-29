import { expect, it } from "vitest";
import { packingLayout, packsFrom, shipperSplit, toPacks } from "./packs";

const tablet = { name: "Tablet", symbol: "tablet" };
const style = (packPerShipper: number) => ({
  packPerShipper, basePackingUoM: tablet,
  // Out of order on purpose: the backend sorts by `order`, and so must we.
  packingLists: [
    { uom: { name: "Inner Carton", symbol: "Inner ctn" }, quantity: 10, order: 3 },
    { uom: { name: "Shipper", symbol: "s" }, quantity: 80, order: 1 },
    { uom: { name: "Outer Carton", symbol: "Out ctn" }, quantity: 20, order: 2 },
  ],
});

it("finds the pack from packs per shipper and counts base units per pack", () => {
  expect(packingLayout(style(80))).toEqual({ perShipper: 80, baseUnitsPerPack: 200, packName: "Outer Carton", baseName: "Tablet" });
  expect(packingLayout(style(1600))).toEqual({ perShipper: 1600, baseUnitsPerPack: 10, packName: "Inner Carton", baseName: "Tablet" });
  expect(packingLayout(style(16000))).toEqual({ perShipper: 16000, baseUnitsPerPack: 1, packName: "Tablet", baseName: "Tablet" });
  expect(packingLayout(style(75)).baseUnitsPerPack).toBeNull();
  expect(packingLayout({ packPerShipper: 30, basePackingUoM: { name: "Bottle" }, packingLists: [] }).baseUnitsPerPack).toBe(1);
  expect(packingLayout({ packPerShipper: 24, basePackingUoM: { name: "Bottle" }, packingLists: [{ uom: { name: "Box" }, quantity: 24, order: 1 }] }))
    .toEqual({ perShipper: 24, baseUnitsPerPack: 1, packName: "Bottle", baseName: "Bottle" });
});

it("turns base units into whole packs and leftover units", () => {
  expect(toPacks(1_000_000, 200)).toEqual({ packs: 5000, leftover: 0 });
  expect(toPacks(1_000_050, 200)).toEqual({ packs: 5000, leftover: 50 });
  expect(toPacks(100, null)).toBeNull();
});

it("splits packs into shippers and loose packs, and back", () => {
  expect(shipperSplit(5000, 80)).toEqual({ shippers: 62, loose: 40 });
  expect(shipperSplit(79, 80)).toEqual({ shippers: 0, loose: 79 });
  expect(shipperSplit(30, 0)).toEqual({ shippers: 0, loose: 30 });
  expect(packsFrom(62, 40, 80)).toBe(5000);
  expect(packsFrom(Number.NaN, 5, 80)).toBe(5);
});
