import { z } from "zod";

export const procurementRoot = "/extrals/procurement";
export const paths = {
  sourcing: `${procurementRoot}/purchase-requisition-sourcing`,
  requests: `${procurementRoot}/vendor-quotations`,
  responses: `${procurementRoot}/quotation-responses`,
  comparison: `${procurementRoot}/price-comparison`,
  memo: `${procurementRoot}/memo`,
  market: `${procurementRoot}/open-market-collection`,
  purchased: `${procurementRoot}/purchased-items`,
} as const;
export const procurementAudit = { module: "General Stores", subModule: "Store Procurement" } as const;

// The server's keys for store procurement (InventoryProcurementController).
export const keys = {
  sourcingView: "CanViewPurchaseRequisitionsSourcing", source: "CanSourcePurchaseRequisitionSourcing",
  requestsView: "CanViewQuotationRequestsForTrustedVendors", requestCreate: "CanCreateQuotationRequestForTrustedVendor",
  responsesView: "CanViewQuotationResponsesForTrustedVendors", responseSend: "CanSendQuotationResponseForTrustedVendor",
  trustedPricingView: "CanViewTrustedVendorPricingSelection", trustedMemoCreate: "CanCreateMemoForTrustedVendor",
  trustedMemoView: "CanViewMemoForTrustedVendors", trustedOrderCreate: "CanCreatePurchaseOrderForTrustedVendor", trustedOrdersView: "CanViewPurchaseOrdersForTrustedVendors",
  marketSheetsView: "CanViewOpenMarketQuotationSheets", marketSheetCreate: "CanCreateOpenMarketQuotationSheet",
  marketPricingView: "CanViewOpenMarketPricingSelection", marketMemoCreate: "CanCreateOpenMarketMemo",
  marketMemoView: "CanViewOpenMarketMemo", marketOrderCreate: "CanCreateOpenMarketPurchaseOrder", marketOrdersView: "CanViewOpenMarketPurchaseOrders",
} as const;

export const Source = { Trusted: 0, OpenMarket: 1 } as const;
export type Source = (typeof Source)[keyof typeof Source];

const text = z.string().nullish().transform((v) => v?.trim() || null);
const num = z.number().nullish().transform((v) => v ?? 0);
const unit = z.object({ id: z.string().nullish(), name: text, symbol: text }).nullish();
const unitText = (u: z.infer<typeof unit>) => u?.symbol || u?.name || "";
const person = z.object({ firstName: text, lastName: text, email: text }).nullish().transform((p) => p ? [p.firstName, p.lastName].filter(Boolean).join(" ") || p.email || null : null);

const quoteItem = z.object({
  id: z.string(), quantity: num, quotedPrice: z.number().nullish().transform((v) => v ?? null), priceUoM: text,
  item: z.object({ id: z.string().nullish(), name: text, code: text }).nullish(), uoM: unit,
}).transform((q) => ({ id: q.id, quantity: q.quantity, price: q.quotedPrice, priceUnit: q.priceUoM, itemId: q.item?.id ?? "", name: q.item?.name ?? "Unnamed item", code: q.item?.code ?? "–", unit: unitText(q.uoM) }));
export const vendorQuotationSchema = z.object({
  id: z.string(), createdAt: text, receivedQuotation: z.boolean().catch(false),
  vendor: z.object({ id: z.string().nullish(), name: text, email: text, phone: text, address: text, contactPerson: text, currency: z.object({ symbol: text, name: text }).nullish() }).nullish(),
  sourceInventoryRequisition: z.object({ sentQuotationRequestAt: text, inventoryPurchaseRequisition: z.object({ code: text }).nullish() }).nullish(),
  items: z.array(quoteItem).nullish().transform((v) => v ?? []),
}).transform((q) => ({
  id: q.id, createdAt: q.createdAt, received: q.receivedQuotation, sentAt: q.sourceInventoryRequisition?.sentQuotationRequestAt ?? null,
  requisitionCode: q.sourceInventoryRequisition?.inventoryPurchaseRequisition?.code ?? null,
  vendor: { id: q.vendor?.id ?? "", name: q.vendor?.name ?? "Unnamed vendor", email: q.vendor?.email ?? null, phone: q.vendor?.phone ?? null, address: q.vendor?.address ?? null,
    contact: q.vendor?.contactPerson ?? null, currency: q.vendor?.currency?.symbol || q.vendor?.currency?.name || "" },
  items: q.items,
}));
export type VendorQuotation = z.infer<typeof vendorQuotationSchema>;
export const vendorQuotationPageSchema = z.object({ data: z.array(vendorQuotationSchema).nullish().transform((d) => d ?? []), pageIndex: z.number().optional(), pageCount: z.number().optional(), totalRecordCount: z.number().optional() });

