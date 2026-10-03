import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { fromSmallestUnit, relatedUnits, toLargestUnit, toSmallestUnit } from "@/shared/units/quantity";

export const materialsPath = "/warehouse/materials";
export const materialPath = (id: string, kind: MaterialKind) => `${materialsPath}/${id}/details?type=${kind}`;
export const linkedPath = `${materialsPath}/linked`;
export const unlinkedPath = `${materialsPath}/unlink`;
export const audit = { module: "Warehouse", subModule: "Materials" } as const;
type ByKind = Record<MaterialKind, string>;
export { materialPermissions } from "./material-access";
/** The record type whose numbering rule a material's code follows. */
export const codeModels: ByKind = { 0: "RawMaterial", 1: "PackageMaterial" };
/** A raw material's code carries the first letter of its name; a packaging material's, of its category. */
export function codeLetter(kind: MaterialKind, name: string, category: string | null): string {
  return ((kind === 0 ? name : category ?? "").trim().charAt(0)).toUpperCase();
}

/** Stock and stock levels are stored in the smallest unit of the family the material is counted in. */
const smallest = (unit: string | null) => relatedUnits(unit)[0] ?? unit;
export const levelUnit = (unit: string | null) => relatedUnits(unit).at(-1) ?? unit ?? "";
export const showStock = (value: number | null | undefined, unit: string | null) => value === null || value === undefined ? "–" : toLargestUnit(value, smallest(unit), "calculated")?.text ?? String(value);
export const enteredLevel = (stored: number, unit: string | null) => fromSmallestUnit(stored, levelUnit(unit));
export const storedLevel = (entered: number, unit: string | null) => toSmallestUnit(entered, levelUnit(unit));

/** Why a material cannot be deleted, or null when it can. The server refuses one that has stock. */
export const deleteBlock = (material: { totalStock: number }) => material.totalStock > 0 ? "This material has stock, so it cannot be deleted." : null;
/** Why a material cannot be unlinked from the department, or null when it can. */
export const unlinkBlock = (link: { stock: number }) => link.stock > 0 ? "Your store holds stock of this material, so it cannot be unlinked." : null;

export interface Levels { minimum: number; reorder: number; maximum: number }
/** Where a department's stock of a material stands against its levels. Reserved stock is not free to use. */
export function stockStanding(link: { stock: number; reserved: number } & Levels): "none" | "below-minimum" | "reorder" | "ok" | "above-maximum" {
  if (link.maximum <= 0) return "none";
  const free = link.stock - link.reserved;
  if (free < link.minimum) return "below-minimum";
  if (free <= link.reorder) return "reorder";
  return link.stock > link.maximum ? "above-maximum" : "ok";
}
export const standingLabels = { none: "No levels set", "below-minimum": "Below minimum", reorder: "Re-order", ok: "In range", "above-maximum": "Above maximum" } as const;
