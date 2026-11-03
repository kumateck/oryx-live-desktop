import { itemLinesSchema } from "@/shared/inventory/item-line-schema";
import { Store } from "@/shared/inventory/stores";
import { z } from "zod";

export const requisitionFormSchema = z.object({
  store: z.enum(Store), lines: itemLinesSchema({ capToStock: true }),
  number: z.string().trim().min(1, "Enter the requisition number."),
  department: z.object({ value: z.string(), label: z.string() }).nullable().refine((value): boolean => value !== null, "Choose the requesting department."),
  justification: z.string().trim().min(1, "Say why the items are needed."),
});
export type RequisitionFormValues = z.infer<typeof requisitionFormSchema>;
