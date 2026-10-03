import { z } from "zod";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";

export const swapsPath = "/warehouse/swap-requests";
export const swapPath = (id: string, direction: Direction) => `${swapsPath}/${id}/details?direction=${direction}`;
export const audit = { module: "Warehouse", subModule: "Swap Requests" } as const;
/** Deciding a swap is part of issuing that kind of material. */
export const decidePermissions: Record<MaterialKind, string> = { 0: "CanIssueRawMaterialRequisitions", 1: "CanIssuePackagingMaterialRequisitions" };
/** Asked of this department (0) or asked by it (1). The numbers are the server's. */
export type Direction = 0 | 1;
export const readDirection = (value: string | null): Direction => value === "1" ? 1 : 0;
export const swapStatusLabels: Record<number, string> = { 0: "Waiting for a decision", 1: "Approved", 2: "Rejected" };

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const date = z.string().nullish().transform((value) => value && new Date(value).getFullYear() >= 1900 ? value : null);
const batches = z.array(z.object({ quantity: amount, uoM: z.object({ symbol: text }).nullish(), materialBatch: z.object({ id: z.string().nullish(), batchNumber: text, expiryDate: date, isReturn: z.boolean().nullish(),
  material: z.object({ name: text, code: text, kind: z.number().nullish() }).nullish() }).nullish() })).nullish();
// The status arrives as a number, or as its name on older records.
const status = z.union([z.number(), z.string()]).nullish().transform((value) => { if (typeof value === "number") return value; const name = String(value ?? "").trim().toLowerCase(); return name === "pending" ? 0 : name === "approved" ? 1 : name === "rejected" ? 2 : Number.isNaN(Number(name)) || name === "" ? -1 : Number(name); });
const swap = z.object({ id: z.string().nullish(), status, actionedAt: date, actionedBy: z.object({ firstName: text, lastName: text }).nullish(), firstWarehouse: z.object({ name: text }).nullish(), secondWarehouse: z.object({ name: text }).nullish(),
  firstSwapShelfMaterialBatches: batches, secondSwapShelfMaterialBatches: batches });

function side(list: z.infer<typeof batches>) {
  return (list ?? []).map((item, index) => ({ key: `${item.materialBatch?.id ?? "batch"}-${index}`, batchId: item.materialBatch?.id ?? null, number: item.materialBatch?.batchNumber ?? null, quantity: item.quantity, expires: item.materialBatch?.expiryDate ?? null, returned: item.materialBatch?.isReturn === true,
    unit: item.uoM?.symbol ?? null }));
}
function read(entry: z.infer<typeof swap>) {
  if (!entry.id) return null;
  const material = entry.firstSwapShelfMaterialBatches?.[0]?.materialBatch?.material ?? entry.secondSwapShelfMaterialBatches?.[0]?.materialBatch?.material;
  const giving = side(entry.firstSwapShelfMaterialBatches);
  const taking = side(entry.secondSwapShelfMaterialBatches);
  return { id: entry.id, status: entry.status, decidedAt: entry.actionedAt, decidedBy: [entry.actionedBy?.firstName, entry.actionedBy?.lastName].filter(Boolean).join(" ") || null, asking: entry.firstWarehouse?.name ?? null, asked: entry.secondWarehouse?.name ?? null,
    materialName: material?.name ?? "Unnamed material", materialCode: material?.code ?? null, kind: (material?.kind === 1 ? 1 : 0) as MaterialKind, unit: giving[0]?.unit ?? taking[0]?.unit ?? null, giving, taking };
}
/**
 * A swap of batches between two stores: the asking store gives up batches it holds and takes the same quantity
 * of older batches from the other store, so the older stock is used first.
 */
export const swapSchema = swap.transform(read);
export const swapRowsSchema = z.array(swap).nullish().transform((value) => (value ?? []).flatMap((entry) => { const row = read(entry); return row ? [row] : []; }));
export type Swap = z.infer<typeof swapRowsSchema>[number];

const total = (list: readonly { quantity: number }[]) => list.reduce((sum, item) => sum + item.quantity, 0);
/** Why a swap cannot be approved, or null when it can. The two sides have to be the same quantity; the server checks it too. */
export function approveBlock(swap: Pick<Swap, "status" | "giving" | "taking">): string | null {
  if (swap.status !== 0) return "This request has already been decided.";
  if (swap.giving.length === 0 || swap.taking.length === 0) return "One side of the swap has no batches.";
  if (Math.abs(total(swap.giving) - total(swap.taking)) > 1e-6) return "The two sides are not the same quantity.";
  return null;
}
