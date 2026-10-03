import { availableToMove, inSourceUnit, moveUnit } from "@/modules/location-chart/lib/move-stock";
import type { MoveStockFormValues } from "@/modules/location-chart/schemas/rack-schema";
import { formatQuantityNumber } from "@/shared/units/quantity";
import type { DistributedStock } from "../schemas/distributed-schema";

export interface ShelvingProblem { index: number | null; message: string }

/**
 * What stops stock from being shelved. All of it has to be placed in one go: the server closes the delivery
 * once anything is shelved, so a part left over would have nowhere to be shelved from.
 */
export function shelvingProblems(stock: Pick<DistributedStock, "quantity" | "unit">, lines: MoveStockFormValues["moves"]): ShelvingProblem[] {
  const problems: ShelvingProblem[] = [];
  const seen = new Set<string>();
  lines.forEach((line, index) => {
    const shelf = line.shelf?.value;
    if (!shelf) return;
    if (seen.has(shelf)) problems.push({ index, message: "This shelf is chosen twice; put the whole quantity on one line" });
    seen.add(shelf);
  });
  const unit = moveUnit(stock);
  const all = availableToMove(stock);
  const placed = Number(lines.reduce((sum, line) => sum + (Number.isFinite(line.quantity) ? line.quantity : 0), 0).toPrecision(12));
  const show = (value: number) => `${formatQuantityNumber(Number(value.toPrecision(12)), "calculated")} ${unit}`;
  if (placed > all) problems.push({ index: null, message: `The quantities add up to ${show(placed)}, more than the ${show(all)} received` });
  else if (placed < all) problems.push({ index: null, message: `${show(all - placed)} of the ${show(all)} received is not placed yet. Put all of it on shelves.` });
  return problems;
}

/** The request, with each quantity in the unit the delivery is recorded in. */
export function shelvingRequest(stock: DistributedStock, lines: MoveStockFormValues["moves"]) {
  return { distributeMaterialId: stock.id, materialBatchId: stock.batchId ?? "", shelfMaterialBatches: lines.flatMap((line) => line.shelf ? [{
    warehouseLocationShelfId: line.shelf.value, quantity: inSourceUnit(line.quantity, stock), uomId: stock.unitId, note: line.note ?? "" }] : []) };
}
