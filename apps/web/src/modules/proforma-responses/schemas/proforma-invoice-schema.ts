import { z } from "zod";
import { proformaFileLimit, proformaFileTypes } from "../lib/proforma-response-access";

const option = z.object({ value: z.string().min(1), label: z.string() });
const extensions = proformaFileTypes.split(",");

export const proformaInvoiceFormSchema = z.object({
  invoiceNumber: z.string().trim().min(1, "Enter the proforma invoice number").max(100, "Keep the number under 100 characters"),
  // Empty until chosen; checked on the field so its message shows with the others.
  termsOfPayment: option.nullable().refine((value): boolean => Boolean(value), "Choose the terms of payment"),
  deliveryMode: option.nullable().refine((value): boolean => Boolean(value), "Choose the delivery mode"),
  estimatedDeliveryDate: z.date({ message: "Choose the estimated delivery date" }),
  attachments: z.array(z.instanceof(File)).min(1, "Attach the proforma invoice")
    .refine((files) => files.every((file) => extensions.some((extension) => file.name.toLowerCase().endsWith(extension))), "Attach PDF, image, Word or Excel files only")
    .refine((files) => files.every((file) => file.size <= proformaFileLimit), "Each file must be 10 MB or smaller"),
});
export type ProformaInvoiceFormValues = z.infer<typeof proformaInvoiceFormSchema>;
