import { z } from "zod";

export const reservationRepairPermissions = {
  0: "CanRepairUnstartRawMaterialReservations",
  1: "CanRepairUnstartPackagingMaterialReservations",
} as const;
export const unstartReservationPreviewSchema = z.object({
  previewToken: z.string().regex(/^[0-9a-f]{64}$/),
  reservations: z.array(z.object({
    reservationId: z.string().uuid(), unstartRepairId: z.string().uuid(),
    product: z.string(), productBatch: z.string(), materialBatch: z.string(),
    quantity: z.number().finite(), unit: z.string(), unstartedAt: z.string(), blockers: z.array(z.string()),
  })),
});
export const unstartReservationReasonSchema = z.object({ reason: z.string().trim().min(3, "Give a reason of at least 3 characters.").max(1000) });
export type ReservationRepairReason = z.infer<typeof unstartReservationReasonSchema>;
