import { z } from "zod";

export const templateRepairAudit = { module: "Quality Control", subModule: "Testing" } as const;
export const templateRepairPermissions = { view: "CanViewTemplateRepair", apply: "CanApplyTemplateRepair" } as const;
export const templateRepairPath = (id: string) => `/settings/templates/${encodeURIComponent(id)}/repair`;
const id = z.string().uuid();
export const repairAssignmentSchema = z.object({ formAssigneeId: id, formFieldId: id, assigneeId: id });
export const templateRepairInputSchema = z.object({ assignments: z.array(repairAssignmentSchema).min(1, "Choose at least one missing field.").max(500, "Repair at most 500 fields at a time."), reason: z.string() });
export const templateRepairContextSchema = z.object({
  formId: id, formName: z.string(), canApply: z.boolean(), hiddenTests: z.number().int().nonnegative(),
  fields: z.array(z.object({ formFieldId: id, sectionId: id, section: z.string(), label: z.string(), required: z.boolean() })),
  tests: z.array(z.object({ formAssigneeId: id, kind: z.union([z.literal(0), z.literal(1), z.literal(2)]), retest: z.boolean(), recordId: id,
    label: z.string(), responseId: id.nullable(), answeredFields: z.number().int().nonnegative(), eligible: z.boolean(), blocker: z.string().nullable(),
    analysts: z.array(z.object({ userId: id, name: z.string(), fields: z.number().int() })),
    missing: z.array(z.object({ formFieldId: id, suggestedAssigneeId: id.nullable() })),
  })),
});
export const templateRepairPreviewSchema = z.object({ previewToken: z.string().regex(/^[a-f0-9]{64}$/), fieldsAdded: z.number().int(), blockers: z.array(z.string()),
  tests: z.array(z.object({ formAssigneeId: id, label: z.string(), answersKept: z.number().int(), added: z.array(z.object({ formFieldId: id,
    section: z.string(), label: z.string(), assigneeId: id, assigneeName: z.string() })) })),
});
export const templateRepairReceiptSchema = z.object({ repairId: id, alreadyApplied: z.boolean(), formAssigneeIds: z.array(id), fieldsAdded: z.number().int() });
export const templateRepairHistorySchema = z.array(z.object({ id, actorId: id, actorName: z.string(), appliedAt: z.string(), reason: z.string(), tests: z.number().int(), fields: z.number().int() }));
export type TemplateRepairContext = z.infer<typeof templateRepairContextSchema>;
export type TemplateRepairInput = z.infer<typeof templateRepairInputSchema>;
export type TemplateRepairPreview = z.infer<typeof templateRepairPreviewSchema>;
export type TemplateRepairReceipt = z.infer<typeof templateRepairReceiptSchema>;
