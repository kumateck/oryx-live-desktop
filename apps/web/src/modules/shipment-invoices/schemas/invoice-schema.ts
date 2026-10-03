import { z } from "zod";
import { lineCost } from "@/shared/procurement/price";
import { supplierContactSchema } from "@/shared/procurement/supplier-schema";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
// The server writes "N/A" where there is nothing to record.
const real = (value: string | null) => value && value.toLowerCase() !== "n/a" ? value : null;

const invoice = z.object({
  id: z.string().nullish(), code: text, createdAt: z.string().nullish(), supplier: supplierContactSchema, isUsed: z.boolean().nullish(), paidAt: z.string().nullish(), dueDate: z.string().nullish(),
  totalCost: z.number().nullish(), amountPaid: z.number().nullish(), outstandingBalance: z.number().nullish(), currency: z.object({ symbol: text }).nullish(),
  items: z.array(z.object({ id: z.string().nullish(), expectedQuantity: amount, receivedQuantity: amount, price: z.number().nullish(), priceUoM: text, reason: text,
    material: z.object({ name: text, code: text, pharmacopoeia: text, specification: z.object({ specificationNumber: text }).nullish() }).nullish(), totalCost: z.number().nullish(), uoM: z.object({ symbol: text }).nullish(), manufacturer: z.object({ name: text }).nullish(), purchaseOrder: z.object({ id: z.string().nullish(), code: text }).nullish() })).nullish(),
});

function read(entry: z.infer<typeof invoice>) {
  if (!entry.id) return null;
  const items = (entry.items ?? []).map((item, index) => {
    const unit = item.uoM?.symbol ?? null;
    const price = typeof item.price === "number" ? item.price : null;
    return { id: item.id ?? `line-${index}`, materialName: item.material?.name ?? "Unnamed material", materialCode: item.material?.code ?? null, manufacturer: real(item.manufacturer?.name ?? null),
      order: item.purchaseOrder?.code ?? null, expected: item.expectedQuantity, quantity: item.receivedQuantity, unit, price, priceUnit: item.priceUoM, reason: real(item.reason),
      pharmacopoeia: real(item.material?.pharmacopoeia ?? null), specification: real(item.material?.specification?.specificationNumber ?? null),
      // Worked out from the price; the server's own figure stands in only when the units cannot be converted.
      cost: lineCost({ quantity: item.receivedQuantity, unit, price, priceUnit: item.priceUoM }) ?? (typeof item.totalCost === "number" && item.totalCost > 0 ? item.totalCost : null),
      expectedCost: lineCost({ quantity: item.expectedQuantity, unit, price, priceUnit: item.priceUoM }) };
  });
  const currency = entry.currency?.symbol ?? entry.supplier.currency;
  return { id: entry.id, code: entry.code ?? "No number", createdAt: entry.createdAt ?? null, supplier: entry.supplier, currency, onShipment: entry.isUsed === true, paidAt: entry.paidAt ?? null, dueDate: entry.dueDate ?? null,
    orders: [...new Set(items.flatMap((item) => item.order ? [item.order] : []))], items,
    // Worked out from the lines; the server's figure is used only when a line cannot be costed.
    total: items.every((item) => item.cost !== null) ? items.reduce((sum, item) => sum + (item.cost ?? 0), 0) : typeof entry.totalCost === "number" && entry.totalCost > 0 ? entry.totalCost : null,
    paid: typeof entry.amountPaid === "number" ? entry.amountPaid : 0, outstanding: typeof entry.outstandingBalance === "number" ? entry.outstandingBalance : null };
}

/** A supplier's invoice for goods on purchase orders. */
export const invoiceSchema = invoice.transform(read);
export const invoiceRowsSchema = z.array(invoice).nullish().transform((value) => (value ?? []).flatMap((entry) => { const row = read(entry); return row ? [row] : []; }));
export type ShipmentInvoice = z.infer<typeof invoiceRowsSchema>[number];
export type ShipmentInvoiceLine = ShipmentInvoice["items"][number];

export const supplierOptionsSchema = z.array(z.object({ id: z.string().nullish(), name: text })).nullish()
  .transform((value) => (value ?? []).flatMap((supplier) => supplier.id ? [{ value: supplier.id, label: supplier.name ?? "Unnamed supplier" }] : []));

const option = z.object({ value: z.string().min(1), label: z.string() });
export const invoiceFormSchema = z.object({
  code: z.string().trim().min(1, "Enter the supplier's invoice number").max(100, "Keep the number under 100 characters"),
  // Empty until chosen; checked on the field so its message shows with the others.
  supplier: option.nullable().refine((value): boolean => Boolean(value), "Choose the supplier"),
  orders: z.array(option).min(1, "Choose at least one purchase order"),
});
export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
