import { freeStock } from "@/modules/schedules/lib/batch-materials";
import type { BatchMaterial } from "@/modules/schedules/schemas/batch-schema";
import type { DomainEntitiesProductionSchedulesCreateProductionExtraPacking as ExtraMaterialRequest } from "@/shared/api/generated/production";
import { relatedUnits, toSmallestUnit } from "@/shared/units/quantity";

/** One material of the batch, with what is being asked for on top of its planned quantity. */
export interface ExtraMaterialLine { material: BatchMaterial; kind: "raw" | "packaging"; quantity: number | null; unit: string }

export function extraMaterialLines(raw: readonly BatchMaterial[], packaging: readonly BatchMaterial[]): ExtraMaterialLine[] {
  // Each line starts in the largest unit of its family, which is the one people think in (kg, L).
  const line = (kind: "raw" | "packaging") => (material: BatchMaterial): ExtraMaterialLine => ({ material, kind, quantity: null, unit: relatedUnits(material.unit).at(-1) ?? "" });
  return [...raw.map(line("raw")), ...packaging.map(line("packaging"))];
}

/** The asked quantity in the unit quantities are stored in, or null when nothing is asked for on this line. */
export function requestedQuantity(line: ExtraMaterialLine): number | null {
  return line.quantity !== null && line.quantity > 0 ? toSmallestUnit(line.quantity, line.unit) : null;
}

/** Why a line cannot be requested as entered, or null when it is fine (or empty). */
export function extraMaterialProblem(line: ExtraMaterialLine): string | null {
  if (line.quantity === null) return null;
  if (!(line.quantity > 0)) return "Enter a quantity above zero, or clear it";
  if (!line.material.materialId || !line.material.unitId) return "This material has no unit of measure in this department";
  const asked = requestedQuantity(line);
  // Stored quantities and warehouse stock share the same unit, so they can be compared directly.
  if (asked !== null && asked > freeStock(line.material)) return "More than the warehouse has free";
  return null;
}

export function extraMaterialRequest(lines: readonly ExtraMaterialLine[]): ExtraMaterialRequest[] {
  return lines.flatMap((line) => {
    const quantity = requestedQuantity(line);
    return quantity !== null && line.material.materialId && line.material.unitId ? [{ materialId: line.material.materialId, uoMId: line.material.unitId, quantity }] : [];
  });
}
