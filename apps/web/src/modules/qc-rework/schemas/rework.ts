import { z } from "zod";
export const reworkTaskSchema = z.object({
  id: z.string().min(1), sourceResponseId: z.string().min(1), rootResponseId: z.string().min(1), newResponseId: z.string().nullish(),
  materialBatchId: z.string().nullish(), batchManufacturingRecordId: z.string().nullish(), batchNumber: z.string().nullish(),
  reason: z.string(), status: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]), requestedAt: z.string(),
});
export const reworkDetailSchema = z.object({ task: reworkTaskSchema, history: z.array(reworkTaskSchema), productionActivityStepId: z.string().nullish(), productStage: z.number().int().nullish() });
export type ReworkDetail = z.infer<typeof reworkDetailSchema>;
export const reworkAudit = { module: "Quality Control", subModule: "QC Rework" };
export const reworkStatuses = ["Awaiting QC", "Testing", "Awaiting QA", "Completed", "Rejected"] as const;
export const reworkPath = (id: string) => `/qc/rework-tasks/${encodeURIComponent(id)}`;
