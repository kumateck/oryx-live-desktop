import { z } from "zod";
import { packsFrom } from "@/shared/packing/packs";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const optional = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : null);
const currency = z.object({ id: z.string().nullish(), name: text, symbol: text }).nullish().transform((value) => value ? { id: value.id ?? null, name: value.name, symbol: value.symbol ?? value.name } : null);

const customer = z.object({ id: z.string().nullish(), name: text, email: text, phone: z.union([z.string(), z.number()]).nullish().transform((value) => value === null || value === undefined ? null : String(value).trim() || null), address: text });
export const customerRowsSchema = z.array(customer).nullish().transform((value) => (value ?? []).flatMap((entry) => entry.id ? [{ id: entry.id, name: entry.name ?? "Unnamed customer", email: entry.email, phone: entry.phone, address: entry.address }] : []));
export type CustomerRow = z.infer<typeof customerRowsSchema>[number];

export const profileSchema = z.object({ id: z.string(), name: text, email: text, phone: text, address: text, creditLimit: optional, termsOfPayment: z.object({ id: z.string().nullish(), name: text }).nullish(), type: z.number().nullish(),
  currency, billingAddress: text, shippingAddress: text });
export type CustomerProfile = z.infer<typeof profileSchema>;

export const creditSchema = z.object({ creditLimit: optional, preferredCurrencyName: text, outstandingInPreferredCurrency: optional, availableCredit: optional, additionalOrderValue: amount, isWithinCreditLimit: z.boolean().nullish(),
  outstandingByCurrency: z.array(z.object({ currencyId: z.string().nullish(), currencyName: text, currencySymbol: text, documentTotal: amount, amountPaid: amount, outstandingBalance: amount })).nullish().transform((value) => value ?? []) });
export const summarySchema = z.object({ lifetimeOrderCount: amount, totalOrderValue: amount, averageOrderValue: amount, onTimeDeliveryRate: optional, currentOutstandingBalance: optional });

export const contactsSchema = z.array(z.object({ id: z.string(), name: text, role: text, email: text, phone: text, isPrimary: z.boolean().nullish() })).nullish()
  .transform((value) => (value ?? []).map((entry) => ({ ...entry, name: entry.name ?? "Unnamed contact", isPrimary: entry.isPrimary === true })));
export type CustomerContact = z.infer<typeof contactsSchema>[number];

export const pricingSchema = z.array(z.object({ id: z.string(), productId: z.string(), productName: text, productPackingId: z.string(), productPackingName: text, agreedPrice: amount, currency, effectiveFrom: z.string(), effectiveTo: z.string().nullish(), notes: text })).nullish()
  .transform((value) => value ?? []);
export type PricingAgreement = z.infer<typeof pricingSchema>[number];

const quotation = z.object({ id: z.string(), customerId: z.string().nullish(), customerName: text, currency, code: text, status: z.number().nullish(), validUntil: z.string().nullish(), approved: z.boolean().nullish(), totalValue: amount,
  items: z.array(z.object({ id: z.string().nullish(), productName: text, quantity: amount, shippers: amount, loose: amount, productPackingName: text, unitPrice: amount, discountPercent: amount, totalValue: amount })).nullish(),
  approvals: z.array(z.object({ id: z.string().nullish(), order: z.number().nullish(), required: z.boolean().nullish(), status: z.number().nullish(), comments: text })).nullish() });
function readQuotation(entry: z.infer<typeof quotation>) {
  return { id: entry.id, customerId: entry.customerId ?? null, customerName: entry.customerName ?? "Unnamed customer", currency: entry.currency?.symbol ?? null, code: entry.code ?? "No number", status: entry.status ?? 0, validUntil: entry.validUntil ?? null,
    approved: entry.approved === true, total: entry.totalValue,
    items: (entry.items ?? []).map((line, index) => ({ id: line.id ?? `line-${index}`, product: line.productName ?? "Unnamed product", packing: line.productPackingName, quantity: line.quantity, shippers: line.shippers, loose: line.loose, unitPrice: line.unitPrice, discount: line.discountPercent, total: line.totalValue })),
    approvals: (entry.approvals ?? []).map((stage, index) => ({ id: stage.id ?? `stage-${index}`, order: stage.order ?? index + 1, required: stage.required === true, status: stage.status ?? 0, comments: stage.comments })).sort((a, b) => a.order - b.order) };
}
export const quotationSchema = quotation.transform(readQuotation);
export const quotationRowsSchema = z.array(quotation).nullish().transform((value) => (value ?? []).map(readQuotation));
export type CustomerQuotation = z.infer<typeof quotationRowsSchema>[number];
export const ordersSchema = z.array(z.object({ id: z.string(), code: text, status: z.number().nullish(), totalValue: amount, promisedDeliveryDate: z.string().nullish(), deliveredAt: z.string().nullish(), createdAt: z.string().nullish() })).nullish().transform((value) => value ?? []);
export type CustomerOrder = z.infer<typeof ordersSchema>[number];

