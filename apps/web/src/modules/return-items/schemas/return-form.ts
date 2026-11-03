import { z } from "zod";

const option = z.object({ value: z.string(), label: z.string() }).nullable();
export const returnQuantitySchema = (maximum?: number) => z.string()
  .refine((value) => value.trim() !== "" && Number.isInteger(Number(value)) && Number(value) > 0, "Enter a whole number greater than zero.")
  .refine((value) => maximum === undefined || Number(value) <= maximum, `Only ${String(maximum)} issued on this requisition remain to be returned.`);
export const returnFormSchema = (maximum?: number) => z.object({
  choice: option.refine((value): boolean => value !== null, "Choose the issued requisition."),
  line: option.refine((value): boolean => value !== null, "Choose the item being returned."),
  quantity: returnQuantitySchema(maximum),
  reason: z.string(),
});
export type ReturnFormValues = z.infer<ReturnType<typeof returnFormSchema>>;
