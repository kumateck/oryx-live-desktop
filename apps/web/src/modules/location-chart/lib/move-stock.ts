import { fromSmallestUnit, relatedUnits, toSmallestUnit } from "@/shared/units/quantity";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import type { MoveStockFormValues } from "../schemas/rack-schema";

/** Stock of one batch on one shelf, about to be moved in whole or in part. */
export interface MoveSource { shelfBatchId: string; shelfId: string | null; shelfLabel: string | null; materialName: string; batchNumber: string | null; quantity: number; unit: string | null; unitId: string | null; kind: MaterialKind }

/** The unit quantities are typed in: the largest of the source's family (kg, L), or the unit itself for a counted one. */
export function moveUnit(source: Pick<MoveSource, "unit">): string { return relatedUnits(source.unit).at(-1) ?? source.unit ?? ""; }
export function availableToMove(source: Pick<MoveSource, "quantity" | "unit">): number { return fromSmallestUnit(toSmallestUnit(source.quantity, source.unit), moveUnit(source)); }
/** A typed quantity in the unit the shelf record is kept in, whichever unit of its family that is. */
export function inSourceUnit(value: number, source: Pick<MoveSource, "unit">): number { return fromSmallestUnit(toSmallestUnit(value, moveUnit(source)), source.unit); }

export interface MoveProblem { index: number | null; field: "quantity" | "shelf" | null; message: string }

/** What stops a move, checked the way the server checks it, so nothing is sent that it would refuse. */
export function moveProblems(source: MoveSource, moves: MoveStockFormValues["moves"]): MoveProblem[] {
  const problems: MoveProblem[] = [];
  const seen = new Set<string>();
  moves.forEach((move, index) => {
    const shelf = move.shelf?.value;
    if (!shelf) return;
    if (shelf === source.shelfId) problems.push({ index, field: "shelf", message: "The stock is already on this shelf" });
    else if (seen.has(shelf)) problems.push({ index, field: "shelf", message: "This shelf is chosen twice; put the whole quantity on one line" });
    seen.add(shelf);
  });
  const total = moves.reduce((sum, move) => sum + (Number.isFinite(move.quantity) ? move.quantity : 0), 0);
  // Compared in the typed unit, so 0.1 + 0.2 kg is not found to exceed 0.3 kg by rounding.
  if (Number(total.toPrecision(12)) > availableToMove(source)) problems.push({ index: null, field: null, message: `The quantities add up to more than the ${availableToMove(source)} ${moveUnit(source)} on the shelf` });
  return problems;
}

export interface MoveRequest { shelfMaterialBatchId: string; movedShelfBatchMaterials: { warehouseLocationShelfId: string; quantity: number; uomId: string | null; note: string }[] }

/** The move in stored quantities, in the source's own unit, which the server insists on. */
export function moveRequest(source: MoveSource, moves: MoveStockFormValues["moves"]): MoveRequest {
  return { shelfMaterialBatchId: source.shelfBatchId, movedShelfBatchMaterials: moves.flatMap((move) => move.shelf ? [{
    warehouseLocationShelfId: move.shelf.value, quantity: inSourceUnit(move.quantity, source), uomId: source.unitId, note: move.note ?? "" }] : []) };
}
