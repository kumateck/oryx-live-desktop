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
