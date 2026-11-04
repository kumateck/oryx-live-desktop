import { z } from "zod";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const date = z.string().nullish().transform((value) => value && new Date(value).getFullYear() >= 1900 ? value : null);
const person = z.object({ name: text, firstName: text, lastName: text }).nullish().transform((value) => value?.name ?? ([value?.firstName, value?.lastName].filter(Boolean).join(" ") || null));

const signatory = z.object({ name: text, signature: text, signedAt: date }).nullish().transform((value) => value?.name ? { name: value.name, signature: value.signature, signedAt: value.signedAt } : null);
const checkStatuses = ["Pending", "Checked", "Rejected", "NotAssigned"] as const;
const signatories = z.object({ issuedBy: signatory, checkedBy: signatory, receivedBy: signatory, checkStatus: z.string().nullish() }).nullish()
  .transform((value) => ({ issuedBy: value?.issuedBy ?? null, checkedBy: value?.checkedBy ?? null, receivedBy: value?.receivedBy ?? null,
    checkStatus: (checkStatuses as readonly string[]).includes(value?.checkStatus ?? "") ? value?.checkStatus as (typeof checkStatuses)[number] : null }));

const line = z.object({ id: z.string().nullish(), quantity: amount, approvedQuantity: z.number().finite().nullish(), status: z.number().nullish(), material: z.object({ id: z.string().nullish(), code: text, name: text, kind: z.number().nullish() }).nullish(), uoM: z.object({ symbol: text }).nullish(),
  batches: z.array(z.object({ quantityToTake: amount, batch: z.object({ id: z.string().nullish(), batchNumber: text, expiryDate: date, effectiveExpiryDate: date, isReturn: z.boolean().nullish() }).nullish() })).nullish() });
const requisition = z.object({ id: z.string().nullish(), code: text, status: z.number().nullish(), approved: z.boolean().nullish(), comments: text, createdAt: z.string().nullish(), requestedBy: person, department: z.object({ name: text }).nullish(),
  productionScheduleProduct: z.object({ batchNumber: text, product: z.object({ name: text, code: text }).nullish(), productionSchedule: z.object({ code: text }).nullish() }).nullish(), items: z.array(line).nullish(),
  signatories });

function read(entry: z.infer<typeof requisition>) {
  if (!entry.id) return null;
  const items = (entry.items ?? []).map((item, index) => ({ id: item.id ?? `line-${index}`, materialName: item.material?.name ?? "Unnamed material", materialCode: item.material?.code ?? null, kind: (item.material?.kind === 1 ? 1 : 0) as MaterialKind,
    quantity: item.quantity, approvedQuantity: item.approvedQuantity ?? null, unit: item.uoM?.symbol ?? null, issued: item.status === 3,
    batches: (item.batches ?? []).map((batch, position) => ({ key: `${batch.batch?.id ?? "batch"}-${position}`, number: batch.batch?.batchNumber ?? null, quantity: batch.quantityToTake, expires: batch.batch?.effectiveExpiryDate ?? batch.batch?.expiryDate ?? null, returned: batch.batch?.isReturn === true })) }));
  const schedule = entry.productionScheduleProduct;
  return { id: entry.id, code: entry.code ?? "No number", status: entry.status ?? 0, approved: entry.approved === true, comments: entry.comments, createdAt: entry.createdAt ?? null, requestedBy: entry.requestedBy, department: entry.department?.name ?? null,
    signatories: entry.signatories,
    product: schedule?.product?.name ?? null, productCode: schedule?.product?.code ?? null, schedule: schedule?.productionSchedule?.code ?? null, batch: schedule?.batchNumber ?? null, items,
    // A requisition is for one kind of material; the first line says which.
    kind: items[0]?.kind ?? null };
}
/** A stock requisition as the store sees it: what production asked for and the batches set aside to meet it. */
export const stockRequisitionSchema = requisition.transform(read);
export const stockRequisitionRowsSchema = z.array(requisition).nullish().transform((value) => (value ?? []).flatMap((entry) => { const row = read(entry); return row ? [row] : []; }));
export type StockRequisition = z.infer<typeof stockRequisitionRowsSchema>[number];
export type StockLine = StockRequisition["items"][number];
export type IssueSignatories = StockRequisition["signatories"];
