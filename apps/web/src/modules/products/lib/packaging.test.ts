import { expect, it } from "vitest";
import { savedPackagesSchema } from "../schemas/packaging-schema";
import { fromSavedPackages, packagingConflict, packagingTotal, toPackagesRequest } from "./packaging";

const saved = savedPackagesSchema.parse([
  { id: "p1", material: { id: "m-bottle", name: "Bottle", code: "PM-001" }, productPacking: { id: "s1", name: "1x100ml" }, prescribedQuantity: 1, packingExcessMargin: 0.05,
    baseQuantity: 1, unitCapacity: 0, materialThickness: "2mm", directLinkMaterial: { id: "m-cap" }, substitutes: [{ substituteMaterial: { id: "m-alt", name: "Clear bottle", code: "PM-009" } }] },
  { id: "p2", material: { id: "m-carton", name: "Carton", code: "PM-002" }, prescribedQuantity: 0.02 },
  { id: "p3", material: null },
]);

it("reads saved lines, dropping any without a material", () => {
  const lines = fromSavedPackages(saved);
  expect(lines.map((line) => [line.key, line.material.label, line.packing?.label ?? null])).toEqual([["p1", "Bottle", "1x100ml"], ["p2", "Carton", null]]);
  expect(packagingTotal(lines[0]!)).toBeCloseTo(1.05);
});

it("sends back the fields the page does not edit, and the allowance in both fields", () => {
  expect(toPackagesRequest(fromSavedPackages(saved))[0]).toEqual({
    materialId: "m-bottle", productPackingId: "s1", prescribedQuantity: 1, packingExcessMargin: 0.05, loose: 0.05,
    baseQuantity: 1, unitCapacity: 0, materialThickness: "2mm", otherStandards: null, directLinkMaterialId: "m-cap", substituteMaterialIds: ["m-alt"],
  });
});

it("allows different packing styles and All styles together while rejecting duplicate material/style pairs", () => {
  const lines = fromSavedPackages(saved);
  expect(packagingConflict(lines, "m-bottle", "s1", null)).toBe("This material is already listed for this packing style");
  expect(packagingConflict(lines, "m-bottle", "s2", null)).toBeNull();
  expect(packagingConflict(lines, "m-bottle", null, null)).toBeNull();
  expect(packagingConflict(lines, "m-carton", null, null)).toBe("This material is already listed");
  expect(packagingConflict(lines, "m-carton", "s1", null)).toBeNull();
  // Editing a line does not conflict with itself.
  expect(packagingConflict(lines, "m-bottle", "s1", "p1")).toBeNull();
  expect(packagingConflict(lines, "m-new", null, null)).toBeNull();
});

it("keeps each packing line's substitutes with their names and sends them back on save", () => {
  const [bottle] = fromSavedPackages(saved);
  expect(bottle?.substitutes).toEqual([{ value: "m-alt", label: "Clear bottle" }]);
  const edited = { ...bottle!, substitutes: [{ value: "m-alt", label: "Clear bottle" }, { value: "m-alt2", label: "Flint bottle" }] };
  expect(toPackagesRequest([edited])[0]?.substituteMaterialIds).toEqual(["m-alt", "m-alt2"]);
});
