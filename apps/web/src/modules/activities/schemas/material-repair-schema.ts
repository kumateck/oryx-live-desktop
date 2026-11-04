import { z } from "zod";

export const materialRepairPreviewSchema = z.object({
  activityId: z.string(), batchId: z.string(), kind: z.union([z.literal(0), z.literal(1)]),
  previewHash: z.string().regex(/^[a-f0-9]{64}$/), sourceHash: z.string().regex(/^[a-f0-9]{64}$/),
  baseline: z.string(), hasChanges: z.boolean(), approvalRequired: z.boolean(),
  requisitionId: z.string().nullable(), blockers: z.array(z.string()),
  lines: z.array(z.object({ materialId: z.string(), name: z.string(), unit: z.string(),
    before: z.number(), after: z.number(), reservedBefore: z.number(), reservedAfter: z.number(), shortage: z.number() })),
});

export const materialRepairReasonSchema = z.object({ reason: z.string().trim().min(5, "Explain the correction in at least 5 characters.").max(2000) });
export type MaterialRepairPreview = z.infer<typeof materialRepairPreviewSchema>;
export type MaterialRepairReason = z.infer<typeof materialRepairReasonSchema>;
