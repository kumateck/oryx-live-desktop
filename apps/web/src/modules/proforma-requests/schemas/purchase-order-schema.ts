import { z } from "zod";
import { lineCost } from "@/shared/procurement/price";
import { supplierContactSchema } from "@/shared/procurement/supplier-schema";
import { isCountedUnit } from "@/shared/units/quantity";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);

const money = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null);
const named = z.object({ name: text }).nullish();
const revisionLine = z.object({ type: z.number().nullish(), material: named, materialBefore: named, quantity: z.number().nullish(), quantityBefore: z.number().nullish(), price: z.number().nullish(), priceBefore: z.number().nullish(),
  priceUoM: text, priceUoMBefore: text, uoM: z.object({ symbol: text }).nullish(), uomBefore: z.object({ symbol: text }).nullish(), revisionDate: z.string().nullish() });

const purchaseOrder = z.object({
  id: z.string().nullish(), code: text, createdAt: z.string().nullish(), status: z.number().nullish(), supplier: supplierContactSchema, proFormaInvoiceNumber: text,
  estimatedDeliveryDate: z.string().nullish(), expectedDeliveryDate: z.string().nullish(), deliveryMode: named, termsOfPayment: named,
  totalFobValue: money, totalCifValue: money, seaFreight: money, insurance: money, amountInFigures: text, isRevised: z.boolean().nullish(), revisionNumber: z.number().nullish(),
  attachments: z.array(z.object({ id: z.string().nullish(), name: text, link: text })).nullish(),
  revisions: z.array(z.object({ revisionNumber: z.number().nullish(), items: z.array(revisionLine).nullish() })).nullish(),
  items: z.array(z.object({ id: z.string().nullish(), quantity: amount, price: z.number().nullish(), priceUoM: text, cost: z.number().nullish(), canReassignSupplier: z.boolean().nullish(), quantityInvoiced: z.number().nullish(),
    manufacturers: z.array(z.object({ default: z.boolean().nullish(), manufacturer: z.object({ id: z.string().nullish(), name: text }).nullish() })).nullish(),
    material: z.object({ id: z.string().nullish(), name: text, code: text }).nullish(), uom: z.object({ id: z.string().nullish(), symbol: text }).nullish(), currency: z.object({ id: z.string().nullish() }).nullish() })).nullish(),
});

function read(entry: z.infer<typeof purchaseOrder>) {
  if (!entry.id) return null;
  const items = (entry.items ?? []).map((item, index) => {
    const price = typeof item.price === "number" && Number.isFinite(item.price) ? item.price : null;
    const unit = item.uom?.symbol ?? null;
    // Worked out from the quantity and the unit the price is quoted in. Without a price unit the server multiplies the price by
    // the stored quantity, which is right only for a counted unit (40 pcs at 2.5). A measured quantity is stored in mg or ml,
    // so that product is wrong (1.2 x 650,000,000 mg) and the line shows as not costable instead.
    const cost = lineCost({ quantity: item.quantity, unit, price, priceUnit: item.priceUoM })
      ?? (isCountedUnit(unit) && !item.priceUoM?.trim() && typeof item.cost === "number" && item.cost > 0 ? item.cost : null);
    return { id: item.id ?? `line-${index}`, materialName: item.material?.name ?? "Unnamed material", materialCode: item.material?.code ?? null, materialId: item.material?.id ?? null, canReassign: item.canReassignSupplier === true, invoiced: typeof item.quantityInvoiced === "number" ? item.quantityInvoiced : 0,
      // A manufacturer set up for several of the supplier's materials is listed once; the default comes first.
      manufacturers: [...new Map((item.manufacturers ?? []).flatMap((entry) => entry.manufacturer?.id ? [[entry.manufacturer.id, { id: entry.manufacturer.id, name: entry.manufacturer.name ?? "Unnamed manufacturer", preferred: entry.default === true }] as const] : [])).values()]
        .sort((left, right) => Number(right.preferred) - Number(left.preferred)), quantity: item.quantity, unit, unitId: item.uom?.id ?? null, currencyId: item.currency?.id ?? null, price, priceUnit: item.priceUoM, cost };
  });
  return { id: entry.id, code: entry.code ?? "No number", createdAt: entry.createdAt ?? null, status: entry.status ?? 0, supplier: entry.supplier, proformaNumber: entry.proFormaInvoiceNumber, items,
    estimatedDelivery: entry.estimatedDeliveryDate ?? null, expectedDelivery: entry.expectedDeliveryDate ?? null, deliveryMode: entry.deliveryMode?.name ?? null, termsOfPayment: entry.termsOfPayment?.name ?? null,
    // As recorded when the order was finalised. Sea freight holds the tax of a local order: the server has one field for both.
    recorded: { value: entry.totalFobValue, grandTotal: entry.totalCifValue, freightOrTax: entry.seaFreight, insurance: entry.insurance, inWords: entry.amountInFigures },
    revised: entry.isRevised === true, revisionNumber: entry.revisionNumber ?? 0,
    attachments: (entry.attachments ?? []).map((file, index) => ({ id: file.id ?? `file-${index}`, name: file.name ?? "Unnamed file", link: file.link })),
    revisions: (entry.revisions ?? []).map((revision, index) => ({ number: revision.revisionNumber ?? index + 1, date: revision.items?.find((item) => item.revisionDate)?.revisionDate ?? null,
      changes: (revision.items ?? []).map((item, line) => ({ id: `${index}-${line}`, type: item.type ?? -1, material: item.material?.name ?? item.materialBefore?.name ?? "Unnamed material", materialBefore: item.materialBefore?.name ?? null,
        quantity: item.quantity ?? null, quantityBefore: item.quantityBefore ?? null, unit: item.uoM?.symbol ?? item.uomBefore?.symbol ?? null,
        price: item.price ?? null, priceBefore: item.priceBefore ?? null, priceUnit: item.priceUoM, priceUnitBefore: item.priceUoMBefore })) })),
    // No total is better than a wrong one: it is left out when any line cannot be costed.
    total: items.every((item) => item.cost !== null) ? items.reduce((sum, item) => sum + (item.cost ?? 0), 0) : null };
}

/** A purchase order as created from an awarded quotation: who it is with and what it costs. */
export const purchaseOrderSchema = purchaseOrder.transform(read);
export const purchaseOrderRowsSchema = z.array(purchaseOrder).nullish().transform((value) => (value ?? []).flatMap((entry) => { const order = read(entry); return order ? [order] : []; }));
export type PurchaseOrder = z.infer<typeof purchaseOrderRowsSchema>[number];
export type PurchaseOrderRevision = PurchaseOrder["revisions"][number];
export type PurchaseOrderLine = PurchaseOrder["items"][number];
