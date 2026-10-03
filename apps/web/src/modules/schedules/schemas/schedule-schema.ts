import { z } from "zod";
import { changedScheduleDateIssues, newScheduleDateIssues } from "../lib/schedule-dates";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const option = z.object({ value: z.string().min(1), label: z.string() });

const named = z.object({ id: z.string().nullish(), name: text }).nullish();

/** One batch on a schedule. The backend calls it a schedule product; a product scheduled for three batches has three. */
const batchSchema = z.object({
  id: z.string().nullish(), batchNumber: text,
  quantity: z.number().nullish().transform((value) => value ?? 0),
  batchSize: z.number().nullish(),
  cancelled: z.boolean().nullish(), reasonForCancellation: text, hasStarted: z.boolean().nullish(), productionActivityId: z.string().nullish(),
  productPacking: named, marketType: named,
  product: z.object({ id: z.string().nullish(), name: text, code: text, baseUoM: z.object({ symbol: text }).nullish() }).nullish(),
}).transform((item) => ({
  id: item.id ?? null, batchNumber: item.batchNumber, quantity: item.quantity, half: item.batchSize === 1,
  cancelled: item.cancelled ?? false, cancellationReason: item.reasonForCancellation,
  started: Boolean(item.hasStarted || item.productionActivityId), activityId: item.productionActivityId ?? null,
  productId: item.product?.id ?? null, name: item.product?.name ?? "Unnamed product", code: item.product?.code ?? null, unit: item.product?.baseUoM?.symbol ?? null,
  packing: item.productPacking?.id ? { id: item.productPacking.id, name: item.productPacking.name ?? "Unnamed style" } : null,
  market: item.marketType?.id ? { id: item.marketType.id, name: item.marketType.name ?? "Unnamed" } : null,
}));
export type ScheduleBatch = z.infer<typeof batchSchema>;

export const scheduleRowSchema = z.object({
  id: z.uuid(), code: text, scheduledStartTime: z.string().nullish(), scheduledEndTime: z.string().nullish(), remarks: z.string().nullish(),
  products: z.array(batchSchema).nullish().transform((value) => value ?? []),
});
export const scheduleListSchema = z.array(scheduleRowSchema);
export type ScheduleRow = z.infer<typeof scheduleRowSchema>;

const dates = {
  scheduledStartTime: z.date({ message: "Choose the start date" }),
  scheduledEndTime: z.date({ message: "Choose the end date" }),
};

const line = z.object({
  // Empty until chosen; checked on the field so its message shows with the form's other messages.
  product: option.nullable().refine((value): boolean => Boolean(value), "Choose a product"),
  packing: option.nullable().refine((value): boolean => Boolean(value), "Choose a packing style"),
  sizeType: option,
  market: option.nullish(),
  count: z.number({ message: "Enter the number of batches" }).int("Enter a whole number of batches").min(1, "Schedule at least one batch"),
});
export type ScheduleLineValues = z.infer<typeof line>;

/** The products of a schedule being created, or being added to an existing one. */
export const scheduleLinesFormSchema = z.object({ products: z.array(line).min(1, "Add at least one product") });
export type ScheduleLinesFormValues = z.infer<typeof scheduleLinesFormSchema>;

export const newScheduleFormSchema = z.object({
  code: z.string({ message: "Enter the schedule code" }).trim().min(1, "Enter the schedule code"),
  remarks: z.string().nullish(),
  ...dates,
}).superRefine((values, context) => {
  for (const issue of newScheduleDateIssues(values.scheduledStartTime, values.scheduledEndTime)) context.addIssue({ code: "custom", path: [issue.path], message: issue.message });
});
export type NewScheduleFormValues = z.infer<typeof newScheduleFormSchema>;

export const scheduleHeaderFormSchema = z.object({ remarks: z.string().nullish(), ...dates }).superRefine((values, context) => {
  for (const issue of changedScheduleDateIssues(values.scheduledStartTime, values.scheduledEndTime)) context.addIssue({ code: "custom", path: [issue.path], message: issue.message });
});
export type ScheduleHeaderFormValues = z.infer<typeof scheduleHeaderFormSchema>;
