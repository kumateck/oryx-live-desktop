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

/** The substitutes listed for a main material. */
export function substitutesOf(main: BatchMaterial, materials: readonly BatchMaterial[]): BatchMaterial[] {
  return main.materialId ? materials.filter((item) => item.substituteFor?.id === main.materialId) : [];
}

/** The material a line will use: the chosen substitute, or the main material (the default). */
export function chosenFor(main: BatchMaterial, materials: readonly BatchMaterial[], choices: ReadonlyMap<string, string>): BatchMaterial {
  const wanted = main.materialId ? choices.get(main.materialId) : undefined;
  return substitutesOf(main, materials).find((item) => item.materialId === wanted && !item.unusableReason) ?? main;
}

/** Lines (main materials) whose chosen material is short: the batch cannot start until each is covered. */
export function shortLines(materials: readonly BatchMaterial[], choices: ReadonlyMap<string, string>): BatchMaterial[] {
  return materials.filter((item) => !item.substituteFor && !materialCovered(chosenFor(item, materials, choices)));
}

/** Short lines come first, so they are seen without scrolling; each main material is followed by its substitutes. */
export function shortFirst(materials: readonly BatchMaterial[]): BatchMaterial[] {
  const covered = (main: BatchMaterial) => materialCovered(main) || substitutesOf(main, materials).some((item) => !item.unusableReason && materialCovered(item));
  const mains = [...materials.filter((item) => !item.substituteFor)].sort((a, b) => Number(covered(a)) - Number(covered(b)));
  const ordered = mains.flatMap((main) => [main, ...substitutesOf(main, materials)]);
  const listed = new Set(ordered.map((item) => item.id));
  return [...ordered, ...materials.filter((item) => !listed.has(item.id))];
}
