import { z } from "zod";
export const option = z.object({ value: z.string().min(1, "Choose an option"), label: z.string() });
export const paymentFormSchema = z.object({
  payableType: z.object({ value: z.enum(["0", "1", "2", "3"]), label: z.string() }),
  payable: option.nullable().refine((value): boolean => value !== null, "Choose the document"),
  amount: z.number({ message: "Enter an amount" }).finite().positive("Enter an amount greater than zero"),
  currency: option.nullable().refine((value): boolean => value !== null, "Choose the currency"),
  paymentDate: z.date({ message: "Choose the payment date" }),
  method: z.object({ value: z.enum(["0", "1", "2", "3", "4"]), label: z.string() }),
  reference: z.string().trim().min(1, "Enter the payment reference").max(255), notes: z.string().trim().max(2000),
});
export type PaymentFormValues = z.infer<typeof paymentFormSchema>;
export const reviewSchema = z.object({ comments: z.string().trim().max(1000) });
export type ReviewValues = z.infer<typeof reviewSchema>;
export const baseSchema = z.object({ currency: option.nullable().refine((value): boolean => value !== null, "Choose the base currency") });
export const rateSchema = z.object({ currency: option.nullable().refine((value): boolean => value !== null, "Choose a currency"), rate: z.number().finite().positive("Enter a positive rate"), effectiveDate: z.date() });
