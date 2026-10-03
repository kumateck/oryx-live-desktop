import { expect, it } from "vitest";
import { shelfFigures, stockLevel } from "../../material-location/lib/stock-level";
import { rackSchema, rackSummarySchema } from "../schemas/rack-schema";
import { availableToMove, moveProblems, moveRequest, moveUnit, type MoveSource } from "./move-stock";
import { filterRackStock, rackStockRows, rackSummary } from "./rack-stock";

const source: MoveSource = { shelfBatchId: "sb1", shelfId: "s1", shelfLabel: "A1", materialName: "Maize starch", batchNumber: "B-01", quantity: 5_000_000, unit: "mg", unitId: "u-mg", kind: 0 };
const to = (shelf: string, quantity: number, note = "") => ({ quantity, rack: { value: "r1", label: "Rack 1" }, shelf: { value: shelf, label: shelf }, note });

it("takes quantities in the largest unit and sends them in the unit the shelf record is kept in", () => {
  expect(moveUnit(source)).toBe("kg");
  expect(availableToMove(source)).toBe(5);
  expect(moveRequest(source, [to("s2", 1.5, "Nearer dispensing"), to("s3", 0.25)])).toEqual({ shelfMaterialBatchId: "sb1", movedShelfBatchMaterials: [
    { warehouseLocationShelfId: "s2", quantity: 1_500_000, uomId: "u-mg", note: "Nearer dispensing" }, { warehouseLocationShelfId: "s3", quantity: 250_000, uomId: "u-mg", note: "" }] });
  // A record kept in grams is sent in grams, not in the family's smallest unit.
  const grams = { ...source, quantity: 5_000, unit: "g", unitId: "u-g" };
  expect(availableToMove(grams)).toBe(5);
  expect(moveRequest(grams, [to("s2", 1.5)]).movedShelfBatchMaterials[0]?.quantity).toBe(1_500);
  // A counted unit is moved as it is.
  const packs = { ...source, quantity: 40, unit: "pcs", unitId: "u-pcs" };
  expect(moveUnit(packs)).toBe("pcs");
  expect(moveRequest(packs, [to("s2", 12)]).movedShelfBatchMaterials[0]?.quantity).toBe(12);
});

it("refuses what the server would refuse: the same shelf, a shelf twice, more than is there", () => {
  expect(moveProblems(source, [to("s2", 2), to("s3", 3)])).toEqual([]);
  expect(moveProblems(source, [to("s1", 1)])).toEqual([{ index: 0, field: "shelf", message: "The stock is already on this shelf" }]);
  expect(moveProblems(source, [to("s2", 1), to("s2", 1)])[0]).toMatchObject({ index: 1, field: "shelf" });
  expect(moveProblems(source, [to("s2", 3), to("s3", 2.5)])).toEqual([{ index: null, field: null, message: "The quantities add up to more than the 5 kg on the shelf" }]);
  // Decimal fractions that add up exactly are not turned away by floating-point noise.
  expect(moveProblems({ ...source, quantity: 300_000 }, [to("s2", 0.1), to("s3", 0.2)])).toEqual([]);
});

const soon = new Date(Date.now() + 20 * 86_400_000).toISOString();
const past = new Date(Date.now() - 86_400_000).toISOString();
const rack = rackSchema.parse({ id: "r1", name: "Rack 1", warehouseLocation: { name: "Raw store", floorName: "Ground" }, shelves: [
  { id: "s1", code: "A1", materialBatches: [
    { id: "sb1", quantity: 5_000_000, uoM: { id: "u", symbol: "mg" }, materialBatch: { batchNumber: "B-01", expiryDate: soon, material: { code: "RM-1", name: "Maize starch" } } },
    { id: "sb2", quantity: 0, materialBatch: { batchNumber: "B-00", material: { name: "Moved away" } } }] },
  { id: "s2", code: "A2", materialBatches: [{ id: "sb3", quantity: 10, materialBatch: { batchNumber: "B-02", expiryDate: past, uoM: { id: "u2", symbol: "kg" }, material: { code: "RM-2", name: "Lactose" } } }] },
  { id: "s3", name: "A3", materialBatches: null }] });

it("reads a rack, leaving out records emptied by a move and falling back to the batch's unit", () => {
  const rows = rackStockRows(rack);
  expect(rows.map((row) => [row.shelf, row.materialName, row.unit])).toEqual([["A1", "Maize starch", "mg"], ["A2", "Lactose", "kg"]]);
  expect(rackSummary(rack)).toEqual({ shelves: 3, emptyShelves: ["A3"], batches: 2, expired: 1, expiringSoon: 1 });
  expect(filterRackStock(rows, " rm-2 ").map((row) => row.batchNumber)).toEqual(["B-02"]);
  expect(filterRackStock(rows, "a1")).toHaveLength(1);
  expect(filterRackStock(rows, "")).toHaveLength(2);
});

it("names racks with their store and drops records without an id", () => {
  expect(rackSummarySchema.parse([{ id: "r1", name: "Rack 1", warehouseLocation: { name: "Raw store" }, shelves: [{ id: "s1", code: "A1" }, { code: "lost" }] }, { name: "no id" }]))
    .toEqual([{ id: "r1", label: "Raw store · Rack 1", shelves: [{ id: "s1", label: "A1" }] }]);
});

it("judges stock against its levels, and does not judge when none are set", () => {
  expect(stockLevel({ stock: 10, minimum: 10, reorder: 50 })).toBe("critical");
  expect(stockLevel({ stock: 40, minimum: 10, reorder: 50 })).toBe("low");
  expect(stockLevel({ stock: 60, minimum: 10, reorder: 50 })).toBe("optimal");
  expect(stockLevel({ stock: 0, minimum: 0, reorder: 0 })).toBe("unset");
});

it("totals a material's shelf records", () => {
  expect(shelfFigures([
    { quantity: 5, shelfId: "s1", batchNumber: "B-01", expiryDate: soon }, { quantity: 3, shelfId: "s2", batchNumber: "B-01", expiryDate: soon },
    { quantity: 2, shelfId: "s2", batchNumber: "B-02", expiryDate: past }, { quantity: 1, shelfId: "s3", batchNumber: "B-03", expiryDate: null },
  ])).toEqual({ total: 11, shelves: 3, batches: 3, earliestExpiry: past });
});
