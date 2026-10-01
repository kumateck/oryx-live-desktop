import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const named = z.object({ name: text }).nullish().transform((value) => value?.name ?? null);
const count = z.number().nullish().transform((value) => value !== null && value !== undefined && Number.isFinite(value) ? value : null);

export const productRowSchema = z.object({
  id: z.uuid(),
  code: text,
  name: text,
  category: named,
  department: named,
  division: z.number().nullish().transform((value) => value ?? null),
  baseQuantity: count,
  fullBatchSize: count,
  baseUoM: z.object({ symbol: text }).nullish().transform((value) => value?.symbol ?? null),
  shelfLife: text,
  fdaRegistrationNumber: text,
  masterFormulaNumber: text,
  isVerified: z.boolean().nullish().transform((value) => value ?? false),
});

export const productListSchema = z.array(productRowSchema);
export type ProductRow = z.infer<typeof productRowSchema>;
