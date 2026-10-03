import { expect, it } from "vitest";
import { scheduleRowSchema } from "../schemas/schedule-schema";
import { freeStock, materialCovered, materialShortfall, materialSource, shortFirst } from "./batch-materials";
import { batchLabel, batchRemovable, batchSizeText, batchState, firstRemovable, groupBatches } from "./schedule-batches";
import { batchMaterialsSchema } from "../schemas/batch-schema";

const product = { id: "p1", name: "Wormee", code: "NL-047", baseUoM: { symbol: "ml" } };
const full = { quantity: 1_500_000, batchSize: 0, product, productPacking: { id: "s1", name: "150 X 20ml" } };
const schedule = scheduleRowSchema.parse({ id: "658da105-a506-44a9-8ff5-8d005a54f294", code: "PS-1", products: [
  { ...full, id: "b1", batchNumber: "WM-001", hasStarted: true },
  { ...full, id: "b2" },
  { ...full, id: "b3", cancelled: true, reasonForCancellation: "Line down" },
  { ...full, id: "b4", productionActivityId: "act-1" },
  { ...full, id: "b5", quantity: 750_000, batchSize: 1 },
] });
const now = new Date(2026, 9, 1);

it("keeps batches made the same way together and names each one", () => {
  const groups = groupBatches(schedule.products);
  expect(groups.map((group) => [group.name, group.detail, group.batches.length])).toEqual([
    ["Wormee", "Full (1,500 L) · 150 X 20ml", 4], ["Wormee", "Half (750 L) · 150 X 20ml", 1]]);
  expect(groups[0]?.batches.map(batchLabel)).toEqual(["WM-001", "Batch 2", "Batch 3", "Batch 4"]);
  expect(batchSizeText({ quantity: 5, unit: null, half: false })).toBe("Full (5)");
});

it("tells where each batch stands, and which can still be removed", () => {
  const future = new Date(2026, 9, 9).toISOString();
  const past = new Date(2026, 8, 1).toISOString();
  expect(schedule.products.map((batch) => batchState(batch, future, now))).toEqual(["started", "waiting", "cancelled", "started", "waiting"]);
  expect(schedule.products.map((batch) => batchState(batch, past, now))).toEqual(["started", "missed", "cancelled", "started", "missed"]);
  expect(schedule.products.map(batchRemovable)).toEqual([false, true, false, false, true]);
  const group = groupBatches(schedule.products)[0];
  if (!group) throw new Error("no group");
  // Asking for more than can be removed takes only what can.
  expect(firstRemovable(group, 3)).toEqual(["b2"]);
  expect(firstRemovable(group, -1)).toEqual([]);
});

it("covers a batch with what is reserved for it plus what is free", () => {
  const rows = batchMaterialsSchema.parse([
    { material: { id: "m1", name: "Sugar", code: "RM-1", totalStock: 900 }, materialDepartment: { uoM: { symbol: "g" } }, quantityNeeded: 500, quantityOnHand: 700, frozenQuantity: 0, totalFrozenQuantity: 300, status: 2 },
    { material: { id: "m2", name: "Bottle" }, quantityNeeded: 500, quantityOnHand: 700, frozenQuantity: 200, totalFrozenQuantity: 400 },
    { material: { id: "m2", name: "Bottle" }, quantityNeeded: 0 },
  ]);
  expect(rows.map(freeStock)).toEqual([400, 300, 0]);
  expect(rows.map(materialCovered)).toEqual([false, true, true]);
  expect(rows.map(materialShortfall)).toEqual([100, 0, 0]);
  expect(rows.map((row) => materialSource(row).label)).toEqual(["Purchase requisition", "In house", "In house"]);
  // The same material listed twice still gets two distinct rows.
  expect(new Set(rows.map((row) => row.id)).size).toBe(3);
  expect(shortFirst([rows[1]!, rows[0]!])[0]?.name).toBe("Sugar");
});
