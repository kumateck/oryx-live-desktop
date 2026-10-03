import { convertUnit, relatedUnits } from "@/shared/units/quantity";
import type { PickRow } from "../schemas/requisition-schema";

/** One material on a purchase requisition being written. The quantity is typed in `enteredUnit`. */
export interface OrderLine { id: string; name: string; code: string | null; unit: string | null; unitId: string | null; stock: number; maximum: number; quantity: number | null; enteredUnit: string }

/** Starts a line for a chosen material, with the quantity to be typed in the largest unit of its family (kg, L). */
export function newOrderLine(row: PickRow): OrderLine {
  return { id: row.id, name: row.name, code: row.code, unit: row.unit, unitId: row.unitId, stock: row.stock, maximum: row.maximum, quantity: null, enteredUnit: relatedUnits(row.unit).at(-1) ?? row.unit ?? "" };
}

/** How far the warehouse is under the material's maximum level, in the line's entered unit. Null when no maximum is set or stock is at it. */
export function shortOfMaximum(line: Pick<OrderLine, "stock" | "maximum" | "unit" | "enteredUnit">): number | null {
  if (line.maximum <= 0 || line.stock >= line.maximum) return null;
  return convertUnit(line.maximum - line.stock, line.unit, line.enteredUnit);
}

export interface OrderLineProblem { id: string; message: string }

/** What stops the requisition from being raised. */
export function orderLineProblems(lines: readonly OrderLine[]): OrderLineProblem[] {
  return lines.flatMap((line) => {
    if (!line.unitId) return [{ id: line.id, message: `${line.name} has no unit of measure set up` }];
    if (line.quantity === null || !Number.isFinite(line.quantity) || line.quantity <= 0) return [{ id: line.id, message: `Enter how much ${line.name} to order` }];
    return [];
  });
}

/** The lines as the server stores them: each quantity in the material's own unit. */
export function toRequisitionItems(lines: readonly OrderLine[]): { materialId: string; quantity: number; uomId: string }[] {
  return lines.flatMap((line) => line.unitId && line.quantity !== null
    ? [{ materialId: line.id, quantity: convertUnit(line.quantity, line.enteredUnit, line.unit) ?? line.quantity, uomId: line.unitId }] : []);
}
