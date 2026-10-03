import { z } from "zod";
import { supplierContactSchema } from "@/shared/procurement/supplier-schema";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);

/** One material with every supplier's open quote for it. */
export const comparisonSchema = z.array(z.object({
  material: z.object({ id: z.string().nullish(), name: text, code: text }).nullish(), uoM: z.object({ id: z.string().nullish(), symbol: text }).nullish(), quantity: amount,
  supplierQuotation: z.array(z.object({
    supplier: supplierContactSchema, sourceRequisition: z.object({ id: z.string().nullish(), code: text }).nullish(),
    defaultManufacturer: z.object({ name: text }).nullish(), price: z.number().nullish(), priceUoM: text,
  })).nullish(),
})).nullish().transform((value) => (value ?? []).flatMap((entry) => entry.material?.id && entry.uoM?.id ? [{
  id: `${entry.material.id}:${entry.uoM.id}`, materialId: entry.material.id, materialName: entry.material.name ?? "Unnamed material", materialCode: entry.material.code,
  quantity: entry.quantity, unit: entry.uoM.symbol, unitId: entry.uoM.id,
  quotes: (entry.supplierQuotation ?? []).flatMap((quote) => quote.supplier.id ? [{
    key: `${quote.supplier.id}:${quote.sourceRequisition?.id ?? "none"}`, supplierId: quote.supplier.id, supplierName: quote.supplier.name, country: quote.supplier.country,
    currency: quote.supplier.currency, currencyId: quote.supplier.currencyId, sourceRequisitionId: quote.sourceRequisition?.id ?? null, sourceRequisitionCode: quote.sourceRequisition?.code ?? null,
    manufacturer: quote.defaultManufacturer?.name ?? null, price: typeof quote.price === "number" && Number.isFinite(quote.price) ? quote.price : null, priceUnit: quote.priceUoM,
  }] : []),
}] : []));
export type ComparisonGroup = z.infer<typeof comparisonSchema>[number];
export type ComparisonQuote = ComparisonGroup["quotes"][number];
