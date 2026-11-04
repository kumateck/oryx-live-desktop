import { z } from "zod";

const quantity = z.number().finite();
export const repairRowSchema = z.object({
  materialId: z.string().min(1), code: z.string(), name: z.string(), unit: z.string().min(1),
  approvedQuantity: quantity, beforeQuantity: quantity, targetQuantity: quantity, adjustment: quantity, availableQuantity: quantity,
  lots: z.array(z.object({ materialBatchId: z.string().min(1), shelfId: z.string().min(1), batchNumber: z.string(), adjustment: quantity })),
});
export const repairPreviewSchema = z.object({
  batchId: z.string().min(1), batchNumber: z.string(), kind: z.union([z.literal(0), z.literal(1)]), requisitionCode: z.string(),
  previewToken: z.string().regex(/^[a-f0-9]{64}$/), canApply: z.boolean(), hasChanges: z.boolean(), blockers: z.array(z.string()),
  rows: z.array(repairRowSchema), history: z.array(z.object({ id: z.string(), actorId: z.string(), appliedAt: z.string(), reason: z.string(), rows: z.array(repairRowSchema) })),
});
export const repairReasonSchema = z.object({ reason: z.string().trim().min(3, "Record why this issued stock needs correcting").max(1000) });
export type RepairReason = z.infer<typeof repairReasonSchema>;
export type RepairRow = z.infer<typeof repairRowSchema>;
export type RepairPreview = z.infer<typeof repairPreviewSchema>;
export type RepairKind = 0 | 1;
export const issuedRepairPermissions = ["CanRepairIssuedBom", "CanRepairIssuedPackaging"] as const;
export const issuedRepairTitles = ["Repair BOM after issue", "Repair packaging after issue"] as const;
