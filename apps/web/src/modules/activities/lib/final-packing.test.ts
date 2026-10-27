import { expect, it } from "vitest";
import { materialFigures, materialRequests, packingMaterials, packingProblem, returnedMaterials, yieldFigures, type YieldInputs } from "./final-packing";
import { finalPackingFormSchema, issuedPackagingSchema, recordedPackingSchema } from "../schemas/final-packing-schema";

const inputs: YieldInputs = { received: 120, averageFilled: 500, actualPacked: 240_000, qcSample: 0, retained: 0, stability: 0 };
const source = { category: "tablet" as const, receivedUnit: "kg", packingExpectedYield: 1, packsPerShipper: 100 };
const validate = (patch: Partial<YieldInputs> = {}) => { const values = { ...inputs, ...patch }; return packingProblem({
  inputs: values, figures: yieldFigures(values, source), batchSize: 240_000, packsPerShipper: 100, reason: "", materials: [], entries: {}, unitIds: {},
}); };

it("rejects non-finite, fractional and over-sampled pack counts at the write boundary", () => {
  expect(validate()).toBeNull();
  for (const value of [NaN, Infinity, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) expect(validate({ actualPacked: value })).not.toBeNull();
  expect(validate({ qcSample: 240_000 })).toContain("left after samples");
  expect(validate({ qcSample: 240_001 })).toContain("left after samples");
  expect(validate({ received: Number.MAX_VALUE })).not.toBeNull();
  expect(finalPackingFormSchema.safeParse({ ...inputs, retained: 0.5 }).success).toBe(false);
});

it("uses the same yield rules for every packaging category and requires a reason at exactly 2%", () => {
  for (const category of ["tablet", "capsules", "tube", "dry powder", "sachet"] as const) {
    expect(yieldFigures(inputs, { ...source, category }).expected).toBe(240_000);
  }
  const syrup = { ...source, category: "syrup" as const, receivedUnit: "L", packingExpectedYield: 100 };
  expect(yieldFigures({ ...inputs, actualPacked: 98 }, syrup)).toMatchObject({ expected: 100, percent: -2, needsReason: true });
  expect(yieldFigures({ ...inputs, actualPacked: 102 }, syrup)).toMatchObject({ percent: 2, needsReason: true });
  expect(yieldFigures({ ...inputs, actualPacked: 101 }, syrup).needsReason).toBe(false);
});

it("merges split issue lines once and conserves raw quantities through reconciliation", () => {
  const items = [{ materialId: "m1", name: "Film", code: "PM1", unit: "mg", quantity: 100_000 },
    { materialId: "m1", name: "Film", code: "PM1", unit: "mg", quantity: 200_000 }];
  const materials = packingMaterials(items, [{ materialId: "m1", quantity: 100_000 }]);
  expect(materials).toHaveLength(1);
  const material = materials.at(0);
  if (!material) throw new Error("Expected the merged material");
  expect(material).toMatchObject({ received: 300_000, delivered: 100_000, total: 400_000, displayUnit: "g" });
  const entries = { m1: { packed: 100, rejected: 0, sampled: 200, reason: "" } };
  expect(materialFigures(material, entries.m1)).toMatchObject({ returned: 100, problem: null });
  const request = materialRequests(materials, entries).at(0);
  expect(request).toMatchObject({ packedQuantity: 100_000, sampledQuantity: 200_000, returnedQuantity: 100_000, totalAccountedForQuantity: 400_000 });
  for (const rejected of [-0.1, NaN, Infinity]) expect(materialFigures(material, { ...entries.m1, rejected }).problem).toContain("non-negative");
  expect(packingProblem({ inputs, figures: yieldFigures(inputs, source), batchSize: 240_000, packsPerShipper: 100,
    reason: "", materials, entries, unitIds: {} })).toContain("unit of measure is missing");
});

it.each([
  { unit: "mg", quantity: 50, displayUnit: "mg", total: 50 },
  { unit: "kg", quantity: 50, displayUnit: "mg", total: 50 },
  { unit: "mg", quantity: 50_000, displayUnit: "g", total: 50 },
  { unit: "g", quantity: 50_000_000, displayUnit: "kg", total: 50 },
  { unit: "L", quantity: 50, displayUnit: "ml", total: 50 },
  { unit: "ml", quantity: 50_000, displayUnit: "L", total: 50 },
  { unit: "PCS", quantity: 50, displayUnit: "PCS", total: 50 },
])("selects the entry unit from the raw quantity ($quantity, $unit) and conserves writes", ({ unit, quantity, displayUnit, total }) => {
  const materials = packingMaterials([{ materialId: "m1", name: "Film", code: "PM1", unit, quantity }], []);
  const material = materials.at(0);
  if (!material) throw new Error("Expected the issued material");
  expect(material.displayUnit).toBe(displayUnit);
  const entries = { m1: { packed: 49, rejected: 0, sampled: 0, reason: "" } };
  expect(materialFigures(material, entries.m1)).toMatchObject({ total, returned: 1, problem: null });
  expect(materialRequests(materials, entries)).toMatchObject([{ receivedQuantity: quantity, totalReceivedQuantity: quantity,
    packedQuantity: quantity * 0.98, returnedQuantity: quantity / 50 }]);
  expect(returnedMaterials(materials, entries, { m1: "unit-id" })).toEqual([{ materialId: "m1", quantity: quantity / 50, uoMId: "unit-id" }]);
});

it("fails closed on invalid stock amounts and accepts a recorded negative yield variance", () => {
  expect(issuedPackagingSchema.safeParse({ items: [{ material: { id: "m1" }, quantity: -1 }] }).success).toBe(false);
  expect(issuedPackagingSchema.safeParse({ items: [{ material: { id: "m1" } }] }).success).toBe(false);
  expect(recordedPackingSchema.safeParse({ id: "fp", totalQuantityPacked: 98, nUmberOfFullShipperPacked: 9, leftOver: 8,
    numberOfBottlesPerShipper: 10, yieldTotalQuantityPacked: 98, totalGainOrLoss: -2, expectedYield: 100 }).success).toBe(true);
});