const vendorPrice = z.object({
  vendor: z.object({ id: z.string().nullish(), name: text }).nullish(), vendorQuotationItem: z.object({ id: z.string().nullish(), quotedPrice: z.number().nullish(), priceUoM: text }).nullish(),
  vendorName: text, vendorPhoneNumber: text, vendorAddress: text, pricePerUnit: num, priceUoM: text, modeOfPayment: text, deliveryMode: text,
  openMarketTermsOfPayment: z.object({ name: text }).nullish(),
});
export const comparisonSchema = z.array(z.object({
  item: z.object({ id: z.string().nullish(), name: text, code: text }).nullish(), uoM: unit, quantity: num,
  vendorPrices: z.array(vendorPrice).nullish().transform((v) => v ?? []),
}).transform((row) => ({
  itemId: row.item?.id ?? "", name: row.item?.name ?? "Unnamed item", code: row.item?.code ?? "–", unitId: row.uoM?.id ?? "", unit: unitText(row.uoM), quantity: row.quantity,
  offers: row.vendorPrices.map((p) => ({
    // Trusted vendors are chosen by their quotation item; open-market offers by the offer's own id, which the server sends as the vendor id.
    choice: p.vendorQuotationItem?.id ?? p.vendor?.id ?? "", vendorName: p.vendor?.name || p.vendorName || "Unnamed vendor",
    price: p.vendorQuotationItem?.quotedPrice ?? p.pricePerUnit, priceUnit: p.vendorQuotationItem?.priceUoM ?? p.priceUoM,
    phone: p.vendorPhoneNumber, payment: [p.modeOfPayment, p.openMarketTermsOfPayment?.name].filter(Boolean).join(" · ") || null, delivery: p.deliveryMode,
  })).filter((o) => o.choice),
})));
export type ComparisonRow = z.infer<typeof comparisonSchema>[number];

const memoItem = z.object({
  id: z.string(), quantity: num, pricePerUnit: num, priceUoM: text, purchasedAt: text, vendorQuotationItemId: text, marketRequisitionVendorId: text,
  vendor: z.object({ name: text }).nullish(), item: z.object({ id: z.string().nullish(), name: text, code: text }).nullish(), uoM: unit, deliveryMode: text,
  termsOfPayment: z.object({ name: text }).nullish(),
}).transform((m) => ({
  id: m.id, quantity: m.quantity, price: m.pricePerUnit, value: m.quantity * m.pricePerUnit, purchasedAt: m.purchasedAt, vendor: m.vendor?.name ?? "–",
  name: m.item?.name ?? "Unnamed item", code: m.item?.code ?? "–", unit: unitText(m.uoM), source: m.marketRequisitionVendorId ? Source.OpenMarket : Source.Trusted,
  delivery: m.deliveryMode, terms: m.termsOfPayment?.name ?? null,
}));
export type MemoItem = z.infer<typeof memoItem>;
export const memoSchema = z.object({
  id: z.string(), code: text, createdAt: text, paid: z.boolean().catch(false), status: z.number().catch(0), createdBy: person,
  items: z.array(memoItem).nullish().transform((v) => v ?? []),
}).transform((m) => ({ id: m.id, code: m.code ?? "Uncoded memo", createdAt: m.createdAt, paid: m.paid, status: m.status, createdBy: m.createdBy, items: m.items,
  total: m.items.reduce((sum, i) => sum + i.value, 0) }));
export type Memo = z.infer<typeof memoSchema>;
export const memoPageSchema = z.object({ data: z.array(memoSchema).nullish().transform((d) => d ?? []), pageIndex: z.number().optional(), pageCount: z.number().optional(), totalRecordCount: z.number().optional() });
export const memoStatusLabel = (s: number) => s === 1 ? "Needs a purchase order" : "Memo";

export const marketSchema = z.object({
  id: z.string(), quantity: num, requisitionCode: text, inventoryPurchaseRequisitionId: text, vendorCount: num, closed: z.boolean().catch(false),
  item: z.object({ id: z.string().nullish(), name: text, code: text, store: z.number().nullish() }).nullish(), uoM: unit,
}).transform((m) => ({ id: m.id, quantity: m.quantity, requisitionCode: m.requisitionCode, vendorCount: m.vendorCount, closed: m.closed,
  itemId: m.item?.id ?? "", name: m.item?.name ?? "Unnamed item", code: m.item?.code ?? "–", unitId: m.uoM?.id ?? "", unit: unitText(m.uoM) }));
export type MarketRequisition = z.infer<typeof marketSchema>;
export const marketPageSchema = z.object({ data: z.array(marketSchema).nullish().transform((d) => d ?? []), pageIndex: z.number().optional(), pageCount: z.number().optional(), totalRecordCount: z.number().optional() });
export const marketVendorSchema = z.object({
  id: z.string(), vendorName: text, vendorAddress: text, vendorPhoneNumber: text, pricePerUnit: num, modeOfPayment: text, deliveryMode: text, complete: z.boolean().catch(false),
  termsOfPayment: z.object({ name: text }).nullish(), createdAt: text,
}).transform((v) => ({ id: v.id, name: v.vendorName ?? "Unnamed vendor", address: v.vendorAddress, phone: v.vendorPhoneNumber, price: v.pricePerUnit, payment: v.modeOfPayment,
  terms: v.termsOfPayment?.name ?? null, delivery: v.deliveryMode, complete: v.complete, createdAt: v.createdAt }));
export type MarketVendor = z.infer<typeof marketVendorSchema>;
export const marketVendorPageSchema = z.object({ data: z.array(marketVendorSchema).nullish().transform((d) => d ?? []) });

export const money = (value: number, currency = "") => `${currency ? `${currency} ` : ""}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
