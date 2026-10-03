import { z } from "zod";

export const manufacturerRowSchema = z.object({
  id: z.string().min(1), name: z.string().nullish(), address: z.string().nullish(),
  country: z.object({ name: z.string().nullish() }).nullish(),
  approvedAt: z.string().nullish(), validityDate: z.string().nullish(),
});
export const manufacturerRowsSchema = z.array(manufacturerRowSchema);
export type ManufacturerRow = z.infer<typeof manufacturerRowSchema>;
