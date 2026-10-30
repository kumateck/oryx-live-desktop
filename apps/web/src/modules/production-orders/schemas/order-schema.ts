import { z } from "zod";
import { fgLayout } from "@/shared/packing/fg-quantity";
import type { OrderStatus } from "../lib/orders";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const customer = z.object({ id: z.string().nullish(), name: text, email: text, phone: z.union([z.string(), z.number()]).nullish().transform((value) => value === null || value === undefined ? null : String(value)), address: text }).nullish();
const product = z.object({ product: z.object({ id: z.string().nullish(), code: text, name: text }).nullish(), totalOrderQuantity: amount, unitPrice: z.number().nullish(), discountPercent: amount, totalValue: amount,
  fulfilledQuantities: z.array(z.object({ quantity: amount })).nullish(), fulfilled: z.boolean().nullish(), remainingQuantity: z.number().nullish(),
  productPacking: z.object({ id: z.string().nullish(), name: text, packPerShipper: amount }).nullish(), shippers: amount, loose: amount });
const order = z.object({ id: z.string().nullish(), code: text, createdAt: z.string().nullish(), createdBy: z.object({ firstName: text, lastName: text }).nullish(), customer, products: z.array(product).nullish(), totalValue: amount, status: z.number().nullish(),
  approved: z.boolean().nullish(), promisedDeliveryDate: z.string().nullish(), deliveredAt: z.string().nullish(), sourceCustomerQuotationId: z.string().nullish() });

function read(entry: z.infer<typeof order>) {
  if (!entry.id) return null;
  const lines = (entry.products ?? []).map((line, index) => { const done = (line.fulfilledQuantities ?? []).reduce((sum, item) => sum + item.quantity, 0);
    return { key: `${line.product?.id ?? "product"}|${line.productPacking?.id ?? index}`, productId: line.product?.id ?? null, productCode: line.product?.code ?? null, productName: line.product?.name ?? "Unnamed product",
      packingId: line.productPacking?.id ?? null, packing: line.productPacking?.name ?? null, perShipper: line.productPacking?.packPerShipper ?? 0, ordered: line.totalOrderQuantity, shippers: line.shippers, loose: line.loose,
      unitPrice: typeof line.unitPrice === "number" ? line.unitPrice : null, discount: line.discountPercent, value: line.totalValue, fulfilled: done, complete: line.fulfilled === true,
      // What is still to pack: the server's own figure when it gives one.
      remaining: typeof line.remainingQuantity === "number" ? Math.max(0, line.remainingQuantity) : Math.max(0, line.totalOrderQuantity - done) }; });
  return { id: entry.id, code: entry.code ?? "No number", createdAt: entry.createdAt ?? null, createdBy: [entry.createdBy?.firstName, entry.createdBy?.lastName].filter(Boolean).join(" ") || null,
    customer: { id: entry.customer?.id ?? null, name: entry.customer?.name ?? "Unnamed customer", email: entry.customer?.email ?? null, phone: entry.customer?.phone ?? null, address: entry.customer?.address ?? null },
    lines, total: entry.totalValue, status: (entry.status === 1 || entry.status === 2 ? entry.status : 0) as OrderStatus, approved: entry.approved === true, promised: entry.promisedDeliveryDate ?? null, delivered: entry.deliveredAt ?? null,
    quotationId: entry.sourceCustomerQuotationId ?? null };
}
/** What a customer has ordered, product by product, and how far it has been packed. */
export const orderSchema = order.transform(read);
export const orderRowsSchema = z.array(order).nullish().transform((value) => (value ?? []).flatMap((entry) => { const row = read(entry); return row ? [row] : []; }));
export type ProductionOrder = z.infer<typeof orderRowsSchema>[number];
export type OrderLine = ProductionOrder["lines"][number];

const date = z.string().nullish().transform((value) => value && new Date(value).getFullYear() >= 1900 ? value : null);
/**
 * The approved batches of a product and the whole packs each still has free. Stock is held as yield (base units),
 * so it is turned into packs with the units per pack saved on the transfer note (or its packing style for older
 * notes), the same rule the server uses. Free stock already excludes packing lists waiting for approval: the
 * server takes stock when a packing list is created.
 */
export const batchesSchema = z.object({ finishedGoodsTransferNotes: z.array(z.object({ id: z.string().nullish(), isApproved: z.boolean().nullish(), totalQuantity: amount, remainingQuantity: amount, quantityPerPack: amount,
  productPacking: z.object({ id: z.string().nullish(), name: text, packPerShipper: z.number().nullish(), basePackingUoM: z.object({ name: z.string().nullish(), symbol: z.string().nullish() }).nullish(),
    packingLists: z.array(z.object({ uom: z.object({ name: z.string().nullish(), symbol: z.string().nullish() }).nullish(), quantity: z.number().nullish(), order: z.number().nullish() })).nullish() }).nullish(),
  batchManufacturingRecord: z.object({ id: z.string().nullish(), batchNumber: text, manufacturingDate: date, expiryDate: date }).nullish() })).nullish() }).nullish()
  .transform((value) => (value?.finishedGoodsTransferNotes ?? []).flatMap((note) => { if (!note.id || note.isApproved !== true) return [];
    const layout = fgLayout(note.productPacking);
    const perPack = note.quantityPerPack > 0 ? note.quantityPerPack : layout.baseUnitsPerPack;
    return [{ noteId: note.id, batchNumber: note.batchManufacturingRecord?.batchNumber ?? null,
      made: note.batchManufacturingRecord?.manufacturingDate ?? null, expires: note.batchManufacturingRecord?.expiryDate ?? null, packingId: note.productPacking?.id ?? null, packing: note.productPacking?.name ?? null,
      perShipper: layout.perShipper ?? 0, perPack,
      // Whole packs only: units short of a pack cannot go on a packing list.
      free: perPack ? Math.floor(Math.max(0, note.remainingQuantity) / perPack + 1e-9) : 0 }]; }));
export type ApprovedBatch = z.infer<typeof batchesSchema>[number];
