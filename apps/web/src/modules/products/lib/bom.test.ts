import { expect, it } from "vitest";
import { bomItemFormSchema, savedBomSchema } from "../schemas/bom-schema";
import { bomProblems, fromSavedBom, hasMaterial, toBomRequest } from "./bom";

const saved = savedBomSchema.parse({ version: 3, isActive: true, billOfMaterial: { items: [
  { id: "b2", order: 2, baseQuantity: 2, grade: "BP", baseUoM: { id: "u-g", symbol: "g" },
    material: { id: "m-sugar", name: "Sugar", code: "RM-002", materialCategory: { name: "Sweetener" } }, substitutes: null },
  { id: "b1", order: 1, baseQuantity: 100, baseUoM: { id: "u-mg", symbol: "mg" },
    material: { id: "m-api", name: "Albendazole", code: "RM-001", specification: { specificationNumber: "SPEC-9" } },
    substitutes: [{ substituteMaterial: { id: "m-alt", name: "Albendazole micronised", code: "RM-010" }, baseQuantity: 80, baseUoM: { id: "u-mg", symbol: "mg" } },
      { substituteMaterial: null }] },
  { id: "b3", order: 3, baseQuantity: 1, material: null },
] } });
const lines = fromSavedBom(saved);

it("reads the saved formula in step order and skips lines without a material", () => {
  expect(lines.map((line) => line.material.label)).toEqual(["Albendazole", "Sugar"]);
  expect(lines[0]).toMatchObject({ key: "b1", code: "RM-001", specification: "SPEC-9", unit: { id: "u-mg", symbol: "mg" }, substitutes: [{ value: "m-alt", label: "Albendazole micronised", baseQuantity: 80, unit: { id: "u-mg", symbol: "mg" } }] });
  expect(lines[1]).toMatchObject({ category: "Sweetener", grade: "BP", substitutes: [] });
  expect(fromSavedBom(savedBomSchema.parse(null))).toEqual([]);
});

it("allows a material once and reports what blocks a save", () => {
  expect(hasMaterial(lines, "m-sugar", null)).toBe(true);
  expect(hasMaterial(lines, "m-sugar", "b2")).toBe(false);
  expect(bomProblems([])).toEqual(["Add at least one material."]);
  expect(bomProblems(lines)).toEqual([]);
  expect(bomProblems([{ ...lines[0]!, unit: { id: "", symbol: "" } }])[0]).toContain("No unit of measure is set for: Albendazole");
});

it("numbers steps by position and sends each line's full-batch quantity and substitutes", () => {
  const request = toBomRequest("p1", [lines[1]!, lines[0]!], 5, 1_500_000);
  expect(request.productId).toBe("p1");
  expect(request.items).toEqual([
    { materialId: "m-sugar", baseUoMId: "u-g", baseQuantity: 2, grade: "BP", order: 1, prescribedQuantity: 600_000, isSubstitutable: false, useDensityConversion: false, substituteMaterialIds: [], substitutes: [] },
    // The substitute keeps its own quantity: 80 mg replaces 100 mg of the main material.
    { materialId: "m-api", baseUoMId: "u-mg", baseQuantity: 100, grade: null, order: 2, prescribedQuantity: 30_000_000, isSubstitutable: true, useDensityConversion: false, substituteMaterialIds: ["m-alt"],
      substitutes: [{ materialId: "m-alt", baseUoMId: "u-mg", baseQuantity: 80, prescribedQuantity: 24_000_000 }] },
  ]);
  // Without the product's sizes the batch quantity is unknown, not infinite.
  expect(toBomRequest("p1", [lines[0]!], 0, 1_500_000).items?.[0]?.prescribedQuantity).toBe(0);
});

it("sends density conversion without reusing the storage-unit ID as the BOM unit", () => {
  const line = { ...lines[0]!, useDensityConversion: true, unit: { id: "", symbol: "mg" }, linkedUnit: { id: "u-ml", symbol: "ml" } };
  expect(toBomRequest("p1", [line], 1, 1_000).items?.[0]).toMatchObject({
    baseUoMId: null, useDensityConversion: true, baseQuantity: 100, prescribedQuantity: 100_000,
  });
});

it("validates a line: material, positive quantity, and no self-substitution", () => {
  const material = { value: "m-api", label: "Albendazole" };
  expect(bomItemFormSchema.safeParse({ material, baseQuantity: 1, useDensityConversion: false }).success).toBe(true);
  expect(bomItemFormSchema.safeParse({ material, baseQuantity: 0, useDensityConversion: false }).success).toBe(false);
  const self = bomItemFormSchema.safeParse({ material, baseQuantity: 1, useDensityConversion: false, substitutes: [material], substituteQuantities: { "m-api": 1 } });
  expect(self.success ? "" : self.error.issues[0]?.message).toBe("A material cannot substitute for itself");
});

it("requires each substitute's own positive quantity", () => {
  const material = { value: "m-api", label: "Albendazole" };
  const substitute = { value: "m-alt", label: "Albendazole anhydrous" };
  const missing = bomItemFormSchema.safeParse({ material, baseQuantity: 1, useDensityConversion: false, substitutes: [substitute] });
  expect(missing.success ? null : missing.error.issues[0]?.path).toEqual(["substituteQuantities", "m-alt"]);
  expect(bomItemFormSchema.safeParse({ material, baseQuantity: 1, useDensityConversion: false, substitutes: [substitute], substituteQuantities: { "m-alt": 0 } }).success).toBe(false);
  expect(bomItemFormSchema.safeParse({ material, baseQuantity: 1, useDensityConversion: false, substitutes: [substitute], substituteQuantities: { "m-alt": 0.8 } }).success).toBe(true);
});

it("will not save a substitute saved before it had its own quantity", () => {
  const legacy = { ...lines[0]!, substitutes: [{ value: "m-alt", label: "Albendazole micronised", baseQuantity: null, unit: null }] };
  expect(bomProblems([legacy])[0]).toContain("Set the quantity of each substitute: Albendazole micronised (for Albendazole)");
});
