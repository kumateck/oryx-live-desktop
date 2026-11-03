import { itemLinesSchema } from "@/shared/inventory/item-line-schema";
import { Store } from "@/shared/inventory/stores";
import { z } from "zod";
import { utcBoundary } from "@/shared/format/date-boundary";

export const purchaseFormSchema = (editing: boolean) => z.object({
  store: z.enum(Store), lines: itemLinesSchema({ fractions: true, requireUnit: true }),
  number: z.string().trim().min(1, "Enter the requisition number."),
  delivery: z.date().nullable().refine((value) => editing || value === null || utcBoundary(value).slice(0, 10) >= new Date().toISOString().slice(0, 10), "The delivery date cannot be in the past."),
  remarks: z.string(),
});
export type PurchaseFormValues = z.infer<ReturnType<typeof purchaseFormSchema>>;
