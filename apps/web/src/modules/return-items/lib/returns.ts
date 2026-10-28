import { z } from "zod";
import { Store } from "@/shared/inventory/stores";

export const returnItemsRoot = "/extrals/return-items";
export const returnAudit = { module: "General Stores", subModule: "Return Items" } as const;

const text = z.string().nullish().transform((v) => v?.trim() || null);
export const returnSchema = z.object({
  id: z.string(), createdAt: text, quantity: z.number(), reason: text, store: z.enum(Store).nullish(),
  itemStockRequisitionId: text, itemStockRequisitionItemId: text, requisitionNumber: text,
  createdBy: z.object({ firstName: text, lastName: text, email: text }).nullish(),
  item: z.object({ id: z.string().nullish(), name: text, code: text, unitOfMeasure: z.object({ name: text, symbol: text }).nullish() }).nullish(),
}).transform((r) => ({
  id: r.id, createdAt: r.createdAt, quantity: r.quantity, reason: r.reason, store: r.store ?? null,
  requisitionId: r.itemStockRequisitionId, lineId: r.itemStockRequisitionItemId, requisitionNumber: r.requisitionNumber,
  returnedBy: r.createdBy ? [r.createdBy.firstName, r.createdBy.lastName].filter(Boolean).join(" ") || r.createdBy.email || null : null,
  itemName: r.item?.name ?? "Unnamed item", itemCode: r.item?.code ?? "–", unit: r.item?.unitOfMeasure?.symbol || r.item?.unitOfMeasure?.name || "",
}));
export type ItemReturn = z.infer<typeof returnSchema>;
export const returnListSchema = z.array(returnSchema);

/** Quantity already returned against each requisition line. */
export const returnedByLine = (returns: readonly ItemReturn[]) => {
  const totals = new Map<string, number>();
  for (const r of returns) if (r.lineId) totals.set(r.lineId, (totals.get(r.lineId) ?? 0) + r.quantity);
  return totals;
};
