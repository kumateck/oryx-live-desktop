import { expect, it } from "vitest";
import { bomItemFormSchema, savedBomSchema } from "../schemas/bom-schema";
import { bomProblems, fromSavedBom, hasMaterial, toBomRequest } from "./bom";

const saved = savedBomSchema.parse({ version: 3, isActive: true, billOfMaterial: { items: [
  { id: "b2", order: 2, baseQuantity: 2, grade: "BP", baseUoM: { id: "u-g", symbol: "g" },
    material: { id: "m-sugar", name: "Sugar", code: "RM-002", materialCategory: { name: "Sweetener" } }, substitutes: null },
  { id: "b1", order: 1, baseQuantity: 100, baseUoM: { id: "u-mg", symbol: "mg" },
    material: { id: "m-api", name: "Albendazole", code: "RM-001", specification: { specificationNumber: "SPEC-9" } },
    substitutes: [{ substituteMaterial: { id: "m-alt", name: "Albendazole micronised", code: "RM-010" } }, { substituteMaterial: null }] },
  { id: "b3", order: 3, baseQuantity: 1, material: null },
] } });
const lines = fromSavedBom(saved);

it("reads the saved formula in step order and skips lines without a material", () => {
  expect(lines.map((line) => line.material.label)).toEqual(["Albendazole", "Sugar"]);
  expect(lines[0]).toMatchObject({ key: "b1", code: "RM-001", specification: "SPEC-9", unit: { id: "u-mg", symbol: "mg" }, substitutes: [{ value: "m-alt", label: "Albendazole micronised" }] });
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
    { materialId: "m-sugar", baseUoMId: "u-g", baseQuantity: 2, grade: "BP", order: 1, prescribedQuantity: 600_000, isSubstitutable: false, substituteMaterialIds: [] },
    { materialId: "m-api", baseUoMId: "u-mg", baseQuantity: 100, grade: null, order: 2, prescribedQuantity: 30_000_000, isSubstitutable: true, substituteMaterialIds: ["m-alt"] },
  ]);
  // Without the product's sizes the batch quantity is unknown, not infinite.
  expect(toBomRequest("p1", [lines[0]!], 0, 1_500_000).items?.[0]?.prescribedQuantity).toBe(0);
});

it("validates a line: material, positive quantity, and no self-substitution", () => {
  const material = { value: "m-api", label: "Albendazole" };
  expect(bomItemFormSchema.safeParse({ material, baseQuantity: 1 }).success).toBe(true);
  expect(bomItemFormSchema.safeParse({ material, baseQuantity: 0 }).success).toBe(false);
  const self = bomItemFormSchema.safeParse({ material, baseQuantity: 1, substitutes: [material] });
  expect(self.success ? "" : self.error.issues[0]?.message).toBe("A material cannot substitute for itself");
});
