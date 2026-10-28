import { z } from "zod";
import { currentMonth } from "@/shared/batch-dates/batch-dates";
import type { SelectOption } from "@/shared/forms/form-wizard-types";

const month = (label: string) => z.string({ message: `Choose the ${label}.` }).regex(/^\d{4}-(0[1-9]|1[0-2])$/, `Choose the ${label}.`);
const shiftYears = (value: string, years: number) => `${Number(value.slice(0, 4)) + years}${value.slice(4)}`;

/** The batch is about to be made: it is made this month or later (up to five years ahead) and expires after that, within ten years. */
export const issueBounds = (today: Date = new Date()) => { const now = currentMonth(today); return { made: { minMonth: now, maxMonth: shiftYears(now, 5) }, expires: { minMonth: now, maxMonth: shiftYears(now, 10) } }; };

export const issueSchema = z.object({
  batchNumber: z.string().trim().min(1, "Enter the batch number."),
  made: month("manufacturing month").nullable(), expires: month("expiry month").nullable(),
  quantity: z.number({ message: "Enter the batch size." }).positive("The batch size must be more than zero."),
  unit: z.custom<SelectOption>().nullable(),
}).superRefine((values, context) => {
  const bounds = issueBounds();
  if (!values.made) context.addIssue({ code: "custom", path: ["made"], message: "Choose the manufacturing month." });
  else if (values.made < bounds.made.minMonth) context.addIssue({ code: "custom", path: ["made"], message: "The batch cannot be made in a month that has passed." });
  if (!values.expires) context.addIssue({ code: "custom", path: ["expires"], message: "Choose the expiry month." });
  else if (values.made && values.expires <= values.made) context.addIssue({ code: "custom", path: ["expires"], message: "The expiry month must be after the manufacturing month." });
  if (!values.unit) context.addIssue({ code: "custom", path: ["unit"], message: "Choose the unit." });
});
export type IssueValues = z.infer<typeof issueSchema>;
