import { z } from "zod";
import { readDelay, validDelay } from "../lib/duration";

export const referenceSchema = z.object({ id: z.string().min(1), name: z.string().nullish() });
export const optionSchema = z.object({ value: z.string().min(1), label: z.string() });
export const delaySchema = z.object({
  days: z.number().int().min(0).max(10675199), hours: z.number().int().min(0).max(23),
  minutes: z.number().int().min(0).max(59), seconds: z.string(),
}).refine(validDelay, { message: "Enter valid days, hours, minutes, and seconds" });
export const timeSpanSchema = z.string().refine((value) => readDelay(value) !== null, "The server returned an invalid delay");

export function settingsPageSchema<T extends z.ZodType>(row: T) {
  return z.object({ data: z.array(row), totalRecordCount: z.number().int().nonnegative() });
}
