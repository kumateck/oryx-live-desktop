import { Link } from "react-router";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { formatDate } from "@/shared/format/dates";
import { formatMoney } from "@/shared/procurement/price";
import { billingSheetPath } from "../lib/billing-access";
import { chargeTotals, grandTotal } from "../lib/billing-rules";
import type { BillingSheet } from "../schemas/billing-schema";
import { BillingSheetStatus, ChargeStateBadge } from "./billing-status";

/** What a delivery costs in all: the invoice, the charges on the billing sheet, and the two together when they are in one currency. */
export function CostSummary({ invoiceTotal, invoiceCurrency, charges }: { invoiceTotal: number | null; invoiceCurrency: string | null; charges: BillingSheet["charges"] }) {
  const totals = chargeTotals(charges);
  const grand = grandTotal(invoiceTotal, invoiceCurrency, charges);
  return <DetailGroup title="Cost summary">
    <DetailItem label="Invoice total" value={invoiceTotal === null ? "Not available" : formatMoney(invoiceTotal, invoiceCurrency)} />
    <DetailItem label="Charges" value={totals.length === 0 ? "None" : totals.map((item) => formatMoney(item.total, item.currency)).join(" + ")} />
    <DetailItem label="Grand total" value={grand ? <span className="font-semibold">{formatMoney(grand.total, grand.currency)}</span> : invoiceTotal === null ? "Not available" : "Not added: the charges are in another currency"} />
  </DetailGroup>;
}

/** A shipment's billing sheet, shown on the shipment: the container, its free time, the charges and the cost of the delivery. */
export function BillingSheetSummary({ sheet, invoiceTotal, invoiceCurrency }: { sheet: BillingSheet; invoiceTotal: number | null; invoiceCurrency: string | null }) {
  return <section aria-label="Billing sheet" className="space-y-3">
    <div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold">Billing sheet <Link className="text-primary underline-offset-2 hover:underline" to={billingSheetPath(sheet.id)}>{sheet.code}</Link></h2><BillingSheetStatus sheet={sheet} /></div>
    <div className="grid gap-3 lg:grid-cols-2">
      <DetailGroup title="Shipping">
        <DetailItem label="Bill of lading" value={sheet.billOfLading} />
        <DetailItem label="Container" value={sheet.containerNumber} />
        <DetailItem label="Packages" value={[sheet.packages, sheet.packageStyle?.name].filter(Boolean).join(" ")} />
        <DetailItem label="Description" value={sheet.packageDescription} />
      </DetailGroup>
      <DetailGroup title="Dates">
        <DetailItem label="Expected arrival" value={formatDate(sheet.arrival)} />
        <DetailItem label="Free time" value={sheet.freeTimeDuration} />
        <DetailItem label="Free time ends" value={formatDate(sheet.freeTimeExpiry)} />
        <DetailItem label="Demurrage from" value={formatDate(sheet.demurrageStart)} />
      </DetailGroup>
      <DetailGroup title={`Charges (${sheet.charges.length})`}>
        {sheet.charges.length === 0 ? <p className="py-1.5 text-sm text-muted-foreground">No charges on the sheet.</p>
          : sheet.charges.map((charge) => <DetailItem key={charge.id} label={charge.name} value={<span className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium">{formatMoney(charge.amount, charge.currency)}</span><ChargeStateBadge charge={charge} /></span>} />)}
      </DetailGroup>
      <CostSummary invoiceTotal={invoiceTotal} invoiceCurrency={invoiceCurrency} charges={sheet.charges} />
    </div>
  </section>;
}
