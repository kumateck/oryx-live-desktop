import { z } from "zod";

export type ScheduleRepairKind = 0 | 1 | 2;
export const scheduleRepairTitles = ["Repair BOM", "Repair packaging", "Repair procedure"] as const;
export const scheduleRepairPermissions = ["CanRepairBom", "CanRepairPackaging", "CanRepairProcedure"] as const;
export const scheduleRepairRequirement = (kind: ScheduleRepairKind) => ({ kind: "all", departmentType: 0,
  permissions: ["CanViewProductSchedules", "CanViewPlannedProducts", scheduleRepairPermissions[kind]] } as const);

export const scheduleRepairFormSchema = z.object({
  product: z.object({ value: z.string().min(1), label: z.string() }).nullable()
    .refine((value): boolean => value !== null, "Choose a product from this schedule"),
  reason: z.string().trim().min(5, "Explain the repair in at least 5 characters").max(2000),
});
export type ScheduleRepairValues = z.infer<typeof scheduleRepairFormSchema>;
const hash = z.string().regex(/^[a-f0-9]{64}$/);
export const scheduleRepairPreviewSchema = z.object({
  scheduleId: z.string(), productId: z.string(), kind: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  previewHash: hash, canApply: z.boolean(), blockers: z.array(z.string()),
  batches: z.array(z.object({
    batchId: z.string(), activityId: z.string().nullable(), batchNumber: z.string(),
    status: z.enum(["ready", "unchanged", "skipped", "blocked"]), message: z.string(), evidenceHash: z.string(),
    materials: z.object({ approvalRequired: z.boolean(),
      lines: z.array(z.object({ materialId: z.string(), name: z.string(), unit: z.string(),
        before: z.number(), after: z.number(), reservedBefore: z.number(), reservedAfter: z.number(), shortage: z.number() })),
    }).nullable(),
    procedure: z.object({ stepsUpdated: z.number(), stepsAdded: z.number(), stepsRemoved: z.number(), stepsKept: z.array(z.string()) }).nullable(),
  })),
});
export type ScheduleRepairPreview = z.infer<typeof scheduleRepairPreviewSchema>;
export type ScheduleRepairBatch = ScheduleRepairPreview["batches"][number];
