import { z } from "zod";

const option = z.object({ value: z.string().min(1), label: z.string() });

/** A row corrected on the verification page. An empty quantity means the row has no stock to load. */
export const lineFormSchema = z.object({
  material: option.nullable(),
  materialCode: z.string().trim(),
  shelf: option.nullable(),
  batchNumber: z.string().trim(),
  unitSymbol: z.string().trim(),
  quantityInSheet: z.number().nullable().refine((value) => value === null || Number.isNaN(value) || value >= 0, "The quantity cannot be below zero"),
  manufactured: z.string().nullable(),
  expiry: z.string().nullable(),
  excluded: z.boolean(),
});
export type LineFormValues = z.infer<typeof lineFormSchema>;
