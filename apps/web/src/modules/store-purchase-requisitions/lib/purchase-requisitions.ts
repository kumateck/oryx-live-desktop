import { z } from "zod";
import { Store } from "@/shared/inventory/stores";

export const purchaseRequisitionRoot = "/extrals/purchase-requisitions";
export const purchaseRequisitionAudit = { module: "General Stores", subModule: "Purchase Requisition" } as const;
export const purchaseRequisitionCodeModel = "InventoryPurchaseRequisition";
export const RequisitionStatus = { Pending: 0, Complete: 1 } as const;
export const requisitionStatusLabel = (s: number) => s === RequisitionStatus.Complete ? "Sourced" : s === RequisitionStatus.Pending ? "Pending" : `Unknown (${String(s)})`;
// The server's RequestStatus for a line.
export const lineStatusLabels: Record<number, string> = { 0: "New", 1: "Pending", 2: "Sourced", 3: "Completed", 4: "Rejected" };
export const lineStatusLabel = (s: number | null) => s === null ? "Not recorded" : lineStatusLabels[s] ?? `Unknown (${String(s)})`;
export const lineSourced = (s: number | null) => s === 2 || s === 3;

const text = z.string().nullish().transform((v) => v?.trim() || null);
const n = z.number().nullish().transform((v) => v ?? 0);
const lineSchema = z.object({
  id: z.string(), quantity: z.number(), status: z.number().nullish().transform((v) => v ?? null),
  uoM: z.object({ id: z.string().nullish(), name: text, symbol: text }).nullish(),
  item: z.object({ id: z.string(), name: text, code: text, store: z.enum(Store).nullish(), classification: z.number().catch(0), availableQuantity: n, minimumLevel: n, maximumLevel: n, reorderLevel: n,
    unitOfMeasure: z.object({ id: z.string().nullish(), name: text, symbol: text }).nullish() }).nullish(),
}).transform((l) => ({
  id: l.id, quantity: l.quantity, status: l.status, itemId: l.item?.id ?? "", name: l.item?.name ?? "Unnamed item", code: l.item?.code ?? "–", store: l.item?.store ?? null,
  classification: l.item?.classification ?? 0, available: l.item?.availableQuantity ?? 0, minimum: l.item?.minimumLevel ?? 0, maximum: l.item?.maximumLevel ?? 0, reorder: l.item?.reorderLevel ?? 0,
  unitId: l.uoM?.id ?? l.item?.unitOfMeasure?.id ?? "", unit: l.uoM?.symbol || l.uoM?.name || l.item?.unitOfMeasure?.symbol || l.item?.unitOfMeasure?.name || "",
  unitName: l.uoM?.name ?? l.item?.unitOfMeasure?.name ?? "",
}));
export type PurchaseLine = z.infer<typeof lineSchema>;
export const purchaseRequisitionSchema = z.object({
  id: z.string(), code: text, createdAt: text, expectedDeliveryDate: text, remarks: text, status: z.number().catch(-1),
  createdBy: z.object({ firstName: text, lastName: text, email: text }).nullish(),
  items: z.array(lineSchema).nullish().transform((v) => v ?? []),
}).transform((r) => ({
  id: r.id, code: r.code ?? "Uncoded", createdAt: r.createdAt, expectedDelivery: r.expectedDeliveryDate, remarks: r.remarks, status: r.status,
  raisedBy: r.createdBy ? [r.createdBy.firstName, r.createdBy.lastName].filter(Boolean).join(" ") || r.createdBy.email || null : null,
  lines: r.items, store: r.items[0]?.store ?? null,
}));
export type PurchaseRequisition = z.infer<typeof purchaseRequisitionSchema>;
export const purchaseRequisitionPageSchema = z.object({ data: z.array(purchaseRequisitionSchema).nullish().transform((d) => d ?? []), pageIndex: z.number().optional(), pageCount: z.number().optional(), totalRecordCount: z.number().optional() });
/** Only a pending requisition none of whose items has been sourced can change. */
export const purchaseEditable = (r: PurchaseRequisition) => r.status === RequisitionStatus.Pending && r.lines.every((l) => !lineSourced(l.status));
export const samePurchaseRequisition = (a: PurchaseRequisition, b: PurchaseRequisition) => a.status === b.status && a.lines.length === b.lines.length
  && a.lines.every((line) => b.lines.some((o) => o.id === line.id && o.quantity === line.quantity && o.status === line.status && o.itemId === line.itemId));
