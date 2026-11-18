import { z } from "zod";

export const leftoverRepairPermissions = {
  0: "CanRepairUnstartRawMaterialRequisitions",
  1: "CanRepairUnstartPackagingMaterialRequisitions",
} as const;

export const unstartLeftoverPreviewSchema = z.object({
  previewToken: z.string().regex(/^[0-9a-f]{64}$/),
  requisitions: z.array(z.object({
    requisitionId: z.string().uuid(),
    code: z.string(),
    batchNumber: z.string(),
    unstartRepairId: z.string().uuid(),
    unstartedAt: z.string(),
    materialCount: z.number().int().nonnegative(),
    blockers: z.array(z.string()),
  })),
});
export const unstartLeftoverReasonSchema = z.object({ reason: z.string().trim().min(3, "Give a reason of at least 3 characters.").max(1000) });
export type LeftoverReason = z.infer<typeof unstartLeftoverReasonSchema>;
export type LeftoverRow = z.infer<typeof unstartLeftoverPreviewSchema>["requisitions"][number];
