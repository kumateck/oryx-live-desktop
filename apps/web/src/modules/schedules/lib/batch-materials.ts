import type { BatchMaterial } from "../schemas/batch-schema";

/** Warehouse stock not set aside for any batch. */
export function freeStock(item: BatchMaterial): number {
  return Math.max(item.onHand - item.reservedByAll, 0);
}

/** A batch is covered for a material by what is already reserved for it plus what is still free. */
export function materialCovered(item: BatchMaterial): boolean {
  return item.reserved + freeStock(item) >= item.needed;
}
export function materialShortfall(item: BatchMaterial): number {
  return Math.max(item.needed - item.reserved - freeStock(item), 0);
}

// How a material that is not in the warehouse is being obtained. The position is the backend's number.
const sources = ["No source", "Stock transfer", "Purchase requisition", "Local procurement", "Foreign procurement", "Stock requisition", "Issued requisition", "In house"] as const;
const inHouse = 7;
/** Where the material comes from: the warehouse when it covers the batch, otherwise what the server reports. */
export function materialSource(item: BatchMaterial): { label: string; covered: boolean } {
  if (materialCovered(item)) return { label: sources[inHouse], covered: true };
  return { label: sources[item.source ?? 0] ?? "Unknown source", covered: false };
}

/** Materials that are short come first, so they are seen without scrolling. */
export function shortFirst(materials: readonly BatchMaterial[]): BatchMaterial[] {
  return [...materials].sort((a, b) => Number(materialCovered(a)) - Number(materialCovered(b)));
}
