import { Badge } from "@/components/ui/badge";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { PrintButton } from "@/shared/print/print-button";
import { formatMoney } from "@/shared/procurement/price";
import { SupplierDetails } from "@/shared/procurement/supplier-details";
import { invoicesPath } from "../lib/invoice-access";
import { linesByOrder, linesQuantity, linesValue } from "../lib/invoice-totals";
import type { ShipmentInvoice } from "../schemas/invoice-schema";
import { InvoiceLinesTable } from "./invoice-lines-table";
import { InvoicePrint } from "./invoice-print";

/** One supplier invoice: who it is from, what it covers order by order, what it is worth, and whether it is paid. */
export function InvoiceDetail({ invoice }: { invoice: ShipmentInvoice }) {
  const currency = invoice.currency;
  const groups = linesByOrder(invoice.items);
  return <article className="min-w-0 space-y-4">
    <PageHeader title={`Invoice ${invoice.code}`} crumbs={[{ label: "Shipment invoices", to: invoicesPath }, { label: invoice.code }]} actions={<PrintButton preview={(close) => <InvoicePrint invoice={invoice} onClose={close} />} />} />
    <div className="flex flex-wrap items-center gap-2">{invoice.onShipment ? <Badge variant="secondary">On a shipment</Badge> : <Badge variant="outline">Not yet shipped</Badge>}
      {invoice.paidAt ? <Badge>Paid</Badge> : <Badge variant="outline">Unpaid</Badge>}<span className="text-sm text-muted-foreground">Recorded {formatDateTime(invoice.createdAt) ?? "on an unrecorded date"}</span></div>
    <KeyFacts>
      <KeyFact label="Invoice value" value={invoice.total === null ? "Not available" : formatMoney(invoice.total, currency)} />
      <KeyFact label="Materials" value={invoice.items.length} note={`${groups.length} ${groups.length === 1 ? "purchase order" : "purchase orders"}`} />
      <KeyFact label="Total quantity" value={linesQuantity(invoice.items)} />
      <KeyFact label="Due" value={formatDate(invoice.dueDate) ?? "No due date"} note={invoice.dueDate ? undefined : "The orders' payment terms give none"} />
      <KeyFact label="Paid" value={invoice.paidAt ? formatDate(invoice.paidAt) ?? "Yes" : "Not yet"} note={invoice.outstanding !== null && invoice.outstanding > 0 ? `${formatMoney(invoice.outstanding, currency)} outstanding` : undefined} />
    </KeyFacts>
    <SupplierDetails supplier={invoice.supplier} />
    {groups.length === 0 ? <p className="text-sm text-muted-foreground">No lines on this invoice.</p> : groups.map((group) => { const value = linesValue(group.lines);
      return <section key={group.order ?? "none"} aria-label={group.order ? `Purchase order ${group.order}` : "Lines without a purchase order"} className="space-y-2 rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-sm font-semibold">{group.order ? `Purchase order ${group.order}` : "No purchase order"}</h2>
          <span className="text-sm text-muted-foreground">{group.lines.length} {group.lines.length === 1 ? "material" : "materials"} · {linesQuantity(group.lines)} · <span className="font-semibold text-foreground">{value === null ? "not costed" : formatMoney(value, currency)}</span></span></div>
        <InvoiceLinesTable label={group.order ? `Lines of ${group.order}` : "Invoice lines"} lines={group.lines} currency={currency} showOrder={false} /></section>; })}
  </article>;
}
