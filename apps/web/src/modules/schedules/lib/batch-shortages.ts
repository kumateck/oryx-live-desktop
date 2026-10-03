import type { OrderLine } from "@/modules/requisitions/lib/order-lines";
import { convertUnit, relatedUnits } from "@/shared/units/quantity";
import type { BatchMaterial } from "../schemas/batch-schema";
import { materialCovered, materialShortfall } from "./batch-materials";

// The server's numbers for a short material that is already being bought.
const purchaseRequisition = 2;
const localProcurement = 3;
const foreignProcurement = 4;
const beingBought = new Set<number | null>([purchaseRequisition, localProcurement, foreignProcurement]);

/** Short materials nobody has yet asked to buy. One already on a requisition is left out: the server refuses to requisition it twice for the same batch. */
export function shortagesToBuy(materials: readonly BatchMaterial[]): BatchMaterial[] {
  return materials.filter((item) => !materialCovered(item) && !beingBought.has(item.source) && Boolean(item.materialId) && Boolean(item.unitId));
}

/** Requisition lines for the shortages, each starting at exactly what the batch is short by. */
export function shortageOrderLines(materials: readonly BatchMaterial[]): OrderLine[] {
  return shortagesToBuy(materials).map((item) => {
    const enteredUnit = relatedUnits(item.unit).at(-1) ?? item.unit ?? "";
    return { id: item.materialId ?? item.id, name: item.name, code: item.code || null, unit: item.unit, unitId: item.unitId, stock: item.onHand, maximum: 0,
      quantity: convertUnit(materialShortfall(item), item.unit, enteredUnit) ?? materialShortfall(item), enteredUnit };
  });
}
