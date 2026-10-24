import { z } from "zod";
import { invoiceSchema } from "@/modules/shipment-invoices/schemas/invoice-schema";
import { supplierContactSchema } from "@/shared/procurement/supplier-schema";
import { billingFileLimit, billingFileTypes } from "../lib/billing-access";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);

const sheet = z.object({
  id: z.string().nullish(), code: text, billOfLading: text, createdAt: z.string().nullish(), status: z.number().nullish(), approved: z.boolean().nullish(),
  expectedArrivalDate: z.string().nullish(), freeTimeExpiryDate: z.string().nullish(), freeTimeDuration: text, demurrageStartDate: z.string().nullish(), dueDate: z.string().nullish(),
  containerNumber: text, numberOfPackages: text, packageDescription: text, containerPackageStyle: z.object({ id: z.string().nullish(), name: text }).nullish(),
  supplier: z.unknown(), invoice: z.unknown(),
  charges: z.array(z.object({ id: z.string().nullish(), charge: z.object({ name: text }).nullish(), currency: z.object({ id: z.string().nullish(), symbol: text, name: text }).nullish(),
    amount, paid: z.boolean().nullish(), paymentStatus: z.number().nullish() })).nullish(),
  balances: z.array(z.object({ currencySymbol: text, currencyName: text, documentTotal: amount, amountPaid: amount, outstandingBalance: amount })).nullish(),
  attachments: z.array(z.object({ id: z.string().nullish(), name: text, link: text })).nullish(),
  createdBy: z.object({ firstName: text, lastName: text, department: z.object({ name: text }).nullish() }).nullish(),
});

function read(entry: z.infer<typeof sheet>) {
  if (!entry.id) return null;
  // The list sends only the invoice's own fields; the detail sends its lines and supplier too.
  const supplier = supplierContactSchema.safeParse(entry.supplier ?? null);
  // The invoice arrives without its supplier, which is the sheet's own.
  const raw = typeof entry.invoice === "object" && entry.invoice ? entry.invoice as { supplier?: unknown } : null;
  const invoice = invoiceSchema.safeParse(raw ? { ...raw, supplier: raw.supplier ?? entry.supplier } : null);
  const reference = z.object({ id: z.string().nullish(), code: text, createdAt: z.string().nullish() }).nullish().safeParse(entry.invoice ?? null);
  return { id: entry.id, code: entry.code ?? "No number", billOfLading: entry.billOfLading, createdAt: entry.createdAt ?? null, status: entry.status ?? 0, approved: entry.approved === true,
    arrival: entry.expectedArrivalDate ?? null, freeTimeExpiry: entry.freeTimeExpiryDate ?? null, freeTimeDuration: entry.freeTimeDuration, demurrageStart: entry.demurrageStartDate ?? null, dueDate: entry.dueDate ?? null,
    containerNumber: entry.containerNumber, packages: entry.numberOfPackages, packageDescription: entry.packageDescription,
    packageStyle: entry.containerPackageStyle?.id ? { id: entry.containerPackageStyle.id, name: entry.containerPackageStyle.name ?? "Unnamed style" } : null,
    supplier: supplier.success ? supplier.data : null, invoice: invoice.success ? invoice.data : null, invoiceId: reference.success ? reference.data?.id ?? null : null, invoiceCode: reference.success ? reference.data?.code ?? null : null, invoiceDate: reference.success ? reference.data?.createdAt ?? null : null,
    charges: (entry.charges ?? []).flatMap((charge) => charge.id ? [{ id: charge.id, name: charge.charge?.name ?? "Unnamed charge", amount: charge.amount, currencyId: charge.currency?.id ?? null,
      currency: charge.currency?.symbol ?? charge.currency?.name ?? null, paid: charge.paid === true, paymentStatus: charge.paymentStatus ?? null }] : []),
    balances: (entry.balances ?? []).map((balance) => ({ currency: balance.currencySymbol ?? balance.currencyName, total: balance.documentTotal, paid: balance.amountPaid, outstanding: balance.outstandingBalance })),
    preparedBy: [entry.createdBy?.firstName, entry.createdBy?.lastName].filter(Boolean).join(" ") || null, preparedByDepartment: entry.createdBy?.department?.name ?? null,
    attachments: (entry.attachments ?? []).map((file, index) => ({ id: file.id ?? `file-${index}`, name: file.name ?? "Unnamed file", link: file.link })) };
}

