import { z } from "zod";

export const stockRequisitionFormSchema = z.object({
  code: z.string({ message: "Enter the requisition code" }).trim().min(1, "Enter the requisition code"),
  expectedDelivery: z.date({ message: "Choose when the materials are needed" }),
  comments: z.string().trim().nullish(),
});
export type StockRequisitionFormValues = z.infer<typeof stockRequisitionFormSchema>;
