export const allocationsPath = "/crm/allocations";
export const allocationPath = (id: string) => `${allocationsPath}/${id}`;
export const proformaPath = "/crm/proforma-invoice";
export const proformaInvoicePath = (id: string) => `${proformaPath}/${id}`;
export const invoicesPath = "/crm/invoices";
export const audit = { module: "Finished Goods Warehouse", subModule: "Allocations" } as const;
export const invoiceAudit = { module: "Finished Goods Warehouse", subModule: "Proforma Invoices" } as const;
export const dispatchPermissions = { packingLists: "CanViewPackingList", allocations: "CanViewInvoice", generateProforma: "CanGenerateProformaInvoice", viewProforma: "CanViewProformaInvoice", sendProforma: "CanSendProformaInvoice",
  viewInvoice: "CanViewInvoice", createWaybill: "CanCreateWaybillForFgw" } as const;
/** A packing list is an allocation still waiting for approval (0); once approved it is an allocation ready to be invoiced and shipped (1). */
export type AllocationKind = 0 | 1;
export const allocationKinds: Record<AllocationKind, { title: string; permission: string }> = { 0: { title: "Packing lists", permission: dispatchPermissions.packingLists }, 1: { title: "Allocations", permission: dispatchPermissions.allocations } };
/** The numbers are the server's. */
export const invoiceStatus = { pending: 0, sent: 1, invoice: 2 } as const;
export const invoiceStatusLabels: Record<number, { label: string; note: string }> = { 0: { label: "Pending", note: "Created and ready to send to the customer." }, 1: { label: "Sent to customer", note: "Emailed to the customer. Attach their purchase order to turn it into an invoice." },
  2: { label: "Invoiced", note: "The customer's purchase order is attached." } };

export interface AllocationLike { approved: boolean; loadedAt: string | null; deliveredAt: string | null; hasWaybill: boolean }
export type DispatchStep = "load" | "waybill" | "deliver";
export const stepLabels: Record<DispatchStep, string> = { load: "Mark as loaded", waybill: "Create waybill", deliver: "Mark as delivered" };
/** What comes next for an allocation: it is loaded once approved, given a waybill once loaded, and delivered once it has a waybill. */
export function nextStep(allocation: AllocationLike): DispatchStep | null {
  if (!allocation.approved || allocation.deliveredAt) return null;
  if (!allocation.loadedAt) return "load";
  return allocation.hasWaybill ? "deliver" : "waybill";
}

export interface PackingRow { key: string; product: string; batch: string | null; made: string | null; expires: string | null; packing: string | null; perShipper: number; shippers: number; loose: number; packs: number }
interface SourceLike { quantity: number; batch: string | null; made: string | null; expires: string | null; packing: string | null; perShipper: number }
/** Every batch on a packing list as its own row, ordered by product then batch, with its packs split into shippers and loose packs. */
export function packingRows(products: readonly { name: string; sources: readonly SourceLike[] }[]): PackingRow[] {
  return products.flatMap((product, index) => product.sources.map((source, position) => ({ key: `${index}-${position}`, product: product.name, batch: source.batch, made: source.made, expires: source.expires, packing: source.packing, perShipper: source.perShipper,
    shippers: source.perShipper > 0 ? Math.floor(source.quantity / source.perShipper) : 0, loose: source.perShipper > 0 ? source.quantity % source.perShipper : source.quantity, packs: source.quantity })))
    .sort((a, b) => a.product.localeCompare(b.product, undefined, { sensitivity: "base" }) || (a.batch ?? "").localeCompare(b.batch ?? "", undefined, { numeric: true, sensitivity: "base" }));
}
/** The rows grouped by product. A product packed from more than one batch gets a subtotal. */
export function packingGroups(rows: readonly PackingRow[]): { product: string; rows: PackingRow[]; subtotal: number | null }[] {
  const names = [...new Set(rows.map((row) => row.product))];
  return names.map((product) => { const mine = rows.filter((row) => row.product === product); return { product, rows: mine, subtotal: new Set(mine.map((row) => row.batch)).size > 1 ? mine.reduce((sum, row) => sum + row.packs, 0) : null }; });
}
export const packingTotals = (rows: readonly PackingRow[]) => rows.reduce((sum, row) => ({ packs: sum.packs + row.packs, shippers: sum.shippers + row.shippers, loose: sum.loose + row.loose }), { packs: 0, shippers: 0, loose: 0 });

export interface Agreement { id: string; productId: string; productPackingId: string; agreedPrice: number; currency: { id: string | null; name: string | null; symbol: string | null } | null; effectiveFrom: string; effectiveTo?: string | null | undefined }
export interface PricedLine { key: string; productName: string; genericName: string | null; code: string | null; quantity: number; unitPrice: number; currency: string | null; currencyKey: string; source: "agreement" | "default" }
const time = (value: string | null | undefined) => { const date = value ? new Date(value) : null; return date && !Number.isNaN(date.getTime()) ? date.getTime() : null; };
/** The customer's agreed price for a product and packing style on a date: the newest agreement in effect that day. */
export function agreementFor(agreements: readonly Agreement[], productId: string | null, packingId: string | null, asOf: string | null): Agreement | null {
  const on = time(asOf) ?? Date.now();
  return agreements.filter((item) => { const from = time(item.effectiveFrom); const to = time(item.effectiveTo); return item.productId === productId && item.productPackingId === packingId && from !== null && from <= on && (to === null || to >= on); })
    .sort((a, b) => (time(b.effectiveFrom) ?? 0) - (time(a.effectiveFrom) ?? 0))[0] ?? null;
}
interface LineInput { key: string; productId: string | null; productName: string; genericName: string | null; code: string | null; packingId: string | null; quantity: number; listPrice: number | null }
/** Prices each line at the agreement in effect, or at the product's list price in the customer's currency when there is none. */
export function priceLines(lines: readonly LineInput[], agreements: readonly Agreement[], asOf: string | null, defaultCurrency: string | null): PricedLine[] {
  return lines.map((line) => { const agreement = agreementFor(agreements, line.productId, line.packingId, asOf);
    const currency = agreement ? agreement.currency?.symbol ?? agreement.currency?.name ?? null : defaultCurrency;
    return { key: line.key, productName: line.productName, genericName: line.genericName, code: line.code, quantity: line.quantity, unitPrice: agreement && Number.isFinite(agreement.agreedPrice) ? agreement.agreedPrice : line.listPrice ?? 0,
      currency, currencyKey: agreement?.currency?.id ?? currency ?? "", source: agreement ? "agreement" : "default" }; });
}
/** What the lines come to, one total per currency: amounts in different currencies are never added. */
export function totalsByCurrency(lines: readonly PricedLine[]): { currency: string | null; amount: number }[] {
  const totals = new Map<string, { currency: string | null; amount: number }>();
  for (const line of lines) totals.set(line.currencyKey, { currency: line.currency, amount: (totals.get(line.currencyKey)?.amount ?? 0) + line.quantity * line.unitPrice });
  return [...totals.values()];
}
/** "PFIN/FGP/26/008": the next proforma number for the year, after `count` already issued. */
export const proformaPrefix = (year: number = new Date().getFullYear()) => `PFIN/FGP/${String(year).slice(-2)}`;
export const proformaNumber = (count: number, year?: number) => `${proformaPrefix(year)}/${String(count + 1).padStart(3, "0")}`;
