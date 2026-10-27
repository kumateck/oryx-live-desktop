import { useState } from "react";
import { Banknote, Forward } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BillingSheetSummary } from "@/modules/billing-sheets/components/billing-summary";
import { useInvoiceBillingSheet } from "@/modules/billing-sheets/hooks/use-billing-sheets";
import { billingPermissions, createBillingSheetPath } from "@/modules/billing-sheets/lib/billing-access";
import { InvoiceLinesTable } from "@/modules/shipment-invoices/components/invoice-lines-table";
import { invoicePath } from "@/modules/shipment-invoices/lib/invoice-access";
import { AttachmentList } from "@/shared/attachments/attachment-list";
import { useAccess } from "@/shared/auth/use-access";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { PrintButton } from "@/shared/print/print-button";
import { formatMoney } from "@/shared/procurement/price";
import { SupplierDetails } from "@/shared/procurement/supplier-details";
import { advanceBlock, nextStatus, shipmentKinds, shipmentStatus, shipmentStatusLabels, type ShipmentKind } from "../lib/shipment-kinds";
import type { Shipment } from "../schemas/shipment-schema";
import { AdvanceShipmentDialog } from "./advance-shipment-dialog";
import { ShipmentChargeActions } from "./shipment-charge-actions";
import { ShipmentBillingPrint, WaybillPrint } from "./shipment-print";
import { ShipmentStatusBadge } from "./shipment-status-badge";
import { ShipmentTimeline } from "./shipment-timeline";

/** One delivery: its document and supplier, the stages it has passed, its billing sheet, what it carries, and its papers. */
export function ShipmentDetail({ kind, shipment }: { kind: ShipmentKind; shipment: Shipment }) {
  const config = shipmentKinds[kind];
  const { has } = useAccess();
  const [advancing, setAdvancing] = useState(false);
  const next = nextStatus(kind, shipment.status);
  const block = advanceBlock(kind, shipment);
  const invoice = shipment.invoice;
  const billing = useInvoiceBillingSheet(invoice?.id ?? null, kind === "shipment" && shipment.hasBillingSheet && has(billingPermissions.view));
  const mayBill = kind === "shipment" && shipment.status === shipmentStatus.atPort && !shipment.hasBillingSheet && invoice && has(billingPermissions.create);
  return <article className="min-w-0 space-y-4">
    <PageHeader title={shipment.code} crumbs={[{ label: config.title, to: config.root }, { label: shipment.code }]} actions={<>
      {kind === "shipment" && has("CanRecordShipmentDiscrepancy") && has("CanViewShipmentDocument") ? <Button asChild size="sm" variant="outline"><Link to={`/logistics/shipment-discrepancies/create?shipmentDocumentId=${encodeURIComponent(shipment.id)}`}>Report discrepancy</Link></Button> : null}
      <PrintButton preview={(close) => kind === "shipment" ? <ShipmentBillingPrint shipment={shipment} sheet={billing.sheet} onClose={close} /> : <WaybillPrint shipment={shipment} onClose={close} />} />
      {kind === "shipment" && billing.sheet ? <ShipmentChargeActions shipment={shipment} sheet={billing.sheet} /> : null}
      {mayBill ? <Button asChild type="button" size="sm" variant="outline"><Link to={createBillingSheetPath(invoice.id)}><Banknote />Create billing sheet</Link></Button> : null}
      {next !== null && has(config.permissions.advance) ? <Button type="button" size="sm" disabled={block !== null} onClick={() => setAdvancing(true)}><Forward />Mark as {shipmentStatusLabels[next].toLowerCase()}</Button> : null}
    </>} />
    <ShipmentStatusBadge status={shipment.status} />
    {next !== null && block ? <p role="status" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">{block}</p> : null}
    {shipment.status === shipmentStatus.arrived ? <p role="status" className="rounded-md border bg-muted/50 p-3 text-sm">{shipment.distributedAt ? `The materials were distributed on ${formatDateTime(shipment.distributedAt) ?? "an unrecorded date"}.`
      : shipment.approved ? "The arrival is approved; the materials can be distributed." : "The arrival is waiting for approval before the materials can be distributed."}</p> : null}
    <div className="grid gap-3 lg:grid-cols-2">
      <DetailGroup title="Document">
        <DetailItem label="Document number" value={shipment.code} />
        <DetailItem label="Invoice" value={invoice ? <Link className="text-primary underline-offset-2 hover:underline" to={invoicePath(invoice.id)}>{invoice.code}</Link> : null} />
        <DetailItem label="Created" value={formatDate(shipment.createdAt)} />
        <DetailItem label="Total cost" value={invoice ? invoice.total === null ? "Not available" : <span className="font-semibold">{formatMoney(invoice.total, invoice.currency)}</span> : null} />
        <DetailItem label="Purchase orders" value={invoice?.orders.join(", ")} />
        <DetailItem label="Invoice payment" value={invoice ? invoice.paidAt ? <Badge>Paid</Badge> : <Badge variant="outline">Not yet paid</Badge> : null} />
        <DetailItem label="Arrival approval" value={shipment.approved ? <Badge variant="secondary">Approved</Badge> : <Badge variant="outline">Awaiting approval</Badge>} />
        {kind === "shipment" ? <DetailItem label="Billing sheet" value={!shipment.hasBillingSheet ? "None yet" : shipment.billingSheetApproved ? <Badge variant="secondary">Approved</Badge> : <Badge variant="outline">Awaiting approval</Badge>} /> : null}
      </DetailGroup>
      {invoice ? <SupplierDetails supplier={invoice.supplier} /> : <p role="alert" className="text-sm">The invoice this delivery carries could not be read.</p>}
    </div>
    <ShipmentTimeline kind={kind} shipment={shipment} />
    {billing.sheet ? <BillingSheetSummary sheet={billing.sheet} invoiceTotal={invoice?.total ?? null} invoiceCurrency={invoice?.currency ?? null} />
      : billing.loading ? <p role="status" className="text-sm text-muted-foreground">Loading the billing sheet…</p>
      : billing.error ? <p role="alert" className="text-sm text-destructive">The billing sheet could not be loaded: {billing.error} <Button type="button" size="sm" variant="link" onClick={billing.retry}>Retry</Button></p> : null}
    {invoice ? <section className="space-y-2"><h2 className="text-sm font-semibold">Invoice items</h2><InvoiceLinesTable label="Materials on this delivery" lines={invoice.items} currency={invoice.currency} /></section> : null}
    <AttachmentList title="Shipping documents" files={shipment.attachments} />
    {advancing ? <AdvanceShipmentDialog kind={kind} shipment={shipment} onClose={() => setAdvancing(false)} /> : null}
  </article>;
}
