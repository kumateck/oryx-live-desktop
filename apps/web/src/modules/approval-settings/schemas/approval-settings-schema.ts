import { z } from "zod";
import type { DomainEntitiesApprovalsCreateApprovalRequest } from "@/shared/api/generated/approvals";
import { delaySchema, optionSchema, referenceSchema, settingsPageSchema, timeSpanSchema } from "@/modules/settings-support/forms";
import { readDelay, writeDelay } from "@/modules/settings-support/forms";
import { approvalDocumentLabel, protectedApprovalDocument } from "../lib/documents";

const stageRecord = z.object({ role: referenceSchema.nullish(), user: referenceSchema.nullish(), required: z.boolean(), order: z.number().int().positive() })
  .refine((value) => Boolean(value.role) !== Boolean(value.user), "Each stage must have one role or one user");
export const approvalRecordSchema = z.object({ id: z.string().min(1), itemType: z.string().min(1), escalationDuration: timeSpanSchema, approvalStages: z.array(stageRecord) })
  .refine((value) => new Set(value.approvalStages.map((stage) => stage.order)).size === value.approvalStages.length, "Stage orders must be distinct");
export type ApprovalConfiguration = z.infer<typeof approvalRecordSchema>;
/** A repair draft may retain empty assignments and invalid orders, but never discard an ambiguous assignee. */
export const approvalRepairRecordSchema = z.object({ id: z.string().min(1), itemType: z.string().min(1), escalationDuration: timeSpanSchema,
  approvalStages: z.array(z.object({ role: referenceSchema.nullish(), user: referenceSchema.nullish(), required: z.boolean(), order: z.number().int() })
    .refine((stage) => !(stage.role && stage.user), "An ambiguous approver must be reviewed before editing")) });
export const approvalsPageSchema = settingsPageSchema(approvalRecordSchema);
/** The page as sent, each workflow still unchecked, so that one malformed workflow does not hide the others. */
export const approvalsListSchema = settingsPageSchema(z.looseObject({ itemType: z.string().nullish() }));
export function readApprovalRows(rows: readonly z.infer<typeof approvalsListSchema>["data"][number][]): { rows: ApprovalConfiguration[]; unreadable: string[]; repairable: { id: string; itemType: string }[] } {
  const read: ApprovalConfiguration[] = [];
  const unreadable: string[] = [];
  const repairable: { id: string; itemType: string }[] = [];
  for (const row of rows) {
    const parsed = approvalRecordSchema.safeParse(row);
    if (parsed.success) read.push(parsed.data);
    else {
      unreadable.push(row.itemType ? approvalDocumentLabel(row.itemType) : "Unnamed document");
      const draft = approvalRepairRecordSchema.safeParse(row);
      if (draft.success) repairable.push({ id: draft.data.id, itemType: draft.data.itemType });
    }
  }
  return { rows: read, unreadable, repairable };
}
const stageSchema = z.object({ type: z.enum(["Role", "User"]), role: optionSchema.nullable(), user: optionSchema.nullable(), required: z.boolean() })
  .superRefine((value, context) => {
    const name = value.type === "Role" ? "role" : "user";
    if (!value[name]) context.addIssue({ code: "custom", path: [name], message: `Choose a ${name}` });
  });
export const approvalFormSchema = z.object({ document: optionSchema.nullable(), delay: delaySchema, stages: z.array(stageSchema).min(1, "Add at least one approval stage") })
  .superRefine((value, context) => {
    if (!value.document) context.addIssue({ code: "custom", path: ["document"], message: "Choose an approval document" });
    if (value.document && protectedApprovalDocument(value.document.value) && (value.stages.length !== 1 || value.stages[0]?.type !== "Role" || !value.stages[0]?.role)) {
      context.addIssue({ code: "custom", path: ["stages"], message: "This regulated routing policy requires exactly one approver role." });
    }
  });
export type ApprovalValues = z.infer<typeof approvalFormSchema>;
export const newApprovalStage = (): ApprovalValues["stages"][number] => ({ type: "Role", role: null, user: null, required: true });
export function approvalDefaults(record?: ApprovalConfiguration): ApprovalValues {
  return { document: record ? { value: record.itemType, label: approvalDocumentLabel(record.itemType) } : null,
    delay: record ? readDelay(record.escalationDuration) ?? { days: 0, hours: 0, minutes: 0, seconds: "0" } : { days: 0, hours: 0, minutes: 0, seconds: "0" },
    stages: record ? [...record.approvalStages].sort((a, b) => a.order - b.order).map((stage) => ({ type: stage.role || !stage.user ? "Role" : "User",
      role: stage.role ? { value: stage.role.id, label: stage.role.name || "Unnamed role" } : null,
      user: stage.user ? { value: stage.user.id, label: stage.user.name || "Unnamed user" } : null, required: stage.required })) : [newApprovalStage()],
  };
}
export function approvalPayload(values: ApprovalValues): DomainEntitiesApprovalsCreateApprovalRequest {
  const validated = approvalFormSchema.parse(values);
  if (!validated.document) throw new Error("Choose an approval document");
  return { itemType: validated.document.value, escalationDuration: writeDelay(validated.delay), approvalStages: validated.stages.map((stage, index) => ({
    required: stage.required, order: index + 1,
    ...(stage.type === "Role" ? { roleId: stage.role?.value ?? null } : { userId: stage.user?.value ?? null }),
  })) };
}