const option = z.object({ value: z.string().min(1), label: z.string() });
const chosen = (message: string) => option.nullable().refine((value): boolean => Boolean(value), message);
const email = z.string().trim().min(1, "Enter the email address").email("Enter a valid email address");
const phone = z.string().trim().min(1, "Enter the phone number").refine((value) => { const digits = value.replace(/\D/g, ""); return digits.length >= 7 && digits.length <= 15; }, "Enter a phone number of 7 to 15 digits");
export const customerFormSchema = z.object({ name: z.string().trim().min(3, "Enter the customer's name, at least 3 characters").max(200, "Keep the name under 200 characters"), address: z.string().trim().min(1, "Enter the address"), email, phone });
export type CustomerFormValues = z.infer<typeof customerFormSchema>;
export const profileFormSchema = customerFormSchema.extend({ type: option.nullable(), currency: option.nullable(), termsOfPayment: option.nullable(),
  // An empty number field reports "not a number"; that means no limit is set.
  creditLimit: z.number().or(z.nan()).refine((value) => Number.isNaN(value) || value >= 0, "The credit limit cannot be negative"), billingAddress: z.string().trim(), shippingAddress: z.string().trim() });
export type ProfileFormValues = z.infer<typeof profileFormSchema>;
export const contactFormSchema = z.object({ name: z.string().trim().min(1, "Enter the contact's name"), role: z.string().trim(), email: z.string().trim().refine((value) => value === "" || z.string().email().safeParse(value).success, "Enter a valid email address"), phone: z.string().trim(), isPrimary: z.boolean() });
export type ContactFormValues = z.infer<typeof contactFormSchema>;
export const pricingFormSchema = z.object({ product: chosen("Choose the product"), packing: chosen("Choose the packing style"), currency: chosen("Choose the currency"),
  price: z.number({ message: "Enter the agreed price" }).refine((value) => value > 0, "The agreed price must be above zero"),
  from: z.date({ message: "Choose when the price starts" }).nullable().refine((value): boolean => Boolean(value), "Choose when the price starts"), to: z.date().nullable(), notes: z.string().trim().max(1000, "Keep the notes under 1000 characters") })
  .refine((value) => !value.from || !value.to || value.to >= value.from, { path: ["to"], message: "The end date cannot be before the start date" });
export type PricingFormValues = z.infer<typeof pricingFormSchema>;
const wholeOrEmpty = (label: string) => z.number().or(z.nan()).refine((value) => Number.isNaN(value) || (Number.isInteger(value) && value >= 0), `Enter a whole number of ${label}, 0 or more`);
/** Orders are entered as full shippers and loose packs; the line's quantity is the total packs they make. */
const quotationLine = z.object({ product: chosen("Choose the product"), packing: chosen("Choose the packing style"), perShipper: z.number(),
  shippers: wholeOrEmpty("shippers"), loose: wholeOrEmpty("loose packs"),
  // Left empty, the server uses the price on record.
  unitPrice: z.number().or(z.nan()).refine((value) => Number.isNaN(value) || value >= 0, "The unit price cannot be negative"),
  discount: z.number({ message: "Enter a discount from 0 to 100" }).refine((value) => value >= 0 && value <= 100, "The discount is from 0 to 100"), fromAgreement: z.boolean().nullable() })
  .superRefine((line, context) => {
    if (line.perShipper > 0 && line.loose >= line.perShipper)
      context.addIssue({ code: "custom", path: ["loose"], message: `Loose packs must be fewer than ${line.perShipper.toLocaleString("en-US")}, a full shipper. Add a shipper instead.` });
    else if (orderedPacks(line) < 1) context.addIssue({ code: "custom", path: [line.perShipper > 0 ? "shippers" : "loose"], message: "Enter at least one shipper or loose pack" });
  });
/** Total packs on a quotation line: full shippers times packs per shipper, plus loose packs. */
export const orderedPacks = (line: { shippers: number; loose: number; perShipper: number }) => packsFrom(line.shippers, line.loose, line.perShipper);
export const quotationFormSchema = z.object({ code: z.string().trim().min(1, "Enter the quotation number").max(100, "Keep the number under 100 characters"),
  validUntil: z.date({ message: "Choose how long the quotation is valid" }).nullable().refine((value): boolean => Boolean(value), "Choose how long the quotation is valid"),
  items: z.array(quotationLine).min(1, "Add at least one item").superRefine((lines, context) => { const seen = new Set<string>();
    lines.forEach((line, index) => { if (!line.product || !line.packing) return; const key = `${line.product.value}|${line.packing.value}`;
      if (seen.has(key)) context.addIssue({ code: "custom", path: [index, "packing"], message: "This product and packing style is already on the quotation" }); seen.add(key); }); }) });
export type QuotationFormValues = z.infer<typeof quotationFormSchema>;
export type QuotationLineValues = z.infer<typeof quotationLine>;
