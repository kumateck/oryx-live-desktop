import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const person = z.object({ firstName: text, lastName: text, name: text }).nullish().transform((value) => [value?.firstName, value?.lastName].filter(Boolean).join(" ") || value?.name || null);

const entity = z.object({ id: z.string().nullish(), supplierId: z.string().nullish(), code: text, modelType: text, createdAt: z.string().nullish(), department: z.object({ name: text }).nullish(), requestedBy: person,
  approvalLogs: z.array(z.object({ user: z.object({ name: text }).nullish(), approvedAt: z.string().nullish(), status: z.number().nullish(), comments: text })).nullish() });

function read(entry: z.infer<typeof entity>) {
  if (!entry.id || !entry.modelType) return null;
  return { id: entry.id, type: entry.modelType, supplierId: entry.supplierId ?? null, code: entry.code, createdAt: entry.createdAt ?? null, department: entry.department?.name ?? null, requestedBy: entry.requestedBy,
    logs: (entry.approvalLogs ?? []).map((log, index) => ({ key: `log-${index}`, by: log.user?.name ?? null, at: log.approvedAt ?? null, status: log.status ?? 0, comments: log.comments })) };
}
/** A document waiting for the signed-in user's decision, with what earlier approvers said. */
export const approvalSchema = entity.transform(read);
export const approvalRowsSchema = z.array(entity).nullish().transform((value) => (value ?? []).flatMap((entry) => { const row = read(entry); return row ? [row] : []; }));
export type PendingApproval = z.infer<typeof approvalRowsSchema>[number];
export type ApprovalLog = PendingApproval["logs"][number];

export const countsSchema = z.record(z.string(), z.number()).nullish().transform((value) => value ?? {});
