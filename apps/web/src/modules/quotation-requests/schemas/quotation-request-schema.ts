import { z } from "zod";
import { supplierContactSchema } from "@/shared/procurement/supplier-schema";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);

/** What one supplier is being asked to quote for: every material sourced to them since their last request. */
export const quotationRequestRowsSchema = z.array(z.object({
  supplier: supplierContactSchema, sentQuotationRequestAt: z.string().nullish(),
  items: z.array(z.object({
    id: z.string().nullish(), quantity: amount, createdAt: z.string().nullish(),
    material: z.object({ code: text, name: text }).nullish(), uoM: z.object({ symbol: text }).nullish(), defaultManufacturer: z.object({ name: text }).nullish(),
  })).nullish(),
})).nullish().transform((value) => (value ?? []).map((entry, index) => ({
  // A supplier has one unsent request at a time but many sent ones, so the row is named by both.
  id: `${entry.supplier.id ?? "supplier"}:${entry.sentQuotationRequestAt ?? "open"}:${index}`,
  supplier: entry.supplier, sentAt: entry.sentQuotationRequestAt ?? null,
  items: (entry.items ?? []).map((item, line) => ({ id: item.id ?? `line-${line}`, materialName: item.material?.name ?? "Unnamed material", materialCode: item.material?.code ?? null,
    manufacturer: item.defaultManufacturer?.name ?? null, quantity: item.quantity, unit: item.uoM?.symbol ?? null })),
})));
export type QuotationRequest = z.infer<typeof quotationRequestRowsSchema>[number];
export type QuotationRequestLine = QuotationRequest["items"][number];
