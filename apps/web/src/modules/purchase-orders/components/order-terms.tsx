import type { PurchaseOrder } from "@/modules/proforma-requests/schemas/purchase-order-schema";
import { formatDate } from "@/shared/format/dates";
import { formatMoney } from "@/shared/procurement/price";
import type { SupplierType } from "@/shared/procurement/supplier-type";
import { totalLabels } from "../lib/order-totals";

/** What was agreed on the proforma invoice: its number, terms, delivery. */
export function OrderTerms({ order }: { order: PurchaseOrder }) {
  const facts = [["Proforma invoice", order.proformaNumber], ["Terms of payment", order.termsOfPayment], ["Delivery mode", order.deliveryMode], ["Estimated delivery", formatDate(order.estimatedDelivery)]];
  return <dl className="grid gap-x-8 gap-y-2 rounded-md bg-muted/50 p-3 text-sm sm:grid-cols-2 lg:grid-cols-4">{facts.map(([label, value]) =>
    <div key={label} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="break-words font-medium">{value ?? "Not recorded"}</dd></div>)}</dl>;
}

/** The order's value and the charges on it, as recorded when it was finalised. */
export function OrderTotals({ order, type }: { order: PurchaseOrder; type: SupplierType }) {
  const currency = order.supplier.currency;
  const labels = totalLabels[type];
  const rows: (readonly [string, number | null])[] = [[labels.value, order.recorded.value ?? order.total],
    ...(type === 1 ? [["Tax", order.recorded.freightOrTax] as const] : [["Insurance", order.recorded.insurance] as const, ["Freight", order.recorded.freightOrTax] as const]),
    [labels.grand, order.recorded.grandTotal]];
  return <div className="ml-auto w-full max-w-sm space-y-1 rounded-md border p-3 text-sm">
    {rows.map(([label, value], index) => <div key={label} className={index === rows.length - 1 ? "flex justify-between gap-4 border-t pt-1 font-semibold" : "flex justify-between gap-4"}>
      <span className={index === rows.length - 1 ? undefined : "text-muted-foreground"}>{label}</span><span>{value === null ? "–" : formatMoney(value, currency)}</span></div>)}
    {order.recorded.inWords ? <p className="pt-1 text-xs text-muted-foreground">{order.recorded.inWords}</p> : null}
  </div>;
}
