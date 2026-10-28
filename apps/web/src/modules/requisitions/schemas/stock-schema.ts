import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() || null);
export const departmentOptionsSchema = z.array(z.object({ id: z.string().nullish(), name: text })).nullish()
  .transform((value) => (value ?? []).flatMap((entry) => entry.id ? [{ value: entry.id, label: entry.name ?? "Unnamed department" }] : []));

const option = z.object({ value: z.string().min(1), label: z.string() });
export const stockTransferFormSchema = z.object({
  code: z.string().trim().min(1, "Enter the request number"),
  reason: z.string().trim().max(1000, "Keep the reason under 1,000 characters").nullish(),
  sources: z.array(z.object({
    quantity: z.number({ message: "Enter the quantity" }).finite("Enter the quantity").positive("The quantity must be above zero"),
    unit: option,
    // Empty until chosen; checked on the field so its message shows with the others.
    department: option.nullable().refine((value): boolean => Boolean(value), "Choose the department"),
  })).min(1, "Add at least one department"),
});
export type StockTransferFormValues = z.infer<typeof stockTransferFormSchema>;
