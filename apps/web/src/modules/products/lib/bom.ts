import type { DomainEntitiesBillOfMaterialsRequestCreateBillOfMaterialRequest } from "@/shared/api/generated/materials";
import type { SavedBom } from "../schemas/bom-schema";
import { batchQuantity } from "./product-detail";
import type { MaterialUnit } from "./material-unit";
import { convertUnit } from "@/shared/units/quantity";

interface Option { value: string; label: string }

/** A material that may replace the line's material, with its own quantity per composition unit. */
export interface BomSubstitute extends Option {
  /** Null on substitutes saved before they had their own quantity; such a BOM cannot be saved until it is set. */
  baseQuantity: number | null;
  /** The substitute's department stock unit (mg when the line uses density conversion); null until known. */
  unit: { id: string; symbol: string } | null;
  linkedUnit?: MaterialUnit;
}

/** Convert a saved amount into its own material's current linked unit, never just relabel it. */
export function linkedBomQuantity(quantity: number | null, source: MaterialUnit | null, target: MaterialUnit): number | null {
  return quantity === null || !source ? null : convertUnit(quantity, source.symbol, target.symbol);
}

/** Preflight every main and substitute link. The request remains in linked units; the server normalizes storage. */
export function verifyBomUnits(lines: readonly BomLine[], units: ReadonlyMap<string, MaterialUnit>): { lines: BomLine[]; problems: string[] } {
  const problems: string[] = [];
  const verify = (name: string, quantity: number | null, source: MaterialUnit | null, linked: MaterialUnit | undefined,
    target: MaterialUnit | undefined, density: boolean) => {
    if (!target) { problems.push(`Could not verify the department-linked unit for ${name}. Retry before saving.`); return null; }
    if (linked && (linked.id !== target.id || linked.symbol.toLowerCase() !== target.symbol.toLowerCase())) {
      problems.push(`A department-linked unit changed for ${name}. Reload and review the quantities before saving.`); return null;
    }
    if (density) return quantity;
    const converted = linkedBomQuantity(quantity, source, target);
    if (converted === null || !Number.isFinite(converted) || converted <= 0)
      problems.push(`${name}: review and enter the quantity in the department unit (${target.symbol}) before saving. The saved unit (${source?.symbol || "missing"}) cannot be converted.`);
    return converted;
  };
  const verified = lines.map(line => {
    const unit = units.get(line.material.value);
    const quantity = verify(line.material.label, line.baseQuantity, line.unit, line.linkedUnit, unit, line.useDensityConversion);
    const substitutes = line.substitutes.map(sub => {
      const target = units.get(sub.value);
      const converted = verify(sub.label, sub.baseQuantity, sub.unit, sub.linkedUnit, target, line.useDensityConversion);
      return { ...sub, baseQuantity: converted, unit: line.useDensityConversion ? sub.unit : target ?? sub.unit,
        ...(target ? { linkedUnit: target } : {}) };
    });
    return { ...line, baseQuantity: quantity ?? Number.NaN, unit: line.useDensityConversion ? line.unit : unit ?? line.unit,
      ...(unit ? { linkedUnit: unit } : {}), substitutes };
  });
  return { lines: verified, problems };
}

/** One material of a bill of materials being edited. `key` identifies the row on the page. */
export interface BomLine {
  key: string;
  material: Option;
  code: string;
  /** The material's category, which Oryx shows as its function in the formula. */
  category: string;
  specification: string;
  unit: { id: string; symbol: string };
  /** Only picker or linkage lookups can establish this; a saved BOM unit may be stale. */
  linkedUnit?: MaterialUnit;
  useDensityConversion: boolean;
  baseQuantity: number;
  grade: string;
  substitutes: BomSubstitute[];
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
    useDensityConversion: item.useDensityConversion === true,
    baseQuantity: item.baseQuantity ?? 0, grade: item.grade,
    substitutes: item.substitutes.flatMap((entry) => entry.substituteMaterial
      ? [{ value: entry.substituteMaterial.id, label: entry.substituteMaterial.name, baseQuantity: entry.baseQuantity,
        unit: entry.baseUoM?.id ? { id: entry.baseUoM.id, symbol: entry.baseUoM.symbol?.trim() ?? "" } : null }] : []),
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
  const noUnit = lines.filter((line) => !line.useDensityConversion && !line.unit.id).map((line) => line.material.label);
  if (noUnit.length) problems.push(`No unit of measure is set for: ${noUnit.join(", ")}. Set it on the material, then choose the material again.`);
  const unquantified = lines.flatMap((line) => line.substitutes
    .filter((substitute) => substitute.baseQuantity === null || (!line.useDensityConversion && !substitute.unit?.id))
    .map((substitute) => `${substitute.label} (for ${line.material.label})`));
  if (unquantified.length) problems.push(`Set the quantity of each substitute: ${unquantified.join(", ")}. Edit the material and enter how much of the substitute replaces it.`);
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
    baseUoMId: line.useDensityConversion ? null : line.unit.id,
    useDensityConversion: line.useDensityConversion,
    baseQuantity: line.baseQuantity,
    grade: line.grade.trim() || null,
    order: index + 1,
    prescribedQuantity: batchQuantity(line.baseQuantity, compositionSize, batchSize) ?? 0,
    isSubstitutable: line.substitutes.length > 0,
    substituteMaterialIds: line.substitutes.map((item) => item.value),
    // Each substitute is saved with its own quantity; the store then issues either it or the main material, never both.
    substitutes: line.substitutes.map((item) => ({
      materialId: item.value,
      baseUoMId: line.useDensityConversion ? null : item.unit?.id ?? null,
      baseQuantity: item.baseQuantity ?? 0,
      prescribedQuantity: batchQuantity(item.baseQuantity ?? 0, compositionSize, batchSize) ?? 0,
    })),
  })) };
}
