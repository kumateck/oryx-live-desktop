import { z } from "zod";

const text = z.string().nullish().transform((v) => v?.trim() || null);
const person = z.object({ firstName: text, lastName: text, email: text }).nullish().transform((p) => p ? [p.firstName, p.lastName].filter(Boolean).join(" ") || p.email || null : null);
const quotation = z.object({ id: z.string(), quotationNumber: text, grandTotal: z.number().nullish(), totalCost: z.number().nullish(), status: z.number().catch(0), isSelected: z.boolean().catch(false),
  serviceProvider: z.object({ name: text }).nullish(), currency: z.object({ symbol: text }).nullish(), estimatedCompletionDate: text });
/** A job order as the service screens read it. */
export const jobOrderSchema = z.object({
  id: z.string(), code: text, jobRequestId: text, issuedDate: text, description: text, status: z.number().catch(-1), issuedBy: person, issuedBySignature: text,
  service: z.object({ name: text }).nullish(),
  serviceProviders: z.array(z.object({ id: z.string(), sentAt: text, responseReceived: z.boolean().catch(false), responseDate: text, serviceProvider: z.object({ name: text, email: text, phone: text }).nullish() })).nullish().transform((v) => v ?? []),
  quotations: z.array(quotation).nullish().transform((v) => v ?? []),
  serviceProformaInvoice: z.object({ status: z.number().catch(0), invoiceNumber: text }).nullish(),
  serviceMemo: z.object({ memoNumber: text, status: z.number().catch(0), paid: z.boolean().catch(false) }).nullish(),
});
export type JobOrder = z.infer<typeof jobOrderSchema>;
