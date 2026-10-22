import { z } from "zod";
import { Store, stores } from "@/shared/inventory/stores";
import { Classification } from "@/shared/inventory/contracts";

export const stockRequisitionRoot = "/extrals/stock-requisitions";
export const issueStockRoot = "/extrals/issue-stock";
export const stockRequisitionAudit = { module: "General Stores", subModule: "Stock Requisition" } as const;
export const issueStockAudit = { module: "General Stores", subModule: "Issue Stock" } as const;
export const stockRequisitionCodeModel = "ItemStockRequisition";

export const RequisitionStatus = { Pending: 0, Partial: 1, Completed: 2 } as const;
export type RequisitionStatus = (typeof RequisitionStatus)[keyof typeof RequisitionStatus];
export const statusLabels: Record<number, string> = { 0: "Pending", 1: "Partly issued", 2: "Issued" };
export const statusLabel = (status: number | null | undefined) => status === null || status === undefined ? "Not recorded" : statusLabels[status] ?? `Unknown (${String(status)})`;
export const storeLabel = (store: Store | null) => store === null ? "No items" : stores[store] ?? "Unknown store";

const text = z.string().nullish().transform((v) => v?.trim() || null);
const person = z.object({ id: z.string().nullish(), firstName: text, lastName: text, email: text }).nullish()
  .transform((p) => p?.id ? { id: p.id, name: [p.firstName, p.lastName].filter(Boolean).join(" ") || p.email || "Unnamed user" } : null);
const lineSchema = z.object({
  id: z.string(), itemId: z.string().nullish(), quantityRequested: z.number(), quantityIssued: z.number().catch(0), quantityRemaining: z.number().optional(),
  item: z.object({
    id: z.string(), code: text, name: text, store: z.enum(Store).nullish(), availableQuantity: z.number().catch(0), isActive: z.boolean().catch(true),
    classification: z.enum(Classification).catch(Classification.Recoverable),
    unitOfMeasure: z.object({ name: text, symbol: text }).nullish(),
  }).nullish(),
}).transform((line) => ({
  id: line.id, itemId: line.item?.id ?? line.itemId ?? "", name: line.item?.name ?? "Unnamed item", code: line.item?.code ?? "–",
  requested: line.quantityRequested, issued: line.quantityIssued, remaining: Math.max(0, line.quantityRemaining ?? line.quantityRequested - line.quantityIssued),
  available: line.item?.availableQuantity ?? 0, active: line.item?.isActive ?? true, classification: line.item?.classification ?? Classification.Recoverable,
  unit: line.item?.unitOfMeasure?.symbol || line.item?.unitOfMeasure?.name || null, unitName: line.item?.unitOfMeasure?.name ?? "",
}));
export type RequisitionLine = z.infer<typeof lineSchema>;

export const stockRequisitionSchema = z.object({
  id: z.string(), number: text, createdAt: text, requisitionDate: text, justification: text, status: z.number().catch(-1),
  store: z.enum(Store).nullish().transform((s) => s ?? null), issueHistoryAttributed: z.boolean().catch(true),
  requestedBy: person, department: z.object({ id: z.string().nullish(), name: text }).nullish(),
  requisitionItems: z.array(lineSchema).nullish().transform((lines) => lines ?? []),
}).transform((r) => ({
  id: r.id, number: r.number ?? "Unnumbered", createdAt: r.createdAt, justification: r.justification, status: r.status, store: r.store,
  attributed: r.issueHistoryAttributed, requestedBy: r.requestedBy, department: r.department?.id ? { id: r.department.id, name: r.department.name ?? "Unnamed department" } : null,
  lines: r.requisitionItems,
}));
export type StockRequisition = z.infer<typeof stockRequisitionSchema>;
export const stockRequisitionPageSchema = z.object({ data: z.array(stockRequisitionSchema).nullish().transform((d) => d ?? []), pageIndex: z.number().optional(), pageCount: z.number().optional(), totalRecordCount: z.number().optional() });

/** Only a pending requisition with nothing issued against it can be changed or deleted. */
export const editable = (r: StockRequisition) => r.status === RequisitionStatus.Pending && r.lines.every((l) => l.issued === 0);
/** What still needs issuing, or why nothing can be issued. */
export function issueBlocker(r: StockRequisition): string | null {
  if (!r.attributed) return "Earlier issues on this requisition were recorded without their item, so what remains is unknown. It must be reconciled before more stock is issued.";
  if (r.status === RequisitionStatus.Completed || r.lines.every((l) => l.remaining === 0)) return "Everything on this requisition has been issued.";
  return null;
}

/** True when the requisition read just before issuing is the one the quantities were entered against. */
export const sameIssueEvidence = (a: StockRequisition, b: StockRequisition) => a.status === b.status && a.lines.length === b.lines.length
  && a.lines.every((line) => { const other = b.lines.find((l) => l.id === line.id); return other !== undefined && other.issued === line.issued && other.requested === line.requested && other.itemId === line.itemId; });
