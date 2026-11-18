import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const material = z.object({
  materialId: z.string(), materialCode: text, materialName: text, kind: z.union([z.literal(0), z.literal(1)]),
  lotNumber: text, warehouse: text, location: text, quantity: z.number().finite(), unit: text,
});
const batch = z.object({
  bmrId: z.string(), productionScheduleProductId: z.string(), productCode: text, productName: text, scheduleCode: text,
  startedAt: text, batchNumber: text, batchQuantity: z.number().finite(), batchUnit: text, materials: z.array(material).nullish().transform((value) => value ?? []),
});
/** A page of started batches awaiting their BMR, each with the lots reserved for it. */
export const upcomingPageSchema = z.object({
  data: z.array(batch).nullish().transform((value) => value ?? []), totalRecordCount: z.number().int().nullish(), pageIndex: z.number().int().nullish(), pageCount: z.number().int().nullish(),
});
export type UpcomingBatch = z.infer<typeof batch>;
export type ReservedLot = z.infer<typeof material>;
export const upcomingAudit = { module: "Warehouse", subModule: "Upcoming Batch Issues" } as const;
