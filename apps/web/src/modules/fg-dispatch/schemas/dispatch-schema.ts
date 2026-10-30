import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const date = z.string().nullish().transform((value) => value && new Date(value).getFullYear() >= 1900 ? value : null);
const currency = z.object({ id: z.string().nullish(), name: text, symbol: text }).nullish();
const customer = z.object({ id: z.string().nullish(), name: text, email: text, phone: z.union([z.string(), z.number()]).nullish().transform((value) => value === null || value === undefined ? null : String(value)), address: text, currency,
  termsOfPayment: z.object({ dueDays: z.number().nullish() }).nullish() }).nullish();
const productRef = z.object({ id: z.string().nullish(), name: text, code: text, genericName: text, price: z.number().nullish(), fullBatchSize: z.number().nullish(), department: z.object({ name: text }).nullish(),
  equipment: z.object({ name: text, location: text }).nullish() }).nullish();
const allocation = z.object({ id: z.string().nullish(), invoiceCode: text, approved: z.boolean().nullish(), loadedAt: date, deliveredAt: date, createdAt: z.string().nullish(), hasInvoice: z.boolean().nullish(), hasWayBill: z.boolean().nullish(), status: z.number().nullish(),
  productionOrder: z.object({ id: z.string().nullish(), code: text, customer }).nullish(),
  products: z.array(z.object({ product: productRef, productPacking: z.object({ id: z.string().nullish(), name: text, packPerShipper: amount }).nullish(),
    fulfilledQuantities: z.array(z.object({ quantity: amount, finishedGoodsTransferNote: z.object({ id: z.string().nullish() }).nullish(), batchPackagingRecord: z.object({ batchNumber: text, manufacturingDate: date, expiryDate: date, productPacking: z.object({ name: text, packPerShipper: amount }).nullish() }).nullish() })).nullish() })).nullish() });

function readCustomer(entry: z.infer<typeof customer>) {
  return { id: entry?.id ?? null, name: entry?.name ?? "Unnamed customer", email: entry?.email ?? null, phone: entry?.phone ?? null, address: entry?.address ?? null, currency: entry?.currency?.symbol ?? entry?.currency?.name ?? null,
    dueDays: typeof entry?.termsOfPayment?.dueDays === "number" ? entry.termsOfPayment.dueDays : null };
}
function readAllocation(entry: z.infer<typeof allocation>) {
  if (!entry.id) return null;
  const products = (entry.products ?? []).map((item, index) => { const sources = (item.fulfilledQuantities ?? []).map((source) => ({ quantity: source.quantity, noteId: source.finishedGoodsTransferNote?.id ?? null, batch: source.batchPackagingRecord?.batchNumber ?? null, made: source.batchPackagingRecord?.manufacturingDate ?? null,
      expires: source.batchPackagingRecord?.expiryDate ?? null, packing: source.batchPackagingRecord?.productPacking?.name ?? item.productPacking?.name ?? null, perShipper: source.batchPackagingRecord?.productPacking?.packPerShipper || item.productPacking?.packPerShipper || 0 }));
    return { key: `${item.product?.id ?? "product"}-${index}`, productId: item.product?.id ?? null, name: item.product?.name ?? "Unnamed product", code: item.product?.code ?? null, genericName: item.product?.genericName ?? null,
      listPrice: typeof item.product?.price === "number" ? item.product.price : null, packingId: item.productPacking?.id ?? null, department: item.product?.department?.name ?? null, equipment: item.product?.equipment?.name ?? null,
      storage: item.product?.equipment?.location ?? null, batchSize: item.product?.fullBatchSize ?? null, sources, quantity: sources.reduce((sum, source) => sum + source.quantity, 0) }; });
  return { id: entry.id, invoiceCode: entry.invoiceCode, approved: entry.approved === true, loadedAt: entry.loadedAt, deliveredAt: entry.deliveredAt, createdAt: entry.createdAt ?? null, hasInvoice: entry.hasInvoice === true, hasWaybill: entry.hasWayBill === true,
    // 0 pending, 1 loaded, 2 waybill sent, 3 delivered.
    status: entry.status ?? 0,
    orderId: entry.productionOrder?.id ?? null, orderCode: entry.productionOrder?.code ?? null, customer: readCustomer(entry.productionOrder?.customer), products };
}
/** Packs set aside from approved batches for a customer's order: a packing list until it is approved, an allocation after. */
export const allocationSchema = allocation.transform(readAllocation);
export const allocationRowsSchema = z.array(allocation).nullish().transform((value) => (value ?? []).flatMap((entry) => { const row = readAllocation(entry); return row ? [row] : []; }));
export type Allocation = z.infer<typeof allocationRowsSchema>[number];

const invoice = z.object({ id: z.string().nullish(), code: text, status: z.number().nullish(), createdAt: z.string().nullish(), createdBy: z.object({ firstName: text, lastName: text }).nullish(), allocateProductionOrder: allocation.nullish(),
  products: z.array(z.object({ id: z.string().nullish(), product: productRef, quantity: amount })).nullish(), attachments: z.array(z.object({ id: z.string().nullish(), name: text, link: text })).nullish() });
function readInvoice(entry: z.infer<typeof invoice>) {
  if (!entry.id) return null;
  return { id: entry.id, code: entry.code ?? "No number", status: entry.status ?? 0, createdAt: entry.createdAt ?? null, createdBy: [entry.createdBy?.firstName, entry.createdBy?.lastName].filter(Boolean).join(" ") || null,
    allocation: entry.allocateProductionOrder ? readAllocation(entry.allocateProductionOrder) : null,
    products: (entry.products ?? []).map((item, index) => ({ key: item.id ?? `line-${index}`, productId: item.product?.id ?? null, name: item.product?.name ?? "Unnamed product", code: item.product?.code ?? null, genericName: item.product?.genericName ?? null,
      listPrice: typeof item.product?.price === "number" ? item.product.price : null, quantity: item.quantity })),
    attachments: (entry.attachments ?? []).map((file, index) => ({ id: file.id ?? `file-${index}`, name: file.name ?? "Unnamed file", link: file.link })) };
}
/** A proforma invoice for an allocation; it becomes the invoice once the customer's purchase order is attached. */
export const invoiceSchema = invoice.transform(readInvoice);
export const invoiceRowsSchema = z.array(invoice).nullish().transform((value) => (value ?? []).flatMap((entry) => { const row = readInvoice(entry); return row ? [row] : []; }));
export type ProformaInvoice = z.infer<typeof invoiceRowsSchema>[number];

export const waybillSchema = z.object({ code: z.string().trim().min(1, "Enter the waybill number").max(100, "Keep the number under 100 characters"), comment: z.string() });
export type WaybillValues = z.infer<typeof waybillSchema>;
const fileTypes = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".doc", ".docx", ".xlsx"];
export const attachTypes = fileTypes.join(",");
export const attachLimit = 10 * 1024 * 1024;
export const attachSchema = z.object({ attachments: z.array(z.instanceof(File)).min(1, "Attach the customer's purchase order")
  .refine((files) => files.every((file) => fileTypes.some((type) => file.name.toLowerCase().endsWith(type))), "Attach PDF, image, Word or Excel files only").refine((files) => files.every((file) => file.size <= attachLimit), "Each file must be 10 MB or smaller") });
export type AttachValues = z.infer<typeof attachSchema>;
