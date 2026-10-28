import { expect, it } from "vitest";
import { finalPackingRequest, materialFigures, materialRequests, packCategory, packingMaterials, packingProblem, returnedMaterials, yieldFigures, yieldTerms, type YieldInputs } from "./final-packing";
import { finalPackingFormSchema, issuedPackagingSchema, packingFormSchema, recordedPackingSchema } from "../schemas/final-packing-schema";

const inputs: YieldInputs = { received: 120, averageFilled: 500, actualPacked: 240_000, qcSample: 0, retained: 0, stability: 0 };
const source = { category: "tablet" as const, receivedUnit: "kg", packingExpectedYield: 1, packsPerShipper: 100 };

it("identifies syrup with generic or absent packing-unit names without overriding explicit non-syrup categories", () => {
  for (const unitName of [null, "Bottle", "Bottles", "PCS"]) {
    expect(packCategory(unitName, { categoryName: "Syrup", unit: "ml" })).toBe("syrup");
    expect(packCategory(unitName, { categoryName: null, unit: "L" })).toBe("syrup");
  }
  expect(packCategory("dry powder", { categoryName: null, unit: "ml" })).toBe("dry powder");
  expect(packCategory("Bottle", { categoryName: "dry powder", unit: "ml" })).toBe("dry powder");
  expect(packCategory("Box", { categoryName: null, unit: "mg" })).toBeNull();
});

it("reconciles the syrup paper example by volume and counts each sample once", () => {
  const source = { category: "syrup" as const, receivedUnit: "L", packingExpectedYield: 20_000, packsPerShipper: 30 };
  const input = { received: null, averageFilled: 150, actualPacked: 20_025, qcSample: 3, retained: 12, stability: 0 };
  const figures = yieldFigures(input, source);
  expect(figures).toMatchObject({ expected: 20_000, samples: 15, afterSamples: 20_010, totalPacked: 20_010,
    gainOrLoss: 25, percent: 0.125, fullShippers: 667, leftOver: 0, needsReason: false });
  expect(packingProblem({ category: "syrup", inputs: input, figures, batchSize: 3000, packsPerShipper: 30,
    reason: "", materials: [], entries: {}, unitIds: {} })).toBeNull();
  expect(finalPackingRequest({ category: "syrup", batchId: "batch", stepId: "step", packingId: "style", batchSize: 3000,
    inputs: input, figures, packsPerShipper: 30, reason: "", materials: [] })).toMatchObject({
    totalWeightReceived: 0, yieldTotalQuantityPacked: 20_025, totalNumberOfBottles: 20_010, totalQuantityPacked: 20_010,
    qualityControlAnalyticalSample: 3, retainedSamples: 12, totalGainOrLoss: 25,
  });
});

it("does not count syrup samples as loss and preserves the preloaded expected yield", () => {
  const source = { category: "syrup" as const, receivedUnit: "L", packingExpectedYield: 50_000, packsPerShipper: 60 };
  const input = { received: null, averageFilled: 60, actualPacked: 50_000, qcSample: 3, retained: 0, stability: 0 };
  expect(yieldFigures(input, source)).toMatchObject({ expected: 50_000, afterSamples: 49_997, gainOrLoss: 0, percent: 0, fullShippers: 833, leftOver: 17 });
  expect(yieldFigures({ ...input, averageFilled: 75 }, source).expected).toBe(50_000);
  expect(yieldFigures(input, { ...source, packingExpectedYield: 25_000 }).expected).toBe(25_000);
  expect(yieldFigures(input, { ...source, packingExpectedYield: 0 }).expected).toBe(0);
});

it("requires received weight only for the weight-based forms and never substitutes the style's expected count", () => {
  const values = { averageFilled: 150, actualPacked: 20_025, qcSample: 3, retained: 12, stability: 0 };
  expect(packingFormSchema("syrup").safeParse(values).success).toBe(true);
  expect(yieldTerms("syrup", "ml").requiresReceived).toBe(false);
  for (const category of ["tablet", "capsules", "tube", "dry powder", "sachet"] as const) {
    expect(packingFormSchema(category).safeParse(values).success).toBe(false);
    expect(yieldTerms(category, "mg").requiresReceived).toBe(true);
    expect(yieldFigures({ ...inputs, received: null }, { ...source, category }).expected).toBe(0);
  }
});
const validate = (patch: Partial<YieldInputs> = {}) => { const values = { ...inputs, ...patch }; return packingProblem({
  category: source.category, inputs: values, figures: yieldFigures(values, source), batchSize: 240_000, packsPerShipper: 100, reason: "", materials: [], entries: {}, unitIds: {},
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
  expect(packingProblem({ category: source.category, inputs, figures: yieldFigures(inputs, source), batchSize: 240_000, packsPerShipper: 100,
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