/** What it costs to clear one invoice's goods through the port: the container, its free time, and the charges. */
export const billingSheetSchema = sheet.transform(read);
export const billingSheetRowsSchema = z.array(sheet).nullish().transform((value) => (value ?? []).flatMap((entry) => { const row = read(entry); return row ? [row] : []; }));
export type BillingSheet = z.infer<typeof billingSheetRowsSchema>[number];
export type BillingCharge = BillingSheet["charges"][number];

const option = z.object({ value: z.string().min(1), label: z.string() });
const chosen = (message: string) => option.nullable().refine((value): boolean => Boolean(value), message);
// A number field left empty reports "not a number"; the message then says what to enter.
const whole = (message: string, minimum: number) => z.number({ message }).refine((value) => Number.isInteger(value) && value >= minimum && value <= 999_999, message);

const details = {
  code: z.string().trim().min(1, "Enter the billing sheet number").max(100, "Keep the number under 100 characters"),
  billOfLading: z.string().trim().min(1, "Enter the bill of lading number").max(100, "Keep the number under 100 characters"),
  arrival: z.date({ message: "Choose when the goods are expected" }).nullable().refine((value): boolean => Boolean(value), "Choose when the goods are expected"),
  freeDays: whole("Enter the free days as a whole number, 0 or more", 0).refine((value) => value <= 365, "Free time is at most 365 days"),
  containerNumber: z.string().trim().min(1, "Enter the container number").max(100, "Keep the number under 100 characters"),
  packages: whole("Enter how many packages, 1 or more", 1),
  packageStyle: option.nullable(),
  packageDescription: z.string().trim().max(1000, "Keep the description under 1000 characters"),
};
const chargeLine = z.object({ charge: chosen("Choose the charge"), amount: z.number({ message: "Enter the amount" }).refine((value) => value > 0, "The amount must be above zero") });
const charges = (minimum: string) => z.array(chargeLine).min(1, minimum).superRefine((lines, context) => {
  const seen = new Set<string>();
  lines.forEach((line, index) => {
    if (!line.charge) return;
    if (seen.has(line.charge.value)) context.addIssue({ code: "custom", path: [index, "charge"], message: "This charge is already on the sheet" });
    seen.add(line.charge.value);
  });
});
const extensions = billingFileTypes.split(",");
const files = z.array(z.instanceof(File))
  .refine((list) => list.every((file) => extensions.some((extension) => file.name.toLowerCase().endsWith(extension))), "Attach PDF, image, Word or Excel files only")
  .refine((list) => list.every((file) => file.size <= billingFileLimit), "Each file must be 10 MB or smaller");

export const editSheetSchema = z.object(details);
export type EditSheetValues = z.infer<typeof editSheetSchema>;
export const createSheetSchema = z.object({ ...details, invoice: chosen("Choose the invoice the sheet is for"), currency: chosen("Choose the currency"), charges: charges("Add at least one charge"), attachments: files });
export type CreateSheetValues = z.infer<typeof createSheetSchema>;
export const addChargesSchema = z.object({ currency: chosen("Choose the currency"), charges: charges("Add at least one charge") });
export type AddChargesValues = z.infer<typeof addChargesSchema>;
export type ChargeLineValues = z.infer<typeof chargeLine>;

const endOfToday = () => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59); };
export const paymentSchema = z.object({
  date: z.date({ message: "Choose the payment date" }).nullable().refine((value): boolean => Boolean(value), "Choose the payment date").refine((value) => !value || value <= endOfToday(), "The payment date cannot be in the future"),
  method: chosen("Choose how it was paid"),
  lines: z.array(z.object({ id: z.string(), include: z.boolean(), reference: z.string().trim().max(100, "Keep the reference under 100 characters"), notes: z.string().trim().max(500, "Keep the notes under 500 characters") })),
}).superRefine((values, context) => {
  const paying = values.lines.map((line, index) => ({ line, index })).filter((item) => item.line.include);
  if (paying.length === 0) context.addIssue({ code: "custom", path: ["lines"], message: "Tick at least one charge to pay" });
  const seen = new Set<string>();
  for (const { line, index } of paying) {
    const reference = line.reference.toLowerCase();
    if (!reference) context.addIssue({ code: "custom", path: ["lines", index, "reference"], message: "Enter the payment reference" });
    else if (seen.has(reference)) context.addIssue({ code: "custom", path: ["lines", index, "reference"], message: "Each payment needs its own reference" });
    seen.add(reference);
  }
});
export type PaymentValues = z.infer<typeof paymentSchema>;

