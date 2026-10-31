import { z } from "zod";

const option = z.object({ value: z.string().min(1), label: z.string() });
const chosen = (message: string) => option.nullable().refine((value): boolean => Boolean(value), message);

export const agreementFormSchema = z.object({ customer: chosen("Choose the customer"), product: chosen("Choose the product"), packing: chosen("Choose the packing style"),
  currency: chosen("Choose the currency the product is priced in"),
  price: z.number({ message: "Enter the agreed price" }).refine((value) => value > 0, "The agreed price must be above zero"),
  from: z.date({ message: "Choose when the price starts" }).nullable().refine((value): boolean => Boolean(value), "Choose when the price starts"), to: z.date().nullable(),
  notes: z.string().trim().max(1000, "Keep the notes under 1000 characters") })
  .refine((value) => !value.from || !value.to || value.to >= value.from, { path: ["to"], message: "The end date cannot be before the start date" });
export type AgreementFormValues = z.infer<typeof agreementFormSchema>;

export const listPriceFormSchema = z.object({ currency: chosen("Choose the currency the product is priced in"),
  price: z.number({ message: "Enter the list price" }).refine((value) => value > 0, "The list price must be above zero"),
  unit: z.string().trim().max(100, "Keep the unit under 100 characters") });
export type ListPriceFormValues = z.infer<typeof listPriceFormSchema>;
