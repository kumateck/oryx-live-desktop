import { z } from "zod";

export const supplierRowSchema = z.object({
  id: z.string().min(1), name: z.string().nullish(), email: z.string().nullish(),
  contactPerson: z.string().nullish(), contactNumber: z.string().nullish(),
  country: z.object({ name: z.string().nullish() }).nullish(),
  currency: z.object({ name: z.string().nullish(), symbol: z.string().nullish() }).nullish(),
  type: z.union([z.literal(0), z.literal(1)]).optional(),
  status: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
});
export const supplierRowsSchema = z.array(supplierRowSchema);
export type SupplierRow = z.infer<typeof supplierRowSchema>;
