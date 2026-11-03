import { z } from "zod";

export const correctionFormSchema = (quantity: number, available: number, unit: string) => z.object({
  status: z.object({ value: z.enum(["0", "1"]), label: z.string() }).nullable().refine((value): boolean => value !== null, "Choose whether the item is damaged or missing."),
  quantity: z.string().refine((value) => value.trim() !== "" && Number.isInteger(Number(value)) && Number(value) > 0, "Enter a whole number greater than zero.")
    .refine((value) => Number(value) <= quantity + available, "At most " + String(quantity + available) + " " + unit + ": only " + String(available) + " more are in stock."),
  remarks: z.string(),
});
export type CorrectionFormValues = z.infer<ReturnType<typeof correctionFormSchema>>;
