import { expect, it } from "vitest";
import { buildMonthlyPlan, groupByMarket, monthRange, noMarket, planTotals, shiftMonth, type PlanSchedule } from "./monthly-plan";

const product = { id: "p1", name: "Wormee", code: "NL-047", price: 12.5, priceUoM: "bottle" };
const packing = { id: "k1", name: "100 ml", expectedYield: 1000, packPerShipper: 24 };
const schedule = (id: string, start: string, end: string, products: PlanSchedule["products"]): PlanSchedule => ({ id, scheduledStartTime: start, scheduledEndTime: end, products });

it("takes every schedule that runs during the month, half batches counting half", () => {
  const rows = buildMonthlyPlan([
    schedule("a", "2026-09-28T08:00:00", "2026-10-02T08:00:00", [{ product, productPacking: packing, marketType: { name: "Local" } }, { product, productPacking: packing, marketType: { name: "Local" }, batchSize: 1 }]),
    schedule("b", "2026-10-20T08:00:00", "2026-11-03T08:00:00", [{ product, productPacking: packing, marketType: { name: "Local" }, cancelled: true }]),
    schedule("c", "2026-11-01T08:00:00", "2026-11-05T08:00:00", [{ product, productPacking: packing, marketType: { name: "Local" } }]),
  ], new Date(2026, 9, 14));
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ market: "Local", batches: 1.5, expectedYield: 1500, shippers: 62, loose: 12, unitPrice: 12.5 });
});

it("groups by market, product and packing style, with batches that have no market last", () => {
  const rows = buildMonthlyPlan([schedule("a", "2026-10-01T00:00:00", "2026-10-05T00:00:00", [
    { product, productPacking: packing }, { product, productPacking: packing, marketType: { name: "Export" } },
    { product: { ...product, id: "p2", name: "Amoxil" }, productPacking: { ...packing, packPerShipper: null }, marketType: { name: "Export" } },
  ])], new Date(2026, 9, 1));
  expect(groupByMarket(rows).map((group) => [group.market, group.rows.map((row) => row.productName)])).toEqual([["Export", ["Amoxil", "Wormee"]], [noMarket, ["Wormee"]]]);
  // One row has no shippers, so the shipper total is not given rather than given short.
  expect(planTotals(rows)).toEqual({ batches: 3, expectedYield: 3000, shippers: null, loose: null });
});

it("moves between months and spans the whole of one", () => {
  expect(shiftMonth(new Date(2026, 0, 31), -1)).toEqual(new Date(2025, 11, 1));
  const range = monthRange(new Date(2026, 1, 10));
  expect(range.start).toEqual(new Date(2026, 1, 1));
  expect(range.end.getDate()).toBe(28);
  expect(range.end.getHours()).toBe(23);
});
