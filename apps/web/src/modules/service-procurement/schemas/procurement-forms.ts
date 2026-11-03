import { z } from "zod";

const option = z.object({ value: z.string(), label: z.string() }).nullable();
const cost = z.string().refine((value) => value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) >= 0, "Enter a cost of zero or more.");
const days = z.string().refine((value) => Number.isInteger(Number(value)) && Number(value) >= 1, "Enter the estimated number of days.");
const date = z.date().nullable().refine((value): boolean => value !== null, "Choose a date.");
export const quotationFormSchema = z.object({
  number: z.string(), submitted: date,
  currency: option.refine((value): boolean => value !== null, "Choose the currency of the quotation."),
  days, completion: date, notes: z.string(),
  store: z.object({ value: z.string(), label: z.string() }),
  charges: z.array(z.object({ name: option.refine((value): boolean => value !== null, "Choose a service charge."), cost })).min(1),
  materials: z.array(z.object({
    item: option.refine((value): boolean => value !== null, "Choose an item."),
    quantity: z.string().refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, "Enter a quantity greater than zero."), price: cost,
  })),
}).superRefine((value, context) => {
  const seen = new Set<string>();
  value.materials.forEach((material, index) => {
    if (material.item && seen.has(material.item.value)) context.addIssue({ code: "custom", path: ["materials", index, "item"], message: "Each material can be listed once." });
    if (material.item) seen.add(material.item.value);
  });
});
export type QuotationFormValues = z.infer<typeof quotationFormSchema>;
export const editQuotationFormSchema = z.object({ charge: cost, days, completion: date, notes: z.string() });
export type EditQuotationFormValues = z.infer<typeof editQuotationFormSchema>;

export const memoFormSchema = z.object({ issued: date, charge: cost, materials: cost, start: date, completion: date, terms: z.string(), instructions: z.string() })
  .refine((value) => !value.start || !value.completion || value.completion >= value.start, { path: ["completion"], message: "The expected completion cannot be before the expected start." });
export type MemoFormValues = z.infer<typeof memoFormSchema>;
export const requestProformaFormSchema = z.object({ notes: z.string() });
export const approveProformaFormSchema = z.object({ comments: z.string() });
export const respondProformaFormSchema = z.object({ invoice: z.string().trim().min(1, "Enter the provider's invoice number."), date, notes: z.string(), prices: z.array(z.object({ price: cost })) });
export type RespondProformaFormValues = z.infer<typeof respondProformaFormSchema>;
