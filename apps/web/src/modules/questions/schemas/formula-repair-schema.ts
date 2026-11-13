import { z } from "zod";

/** The reason is entered after the preview, so it is checked only when applying (see `repairReasonSchema`). */
export const formulaRepairValuesSchema = z.object({
  expression: z.string().trim().min(1, "Enter the corrected expression.").max(4000),
  labels: z.record(z.string(), z.string().trim().max(200)),
  updateQuestion: z.boolean(), selectedTests: z.array(z.string()),
  reason: z.string().max(1000, "Keep the reason to 1000 characters."),
});
export type FormulaRepairValues = z.infer<typeof formulaRepairValuesSchema>;
export const repairReasonSchema = z.string().trim().min(10, "Explain the repair in at least 10 characters.").max(1000);
export const repairTestKey = (test: { atrId: string; formFieldId: string }) => `${test.atrId}/${test.formFieldId}`;

export const repairContextSchema = z.object({ questionId: z.string().uuid(), label: z.string(), definition: z.string(), definitionHash: z.string().length(64),
  canRepairQuestion: z.boolean(), canRepairTests: z.boolean(), formsUsingQuestion: z.number(), responsesAffected: z.number(), blockers: z.array(z.string()),
  tests: z.array(z.object({ atrId: z.string().uuid(), responseId: z.string().uuid().nullable(), formFieldId: z.string().uuid(), label: z.string(), eligible: z.boolean(), blocker: z.string().nullable() })) });
export type RepairContext = z.infer<typeof repairContextSchema>;

const previewTestSchema = z.object({ atrId: z.string().uuid(), formFieldId: z.string().uuid(), label: z.string(),
  hasReadings: z.boolean(), configurationChanges: z.boolean(), missingInputs: z.boolean() });
export const repairPreviewSchema = z.object({ previewToken: z.string().length(64), before: z.string(), after: z.string(), captures: z.number(), selectedTests: z.number(),
  missingInputs: z.array(z.string()), blockers: z.array(z.string()), tests: z.array(previewTestSchema).default([]) });
export type RepairPreview = z.infer<typeof repairPreviewSchema>;

export const repairReceiptSchema = z.object({ repairId: z.string().uuid(), alreadyApplied: z.boolean(), responseIds: z.array(z.string()).nullish() });
export type RepairReceipt = z.infer<typeof repairReceiptSchema>;

export const repairHistorySchema = z.array(z.object({ id: z.string().uuid(), actorName: z.string().nullish(), appliedAt: z.string(), reason: z.string(),
  updatedQuestion: z.boolean().default(false), repairedTests: z.number().default(0), capturedTests: z.number().default(0) }));

/** Outcome of the last preview/apply attempt, so the page can offer the right recovery. */
export type RepairProblem =
  | { kind: "denied"; message: string }
  | { kind: "stale"; message: string }
  | { kind: "invalid"; message: string }
  | { kind: "unconfirmed"; message: string };
