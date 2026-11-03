import { z } from "zod";

const price = z.string().refine((value) => value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) > 0, "Enter a unit price greater than zero.");
const quote = z.object({
  name: z.string().trim().min(1, "Enter the vendor's name."), address: z.string(), phone: z.string().trim().min(1, "Enter the vendor's phone number."),
  price, payment: z.string(), delivery: z.string(), terms: z.object({ value: z.string(), label: z.string() }).nullable().refine((value): boolean => value !== null, "Choose the terms of payment."),
});
export const marketQuotesFormSchema = (existing: readonly string[]) => z.object({ quotes: z.array(quote).min(1) }).superRefine(({ quotes }, context) => {
  quotes.forEach((quote, index) => {
    const name = quote.name.trim().toLowerCase();
    if (existing.includes(name) || quotes.filter((other) => other.name.trim().toLowerCase() === name).length > 1)
      context.addIssue({ code: "custom", path: ["quotes", index, "name"], message: "This vendor already has a quote for the item." });
  });
});
export type MarketQuotesFormValues = z.infer<ReturnType<typeof marketQuotesFormSchema>>;
export const vendorPricesFormSchema = z.object({ prices: z.array(z.object({ price, per: z.string() })) });
export type VendorPricesFormValues = z.infer<typeof vendorPricesFormSchema>;
