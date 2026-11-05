import { z } from "zod";

export const reservationRepairPermission = "CanRepairStockReservations";
const candidate = z.object({
  batchId: z.string().min(1), batchNumber: z.string(), shelfId: z.string().min(1), shelf: z.string(),
  availableQuantity: z.number().finite(),
});
const row = z.object({
  reservationId: z.string().min(1), requisitionCode: z.string(), materialCode: z.string(), materialName: z.string(),
  unit: z.string().min(1), quantity: z.number().finite().positive(), oldBatchId: z.string().min(1),
  oldBatchNumber: z.string(), oldShelf: z.string(), candidates: z.array(candidate),
});
export const reservationRepairPreviewSchema = z.object({
  batchId: z.string().min(1), batchNumber: z.string(), migrationId: z.string().min(1), migrationFile: z.string(),
  previewToken: z.string().regex(/^[a-f0-9]{64}$/), hasChanges: z.boolean(), canApply: z.boolean(),
  blockers: z.array(z.string()), rows: z.array(row),
  history: z.array(z.object({ id: z.string().min(1), actorId: z.string().min(1), actorName: z.string(),
    appliedAt: z.string(), reason: z.string(), rows: z.array(row) })),
}).refine((preview) => !preview.canApply || (preview.hasChanges && preview.rows.length > 0
  && preview.blockers.length === 0 && preview.rows.every((item) => item.candidates.length === 1)),
{ message: "The repair preview contains inconsistent evidence" });
export const reservationRepairReceiptSchema = z.object({ repairId: z.string().min(1), alreadyApplied: z.boolean() });
export const reservationRepairReasonSchema = z.object({
  reason: z.string().trim().min(10, "Explain why these reservations need repairing (at least 10 characters)").max(1000),
});
export type ReservationRepairReason = z.infer<typeof reservationRepairReasonSchema>;
export type ReservationRepairRow = z.infer<typeof row>;
export type ReservationRepairPreview = z.infer<typeof reservationRepairPreviewSchema>;
