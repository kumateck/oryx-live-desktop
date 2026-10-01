import { expect, it } from "vitest";
import { changedScheduleDateIssues, isScheduleEnded, newScheduleDateIssues, schedulePhase } from "./schedule-dates";
import { batchQuantity, summarizeBatches, toScheduleProducts } from "./schedule-products";

const now = new Date(2026, 9, 1, 15);
const day = (offset: number) => new Date(2026, 9, 1 + offset);
const paths = (issues: { path: string; message: string }[]) => issues.map((issue) => `${issue.path}: ${issue.message}`);

it("tells an upcoming, running, and ended schedule apart", () => {
  expect(schedulePhase(day(2).toISOString(), day(5).toISOString(), now)).toBe("upcoming");
  expect(schedulePhase(day(-2).toISOString(), day(5).toISOString(), now)).toBe("running");
  expect(schedulePhase(day(-5).toISOString(), day(-1).toISOString(), now)).toBe("ended");
  expect([isScheduleEnded(null, now), isScheduleEnded("not a date", now)]).toEqual([false, false]);
});

it("checks a new schedule's dates the way the server does", () => {
  expect(newScheduleDateIssues(day(0), day(3), now)).toEqual([]);
  expect(newScheduleDateIssues(day(1), day(1), now)).toEqual([]);
  expect(paths(newScheduleDateIssues(day(0), day(0), now))).toEqual(["scheduledEndTime: The end date must be after today"]);
  expect(paths(newScheduleDateIssues(day(3), day(2), now))).toEqual(["scheduledEndTime: The end date cannot be before the start date"]);
  expect(paths(newScheduleDateIssues(day(-1), day(2), now))).toEqual(["scheduledStartTime: The start date cannot be in the past"]);
});

it("only lets a schedule change to a start after today and an end after the start", () => {
  expect(changedScheduleDateIssues(day(1), day(2), now)).toEqual([]);
  expect(paths(changedScheduleDateIssues(day(0), day(0), now))).toEqual(["scheduledStartTime: The start date must be after today", "scheduledEndTime: The end date must be after the start date"]);
});

it("sizes a batch from the product's full batch size", () => {
  expect(batchQuantity({ fullBatchSize: 1500, unit: "L" }, "0")).toBe(1500);
  expect(batchQuantity({ fullBatchSize: 1500, unit: "L" }, "1")).toBe(750);
  expect([batchQuantity({ fullBatchSize: 0, unit: "L" }, "0"), batchQuantity({ fullBatchSize: null, unit: null }, "0"), batchQuantity(null, "0")]).toEqual([null, null, null]);
});

it("sends one schedule product per batch", () => {
  expect(toScheduleProducts([{ productId: "p1", packingId: "s1", sizeType: "1", marketTypeId: null, count: 2, quantity: 750 }])).toEqual([
    { productId: "p1", quantity: 750, batchSize: 1, productPackingId: "s1", marketTypeId: null },
    { productId: "p1", quantity: 750, batchSize: 1, productPackingId: "s1", marketTypeId: null },
  ]);
});

it("counts batches of the same product and size together", () => {
  const batch = { productId: "p1", name: "Wormee", unit: "ml", quantity: 1_500_000 };
  expect(summarizeBatches([batch, batch, { ...batch, quantity: 750_000 }, { productId: "p2", name: "Gel", unit: null, quantity: 5 }]))
    .toEqual(["Wormee (1,500 L) ×2", "Wormee (750 L)", "Gel (5)"]);
});
