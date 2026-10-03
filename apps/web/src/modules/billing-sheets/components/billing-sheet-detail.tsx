import { useState } from "react";
import { Banknote, Pencil, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { invoicePath } from "@/modules/shipment-invoices/lib/invoice-access";
import { InvoiceLinesTable } from "@/modules/shipment-invoices/components/invoice-lines-table";
import { AttachmentList } from "@/shared/attachments/attachment-list";
import { ConfirmActionDialog } from "@/shared/actions";
import { useAccess } from "@/shared/auth/use-access";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { PrintButton } from "@/shared/print/print-button";
import { formatMoney } from "@/shared/procurement/price";
import { SupplierSummary } from "@/shared/procurement/supplier-summary";
import { useDeleteApiV1ProcurementBillingSheetByBillingSheetIdMutation } from "../api/billing-api";
import { audit, billingPermissions, billingSheetsPath, editBillingSheetPath } from "../lib/billing-access";
import { changeBlock, chargeTotals, deleteBlock, grandTotal, paymentBlock } from "../lib/billing-rules";
import type { BillingCharge, BillingSheet } from "../schemas/billing-schema";
import { AddChargesDialog } from "./add-charges-dialog";
import { CostSummary } from "./billing-summary";
import { BillingSheetPrint } from "./billing-sheet-print";
import { BillingSheetStatus, ChargeStateBadge } from "./billing-status";
import { PayChargesDialog } from "./pay-charges-dialog";

const charge = dataTableColumns<BillingCharge>();
const chargeColumns = charge.columns([
  charge.accessor("name", { header: "Charge", cell: ({ row }) => <span className="break-words font-medium">{row.original.name}</span> }),
  charge.accessor("amount", { header: "Amount", size: 200, cell: ({ row }) => row.original.currency ? formatMoney(row.original.amount, row.original.currency) : <span>{formatMoney(row.original.amount, null)} <span className="text-xs text-destructive">no currency</span></span> }),
  charge.display({ id: "state", header: "Payment", size: 240, cell: ({ row }) => <ChargeStateBadge charge={row.original} /> }),
]);
type Open = "pay" | "add" | "delete" | null;

/** One billing sheet: its container and free time, the charges and how far they are paid, and its papers. */
export function BillingSheetDetail({ sheet }: { sheet: BillingSheet }) {
  const { has } = useAccess();
  const navigate = useNavigate();
  const [open, setOpen] = useState<Open>(null);
  const [remove] = useDeleteApiV1ProcurementBillingSheetByBillingSheetIdMutation();
  const change = changeBlock(sheet);
  const payment = paymentBlock(sheet);
  const removal = deleteBlock(sheet);
  const totals = chargeTotals(sheet.charges);
  const invoiceCode = sheet.invoice?.code ?? sheet.invoiceCode;
  const grand = grandTotal(sheet.invoice?.total ?? null, sheet.invoice?.currency ?? null, sheet.charges);
  return <article className="min-w-0 space-y-4">
    <PageHeader title={sheet.code} crumbs={[{ label: "Billing sheets", to: billingSheetsPath }, { label: sheet.code }]} actions={<>
      <PrintButton preview={(close) => <BillingSheetPrint sheet={sheet} onClose={close} />} />
      {has(billingPermissions.remove) ? <Button type="button" size="sm" variant="outline" className="text-destructive" disabled={removal !== null} title={removal ?? undefined} onClick={() => setOpen("delete")}><Trash2 />Delete</Button> : null}
      {has(billingPermissions.edit) ? <Button asChild={change === null} type="button" size="sm" variant="outline" disabled={change !== null} title={change ?? undefined}>{change === null ? <Link to={editBillingSheetPath(sheet.id)}><Pencil />Edit</Link> : <><Pencil />Edit</>}</Button> : null}
      {has(billingPermissions.pay) ? <Button type="button" size="sm" disabled={payment !== null} title={payment ?? undefined} onClick={() => setOpen("pay")}><Banknote />Record payment</Button> : null}
    </>} />
    <BillingSheetStatus sheet={sheet} />
    {!sheet.approved ? <p role="status" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">This billing sheet is waiting for approval. Until it is approved it cannot be changed, its charges cannot be paid, and its shipment cannot be cleared.</p> : null}
    <KeyFacts>
      <KeyFact label="Total amount" value={grand ? formatMoney(grand.total, grand.currency) : "–"} note={grand ? "Invoice and charges" : "Invoice and charges are in different currencies"} />
      <KeyFact label="Invoice amount" value={sheet.invoice?.total === null || !sheet.invoice ? "Not available" : formatMoney(sheet.invoice.total, sheet.invoice.currency)} note={sheet.invoice ? `${sheet.invoice.items.length} ${sheet.invoice.items.length === 1 ? "item" : "items"}` : undefined} />
      <KeyFact label="Bill of lading" value={sheet.billOfLading ?? "–"} />
      <KeyFact label="Invoice" value={invoiceCode && sheet.invoiceId ? <Link className="text-primary underline-offset-2 hover:underline" to={invoicePath(sheet.invoiceId)}>{invoiceCode}</Link> : invoiceCode ?? "–"} />
      <KeyFact label="Expected arrival" value={formatDate(sheet.arrival) ?? "–"} />
      <KeyFact label="Free time ends" value={formatDate(sheet.freeTimeExpiry) ?? "–"} note={sheet.freeTimeDuration ? `${sheet.freeTimeDuration} free` : undefined} />
      <KeyFact label="Demurrage from" value={formatDate(sheet.demurrageStart) ?? "–"} />
      <KeyFact label="Container" value={sheet.containerNumber ?? "–"} />
      <KeyFact label="Packages" value={sheet.packages ?? "–"} note={sheet.packageStyle?.name} />
      <KeyFact label="Payment due" value={formatDate(sheet.dueDate) ?? "No due date"} note={sheet.dueDate ? undefined : "The orders' payment terms give none"} />
    </KeyFacts>
    {sheet.packageDescription ? <p className="text-sm"><span className="text-muted-foreground">Package description: </span>{sheet.packageDescription}</p> : null}
    {sheet.supplier ? <SupplierSummary supplier={sheet.supplier} /> : null}
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold">Charges ({sheet.charges.length})</h2>
        {has(billingPermissions.edit) ? <Button type="button" size="sm" variant="outline" disabled={change !== null} title={change ?? undefined} onClick={() => setOpen("add")}><Plus />Add charges</Button> : null}</div>
      <ClientDataTable label="Charges" columns={chargeColumns} rows={sheet.charges} getRowId={(row) => row.id} fill={false} emptyTitle="No charges on this sheet" />
      <dl className="ml-auto w-full max-w-sm space-y-1 rounded-md border p-3 text-sm">{totals.length === 0 ? <div className="text-muted-foreground">Nothing to pay.</div> : totals.map((item) => { const balance = sheet.balances.find((entry) => entry.currency === item.currency);
        return <div key={item.currency ?? "none"} className="flex justify-between gap-4"><dt className="text-muted-foreground">Total{item.currency ? ` (${item.currency})` : ""}</dt>
          <dd className="text-right font-semibold">{formatMoney(item.total, item.currency)}{balance ? <span className="block text-xs font-normal text-muted-foreground">{formatMoney(balance.paid, item.currency)} paid · {formatMoney(balance.outstanding, item.currency)} outstanding</span> : null}</dd></div>; })}</dl>
    </section>
    <div className="max-w-xl"><CostSummary invoiceTotal={sheet.invoice?.total ?? null} invoiceCurrency={sheet.invoice?.currency ?? null} charges={sheet.charges} /></div>
    {sheet.invoice ? <section className="space-y-2"><h2 className="text-sm font-semibold">Shipment invoice items</h2><InvoiceLinesTable label="Materials on the invoice" lines={sheet.invoice.items} currency={sheet.invoice.currency} /></section> : null}
    <AttachmentList title="Supporting documents" files={sheet.attachments} />
    {open === "pay" ? <PayChargesDialog sheet={sheet} onClose={() => setOpen(null)} /> : null}
    {open === "add" ? <AddChargesDialog sheet={sheet} onClose={() => setOpen(null)} /> : null}
    {open === "delete" ? <ConfirmActionDialog require={billingPermissions.remove} title={`Delete ${sheet.code}?`} description="The billing sheet and its charges are removed. Its shipment will need a new billing sheet before it can be cleared." confirmLabel="Delete billing sheet" busyLabel="Deleting…"
      onClose={() => setOpen(null)} onConfirm={async () => {
        const result = await remove({ ...audit, billingSheetId: sheet.id });
        if ("error" in result) return apiErrorMessage(result.error);
        toast.success(`${sheet.code} deleted`);
        void navigate(billingSheetsPath);
        return null;
      }} /> : null}
  </article>;
}
