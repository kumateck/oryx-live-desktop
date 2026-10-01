import { z } from "zod";
import { changedScheduleDateIssues, newScheduleDateIssues } from "../lib/schedule-dates";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const option = z.object({ value: z.string().min(1), label: z.string() });

export const scheduleRowSchema = z.object({
  id: z.uuid(), code: text, scheduledStartTime: z.string().nullish(), scheduledEndTime: z.string().nullish(), remarks: z.string().nullish(),
  products: z.array(z.object({
    quantity: z.number().nullish().transform((value) => value ?? 0),
    product: z.object({ id: z.string().nullish(), name: text, baseUoM: z.object({ symbol: text }).nullish() }).nullish(),
  }).transform((item) => ({ productId: item.product?.id ?? null, name: item.product?.name ?? "Unnamed product", unit: item.product?.baseUoM?.symbol ?? null, quantity: item.quantity })))
    .nullish().transform((value) => value ?? []),
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

export const scheduleFormSchema = z.object({
  code: z.string({ message: "Enter the schedule code" }).trim().min(1, "Enter the schedule code"),
  remarks: z.string().nullish(),
  ...dates,
  products: z.array(line).min(1, "Add at least one product"),
}).superRefine((values, context) => {
  for (const issue of newScheduleDateIssues(values.scheduledStartTime, values.scheduledEndTime)) context.addIssue({ code: "custom", path: [issue.path], message: issue.message });
});
export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

export const scheduleHeaderFormSchema = z.object({ remarks: z.string().nullish(), ...dates }).superRefine((values, context) => {
  for (const issue of changedScheduleDateIssues(values.scheduledStartTime, values.scheduledEndTime)) context.addIssue({ code: "custom", path: [issue.path], message: issue.message });
});
export type ScheduleHeaderFormValues = z.infer<typeof scheduleHeaderFormSchema>;
