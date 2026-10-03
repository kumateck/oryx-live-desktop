import { z } from "zod";
import { supplierContactSchema } from "@/shared/procurement/supplier-schema";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);

/** A request that was sent to a supplier, with the prices they quoted once those are recorded. */
export const supplierQuotationRowsSchema = z.array(z.object({
  id: z.string().nullish(), supplier: supplierContactSchema, receivedQuotation: z.boolean().nullish(),
  items: z.array(z.object({
    id: z.string().nullish(), quantity: amount, quotedPrice: z.number().nullish(), priceUoM: text,
    material: z.object({ id: z.string().nullish(), name: text, code: text }).nullish(), uoM: z.object({ id: z.string().nullish(), symbol: text }).nullish(),
    defaultManufacturer: z.object({ name: text }).nullish(),
  })).nullish(),
})).nullish().transform((value) => (value ?? []).flatMap((entry) => entry.id ? [{
  id: entry.id, supplier: entry.supplier, received: entry.receivedQuotation === true,
  // A line without its own id cannot be priced: the server matches prices to lines by id.
  items: (entry.items ?? []).flatMap((item) => item.id ? [{ id: item.id, materialId: item.material?.id ?? null, materialName: item.material?.name ?? "Unnamed material",
    manufacturer: item.defaultManufacturer?.name ?? null, quantity: item.quantity, unit: item.uoM?.symbol ?? null, unitId: item.uoM?.id ?? null,
    quotedPrice: typeof item.quotedPrice === "number" && Number.isFinite(item.quotedPrice) ? item.quotedPrice : null, priceUnit: item.priceUoM }] : []),
}] : []));
export type SupplierQuotation = z.infer<typeof supplierQuotationRowsSchema>[number];
export type SupplierQuotationLine = SupplierQuotation["items"][number];
