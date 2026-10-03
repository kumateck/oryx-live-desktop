import { z } from "zod";
import { expiredOrDue, shortfall } from "@/modules/stock-issue/lib/stock-issue";

export const audit = { module: "Warehouse", subModule: "Extra Material Requisitions" } as const;
const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const date = z.string().nullish().transform((value) => value && new Date(value).getFullYear() >= 1900 ? value : null);

const extra = z.object({ id: z.string().nullish(), createdAt: z.string().nullish(), quantity: amount, approved: z.boolean().nullish(), uoM: z.object({ symbol: text }).nullish(), material: z.object({ name: text, code: text }).nullish(),
  createdBy: z.object({ firstName: text, lastName: text }).nullish(), productionScheduleProduct: z.object({ batchNumber: text, product: z.object({ name: text }).nullish(), productionSchedule: z.object({ code: text }).nullish() }).nullish(),
  batches: z.array(z.object({ quantityToTake: amount, batch: z.object({ id: z.string().nullish(), batchNumber: text, expiryDate: date, isReturn: z.boolean().nullish() }).nullish() })).nullish() });

/** Extra material asked for on a batch in production, with the stock the server has picked to meet it. */
export const extraRowsSchema = z.array(extra).nullish().transform((value) => (value ?? []).flatMap((entry) => entry.id ? [{ id: entry.id, createdAt: entry.createdAt ?? null, quantity: entry.quantity, approved: entry.approved === true, unit: entry.uoM?.symbol ?? null,
  materialName: entry.material?.name ?? "Unnamed material", materialCode: entry.material?.code ?? null, requestedBy: [entry.createdBy?.firstName, entry.createdBy?.lastName].filter(Boolean).join(" ") || null,
  product: entry.productionScheduleProduct?.product?.name ?? null, schedule: entry.productionScheduleProduct?.productionSchedule?.code ?? null, batch: entry.productionScheduleProduct?.batchNumber ?? null,
  batches: (entry.batches ?? []).map((item, index) => ({ key: `${item.batch?.id ?? "batch"}-${index}`, id: item.batch?.id ?? null, number: item.batch?.batchNumber ?? null, quantity: item.quantityToTake, expires: item.batch?.expiryDate ?? null, returned: item.batch?.isReturn === true })) }] : []));
export type ExtraMaterial = z.infer<typeof extraRowsSchema>[number];

/** Why extra material cannot be issued, or null when it can. */
export function extraIssueBlock(extra: ExtraMaterial, today: Date = new Date()): string | null {
  if (!extra.approved) return "This request is waiting for approval.";
  if (extra.batches.length === 0 || extra.batches.some((batch) => !batch.id)) return "No stock has been picked for this request.";
  if (extra.batches.some((batch) => expiredOrDue(batch.expires, today))) return "A batch picked for this request has expired or expires today.";
  if (shortfall(extra) > 0) return "The stock picked does not cover what was asked for.";
  return null;
}
/** The batches to issue, as the server takes them. */
export const issueBody = (extra: ExtraMaterial) => extra.batches.flatMap((batch) => batch.id ? [{ batchId: batch.id, quantity: batch.quantity }] : []);
