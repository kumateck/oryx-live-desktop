import { expect, it } from "vitest";
import { addCounts, countText, fgCount, fgLayout, fgText, yieldOf } from "./fg-quantity";

// One shipper holds 80 boxes; a box is 20 strips of 10 tablets (200 tablets).
const dicnac = fgLayout({ packPerShipper: 80, basePackingUoM: { name: "Tablet" }, packingLists: [{ uom: { name: "Shipper" }, quantity: 80, order: 1 }, { uom: { name: "Box" }, quantity: 20, order: 2 }, { uom: { name: "Strip" }, quantity: 10, order: 3 }] });

it("turns stored yield into shippers, loose packs and units short of a pack", () => {
  expect(fgCount(17_029_647, dicnac)).toEqual({ shippers: 1064, loose: 28, units: 47 });
  expect(fgText(17_029_647, dicnac)).toBe("1,064 shippers · 28 loose · 47 tablets");
  expect(fgText(16_000, dicnac)).toBe("1 shipper · 0 loose");
  expect(fgCount(-5, dicnac)).toEqual({ shippers: 0, loose: 0, units: 0 });
});

it("turns shippers and loose packs back into yield", () => {
  expect(yieldOf(2, 3, dicnac)).toBe(32_600);
  expect(yieldOf(Number.NaN, 3, dicnac)).toBe(600);
});

it("counts a style without a unit breakdown one base unit per pack, and refuses one that does not add up", () => {
  const bottles = fgLayout({ packPerShipper: 60 });
  expect(fgCount(348, bottles)).toEqual({ shippers: 5, loose: 48, units: 0 });
  const broken = fgLayout({ packPerShipper: 80, packingLists: [{ uom: { name: "Shipper" }, quantity: 7, order: 1 }] });
  expect(fgCount(100, broken)).toBeNull();
  expect(yieldOf(1, 0, broken)).toBeNull();
  expect(fgText(100, broken)).toBe("Packing style incomplete");
});

it("adds counts without turning loose packs from different transfers into a shipper", () => {
  expect(addCounts({ shippers: 1, loose: 50, units: 3 }, { shippers: 0, loose: 50, units: 4 })).toEqual({ shippers: 1, loose: 100, units: 7 });
  expect(countText({ shippers: 2, loose: 1, units: 1 }, "Tablet")).toBe("2 shippers · 1 loose · 1 tablet");
});

it("reads saved packing styles the way they are really stored", () => {
  // "Tube = 25" is the 25 g in a tube, not 25 tubes; rows carry no order and the shipper is not always first.
  const frumax = fgLayout({ packPerShipper: 360, basePackingUoM: { name: "Tube", symbol: "Tu" },
    packingLists: [{ uom: { name: "Outer Carton", symbol: "Out ctn" }, quantity: 20, order: 0 }, { uom: { name: "Tube", symbol: "Tu" }, quantity: 25, order: 0 }, { uom: { name: "Shipper", symbol: "s" }, quantity: 18, order: 0 }] });
  expect(frumax.baseUnitsPerPack).toBe(1);
  expect(fgText(2_016_971, frumax)).toBe("5,602 shippers · 251 loose");
  // "Bottle = 100" (the 100 ml) listed before the shipper, and a row in mg describing contents.
  expect(fgLayout({ packPerShipper: 60, basePackingUoM: { name: "Bottle", symbol: "bottle" }, packingLists: [{ uom: { name: "Bottle", symbol: "bottle" }, quantity: 100 }, { uom: { name: "Shipper", symbol: "s" }, quantity: 60 }] }).baseUnitsPerPack).toBe(1);
  expect(fgLayout({ packPerShipper: 30, basePackingUoM: { name: "Bottle" }, packingLists: [{ uom: { name: "Milligram", symbol: "mg" }, quantity: 200 }] }).baseUnitsPerPack).toBe(1);
  // A blister of 10 tablets as the pack, 1,000 to a shipper.
  expect(fgLayout({ packPerShipper: 1000, basePackingUoM: { name: "Tablet" }, packingLists: [{ uom: { name: "Shipper" }, quantity: 100 }, { uom: { name: "Outer Carton" }, quantity: 10 }, { uom: { name: "Blister" }, quantity: 10 }] }).baseUnitsPerPack).toBe(10);
});
