import type { DomainEntitiesBillOfMaterialsRequestCreateBillOfMaterialRequest } from "@/shared/api/generated/materials";
import type { SavedBom } from "../schemas/bom-schema";
import { batchQuantity } from "./product-detail";

interface Option { value: string; label: string }

/** One material of a bill of materials being edited. `key` identifies the row on the page. */
export interface BomLine {
  key: string;
  material: Option;
  code: string;
  /** The material's category, which Oryx shows as its function in the formula. */
  category: string;
  specification: string;
  unit: { id: string; symbol: string };
  baseQuantity: number;
  grade: string;
  substitutes: Option[];
}

/** Details of a material that a line copies when the material is chosen. */
export interface MaterialFacts { code: string; category: string; specification: string; unit: { id: string; symbol: string } }

export function fromSavedBom(saved: SavedBom): BomLine[] {
  const items = saved?.billOfMaterial?.items ?? [];
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).flatMap((item, index) => item.material ? [{
    key: item.id ?? `saved-${index}`,
    material: { value: item.material.id, label: item.material.name },
    code: item.material.code, category: item.material.materialCategory, specification: item.material.specification,
    unit: { id: item.baseUoM?.id ?? "", symbol: item.baseUoM?.symbol?.trim() ?? "" },
    baseQuantity: item.baseQuantity ?? 0, grade: item.grade,
    substitutes: item.substitutes.flatMap((entry) => entry.substituteMaterial
      ? [{ value: entry.substituteMaterial.id, label: entry.substituteMaterial.name }] : []),
  }] : []);
}

/** A material may appear once in a formula. `exceptKey` is the line being edited. */
export function hasMaterial(lines: readonly BomLine[], materialId: string, exceptKey: string | null): boolean {
  return lines.some((line) => line.key !== exceptKey && line.material.value === materialId);
}

/** What cannot be saved yet, in words for the user; empty when the formula is ready. */
export function bomProblems(lines: readonly BomLine[]): string[] {
  const problems: string[] = [];
  if (lines.length === 0) problems.push("Add at least one material.");
  const noUnit = lines.filter((line) => !line.unit.id).map((line) => line.material.label);
  if (noUnit.length) problems.push(`No unit of measure is set for: ${noUnit.join(", ")}. Set it on the material, then choose the material again.`);
  return problems;
}

/**
 * The save request. Steps are numbered by position, and each line carries its quantity for a full
 * batch so the saved formula matches what the page showed.
 */
export function toBomRequest(productId: string, lines: readonly BomLine[], compositionSize: number | null, batchSize: number | null,
): DomainEntitiesBillOfMaterialsRequestCreateBillOfMaterialRequest {
  return { productId, items: lines.map((line, index) => ({
    materialId: line.material.value,
    baseUoMId: line.unit.id,
    baseQuantity: line.baseQuantity,
    grade: line.grade.trim() || null,
    order: index + 1,
    prescribedQuantity: batchQuantity(line.baseQuantity, compositionSize, batchSize) ?? 0,
    isSubstitutable: line.substitutes.length > 0,
    substituteMaterialIds: line.substitutes.map((item) => item.value),
  })) };
}
