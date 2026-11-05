import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() ?? "");
const count = z.number().int().nonnegative();
const warnings = z.array(z.string()).nullish().transform((value) => value ?? []);
const batchSize = z.union([z.literal(0), z.literal(1)]);
const list = <T extends z.ZodType>(item: T) => z.array(item).nullish().transform((value) => value ?? []);

export const forecastMaterialSchema = z.object({
  materialId: z.string().min(1), materialCode: text, materialName: text, unit: text,
  perBatchQuantity: z.number(), perBatchQuantityVaries: z.boolean(), batchCount: count, totalQuantity: z.number(),
  reservedQuantity: z.number(), canSatisfyQuantity: z.number(), shortfallQuantity: z.number(), batchesSatisfiable: count,
  freeInWarehouse: z.number(), sharedWithProducts: count,
});
export type ForecastMaterial = z.infer<typeof forecastMaterialSchema>;

export const forecastBatchSchema = z.object({
  id: z.string().min(1), scheduleId: z.string().min(1), productKey: text, productCode: text, productName: text,
  batchNumber: text, batchSize, packingStyle: text, started: z.boolean(), rawReserved: z.boolean(), packagingReserved: z.boolean(),
  rawReady: z.boolean(), packagingReady: z.boolean(), warnings,
});
export type ForecastBatch = z.infer<typeof forecastBatchSchema>;

export const forecastScheduleSchema = z.object({
  id: z.string().min(1), code: text, scheduledStartTime: z.string(), scheduledEndTime: z.string(), batches: list(forecastBatchSchema),
});
export type ForecastSchedule = z.infer<typeof forecastScheduleSchema>;

export const forecastProductSchema = z.object({
  key: z.string().min(1), productId: z.string().min(1), productCode: text, productName: text, batchSize, packingStyle: text,
  batchCount: count, rawBatchesSatisfiable: count, packagingBatchesSatisfiable: count, batchesSatisfiable: count,
  rawMaterials: list(forecastMaterialSchema), packagingMaterials: list(forecastMaterialSchema), warnings,
});
export type ForecastProduct = z.infer<typeof forecastProductSchema>;

export const forecastSchema = z.object({
  year: z.number().int(), month: z.number().int().min(1).max(12), departmentName: text, generatedAt: z.string(),
  totalBatches: count, rawReadyBatches: count, packagingReadyBatches: count,
  schedules: list(forecastScheduleSchema), products: list(forecastProductSchema), warnings,
});
export type Forecast = z.infer<typeof forecastSchema>;
