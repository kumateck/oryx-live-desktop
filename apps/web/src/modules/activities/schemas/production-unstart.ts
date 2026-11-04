import { z } from "zod";

export const unstartPermission = "CanUnstartProduction";
export const unstartPreviewSchema = z.object({
  activityId: z.string().min(1), batchId: z.string().min(1), scheduleId: z.string().min(1), productName: z.string(), batchNumber: z.string(),
  previewToken: z.string().regex(/^[a-f0-9]{64}$/), canApply: z.boolean(), alreadyUnstarted: z.boolean(), blockers: z.array(z.string()),
  stepsToArchive: z.number().int().nonnegative(), draftDocumentsToArchive: z.number().int().nonnegative(),
  scheduleStatusBefore: z.number().int(), scheduleStatusAfter: z.number().int(),
  reservations: z.array(z.object({ id: z.string().min(1), materialCode: z.string(), materialName: z.string(), lotNumber: z.string(),
    unit: z.string().min(1), quantity: z.number().finite().positive() })),
});
export const unstartReasonSchema = z.object({ reason: z.string().trim().min(3, "Record why this production start needs reversing").max(1000) });
export type UnstartReason = z.infer<typeof unstartReasonSchema>;
export type UnstartPreview = z.infer<typeof unstartPreviewSchema>;
