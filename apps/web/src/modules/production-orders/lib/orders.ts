import { splitPacking } from "@/modules/customers/lib/customers";

export const ordersPath = "/crm/production-order";
export const orderPath = (id: string) => `${ordersPath}/${id}`;
export const audit = { module: "Finished Goods Warehouse", subModule: "Production Orders" } as const;
export const orderPermissions = { view: "CanViewOrder", convert: "ConvertCustomerQuotation", generatePackingList: "CanGeneratePackingList" } as const;
/** The numbers are the server's. */
export type OrderStatus = 0 | 1 | 2;
export const orderStatuses: readonly OrderStatus[] = [0, 1, 2];
export const orderStatusLabels: Record<OrderStatus, string> = { 0: "Pending", 1: "Part packed", 2: "Fully packed" };
export const readOrderStatus = (value: string | null): OrderStatus => value === "1" ? 1 : value === "2" ? 2 : 0;

export type Fulfilment = "pending" | "part" | "fulfilled";
export const fulfilmentLabels: Record<Fulfilment, string> = { pending: "Pending", part: "Part fulfilled", fulfilled: "Fulfilled" };
/** How far an order line has been packed. */
export const fulfilment = (ordered: number, fulfilled: number): Fulfilment => fulfilled <= 0 ? "pending" : fulfilled >= ordered ? "fulfilled" : "part";

/** A batch on a packing list: the shippers and loose packs taken from it, and the packs they make. */
export interface BatchPick { key: string; lineKey: string; noteId: string; shippers: number; loose: number; packs: number }
export interface OrderLineLike { key: string; productName: string; remaining: number }
export interface BatchLike { noteId: string; batchNumber: string | null; free: number }

/** How many packs a newly chosen batch should start with: all it has free, up to what the line still needs. */
export function startingPacks(line: OrderLineLike, batch: BatchLike, picks: readonly BatchPick[]): number {
  const taken = picks.filter((pick) => pick.lineKey === line.key).reduce((sum, pick) => sum + pick.packs, 0);
  const fromBatch = picks.filter((pick) => pick.noteId === batch.noteId).reduce((sum, pick) => sum + pick.packs, 0);
  return Math.max(0, Math.min(line.remaining - taken, batch.free - fromBatch));
}

/**
 * What stops a packing list, checked before it is sent: every row has packs, no batch gives more than it has
 * free, and no order line is given more than it still needs.
 */
export function packingProblems(picks: readonly BatchPick[], lines: readonly OrderLineLike[], batches: ReadonlyMap<string, BatchLike>): string[] {
  if (picks.length === 0) return ["Add at least one batch to the packing list."];
  const problems: string[] = [];
  for (const pick of picks) {
    const batch = batches.get(pick.noteId)?.batchNumber ?? "–";
    if (![pick.shippers, pick.loose].every((value) => Number.isNaN(value) || (Number.isInteger(value) && value >= 0))) problems.push(`Enter whole numbers of shippers and loose packs for batch ${batch}.`);
    else if (!(pick.packs > 0)) problems.push(`Enter the shippers or loose packs taken from batch ${batch}.`);
  }
  for (const [noteId, batch] of batches) {
    const total = picks.filter((pick) => pick.noteId === noteId).reduce((sum, pick) => sum + pick.packs, 0);
    if (total > batch.free) problems.push(`Batch ${batch.batchNumber ?? "–"} has ${batch.free.toLocaleString()} packs free; ${total.toLocaleString()} are on the list.`);
  }
  for (const line of lines) {
    const total = picks.filter((pick) => pick.lineKey === line.key).reduce((sum, pick) => sum + pick.packs, 0);
    if (total > line.remaining) problems.push(`${line.productName} needs ${line.remaining.toLocaleString()} more packs; ${total.toLocaleString()} are on the list.`);
  }
  return problems;
}
export { splitPacking };
