import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, PackageCheck, Paperclip, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { AttachmentList } from "@/shared/attachments/attachment-list";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { useAccess } from "@/shared/auth/use-access";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { FormWizard, type WizardField } from "@/shared/forms/form-wizard";
import { InputTypes } from "@/shared/forms/input-types";
import { PageHeader } from "@/shared/navigation/page-header";
import { PrintButton } from "@/shared/print/print-button";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintSignatures } from "@/shared/print/print-sheet";
import { formatMoney } from "@/shared/procurement/price";
import { usePageSearch } from "@/shared/search/page-search";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useAttachPurchaseOrderMutation, useGetApiV1ProductionOrdersAllocateByAllocateProductionOrderIdQuery, useGetApiV1ProductionOrdersProformaInvoiceByProformaInvoiceIdQuery, useGetApiV1ProductionOrdersProformaInvoiceQuery, useSendProformaInvoiceMutation } from "../api/dispatch-api";
import { dispatchPermissions, invoiceAudit, invoiceStatus, invoiceStatusLabels, invoicesPath, proformaInvoicePath, proformaPath, totalsByCurrency } from "../lib/dispatch";
import { allocationSchema, attachLimit, attachSchema, attachTypes, invoiceRowsSchema, invoiceSchema, type AttachValues, type ProformaInvoice } from "../schemas/dispatch-schema";
import { StepDialog } from "./allocation-pages";
import { CustomerPoDialog } from "./customer-po-dialog";
import { InvoiceLines } from "./invoice-lines";
import { PackingListTable } from "./packing-list-view";
import { usePricedLines } from "./use-priced-lines";

function Standing({ status }: { status: number }) {
  return <Badge variant={status === 2 ? "default" : status === 1 ? "secondary" : "outline"}>{invoiceStatusLabels[status]?.label ?? "Unknown"}</Badge>;
}
/** What an invoice comes to, priced for its customer. Each row prices itself, and a customer's agreements are read once. */
function TotalCell({ invoice }: { invoice: ProformaInvoice }) {
  const priced = usePricedLines(invoice.allocation, invoice, invoice.createdAt);
  if (priced.loading) return <span className="inline-block h-4 w-20 animate-pulse rounded bg-muted" />;
  if (priced.unavailable) return <span className="text-destructive">Pricing unavailable</span>;
  const totals = totalsByCurrency(priced.lines);
  return totals.length === 0 ? <span className="text-muted-foreground">–</span> : <span className="font-medium">{totals.map((total) => formatMoney(total.amount, total.currency)).join(" + ")}</span>;
}

const attachFields: WizardField<AttachValues>[] = [{ type: InputTypes.UPLOAD, name: "attachments", label: "Customer's purchase order", mode: "multiple", accept: attachTypes, maxSizeBytes: attachLimit, required: true, description: "PDF, image, Word or Excel, up to 10 MB each." }];
/** Attach evidence; PO verification and invoice issuance remain separate tasks. */
function AttachDialog({ invoice, onClose }: { invoice: ProformaInvoice; onClose: () => void }) {
  const permission = usePermissionAction(dispatchPermissions.sendProforma);
  const [attach, mutation] = useAttachPurchaseOrderMutation();
  const [message, setMessage] = useState("");
  const form = useForm<AttachValues>({ resolver: zodResolver(attachSchema), defaultValues: { attachments: [] } });
  void form.formState.errors;
  const busy = mutation.isLoading;
  const submit = form.handleSubmit(async (values) => {
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    setMessage("");
    const result = await attach({ ...invoiceAudit, id: invoice.id, files: values.attachments });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Purchase order attached", { description: "Verify the PO against the proforma before issuing the invoice." });
    onClose();
  });
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="sm:max-w-xl">
      <DialogHeader><DialogTitle>Attach purchase order · {invoice.code}</DialogTitle><DialogDescription>Attach the customer's PO as evidence. Verification and invoice issuance follow separately.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => { event.stopPropagation(); void submit(event); }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <DialogBody className="space-y-3"><FormWizard form={form} fields={attachFields} />{message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}</DialogBody>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? <><Spinner />Attaching…</> : "Attach"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

const column = dataTableColumns<ProformaInvoice>();
/** Proforma invoices, or only those that have become invoices. Both open the same record. */
export function InvoiceListPage({ invoicesOnly }: { invoicesOnly: boolean }) {
  const navigate = useNavigate();
  const [attaching, setAttaching] = useState<ProformaInvoice | null>(null);
  const [busy, setBusy] = useState(false);
  const title = invoicesOnly ? "Invoices" : "Proforma invoices";
  // Each list opens the record under its own address, so its own permission is the one that applies.
  const open = (id: string) => invoicesOnly ? `${invoicesPath}/${id}` : proformaInvoicePath(id);
  const search = usePageSearch(title.toLowerCase(), busy);
  const table = useServerTable({ pageSize: 50, resetKey: search });
  const query = useGetApiV1ProductionOrdersProformaInvoiceQuery({ ...invoiceAudit, page: table.page, pageSize: table.pageSize, ...(search.trim() ? { searchQuery: search } : {}), ...(invoicesOnly ? { proformaInvoiceStatus: invoiceStatus.invoice } : {}) });
  const parsed = useMemo(() => query.data ? invoiceRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const columns = useMemo(() => column.columns([
    column.accessor("code", { header: "Invoice number", size: 210, cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.code}</div><div className="text-xs text-muted-foreground">{formatDate(row.original.createdAt) ?? "Date not recorded"}</div></div> }),
    column.accessor((row) => row.allocation?.customer.name ?? "", { id: "customer", header: "Customer", cell: ({ row }) => <div className="min-w-0"><div className="break-words">{row.original.allocation?.customer.name ?? "–"}</div><div className="text-xs text-muted-foreground">Order {row.original.allocation?.orderCode ?? "–"}</div></div> }),
    column.display({ id: "total", header: "Total amount", size: 200, cell: ({ row }) => <TotalCell invoice={row.original} /> }),
    column.accessor("status", { header: "Status", size: 170, cell: ({ row }) => <Standing status={row.original.status} /> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.code}`} items={[
      { id: "view", label: "View", icon: Eye, to: open(row.original.id) },
      row.original.status === invoiceStatus.sent && { id: "attach", label: "Attach purchase order", icon: Paperclip, require: dispatchPermissions.sendProforma, onSelect: () => setAttaching(row.original) },
    ]} /> }),
  ]), [invoicesOnly]); // eslint-disable-line react-hooks/exhaustive-deps
  return <section className="page-fill">
    <div><p className="eyebrow">FG WAREHOUSE</p><h1 className="text-xl font-semibold">{title}</h1></div>
    <ServerDataTable label={title} columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()} onRowOpen={(row) => void navigate(open(row.id))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned invoices the app could not read." : null}
      emptyTitle={search.trim() ? "No invoices match this search" : `No ${title.toLowerCase()}`} emptyDescription={search.trim() ? "Search by invoice number." : invoicesOnly ? "An issued invoice is created against a verified and approved customer PO." : "A proforma invoice is generated from an approved allocation."} />
    {attaching ? <AttachDialog key={attaching.id} invoice={attaching} onClose={() => setAttaching(null)} /> : null}
  </section>;
}

function Detail({ invoice }: { invoice: ProformaInvoice }) {
  const { has } = useAccess();
  const [open, setOpen] = useState<"send" | "attach" | "load" | "verify" | "issue" | "void" | null>(null);
  const [send] = useSendProformaInvoiceMutation();
  // The list carries a shortened allocation; the full one has the batches each line was packed from.
  const allocationQuery = useGetApiV1ProductionOrdersAllocateByAllocateProductionOrderIdQuery({ ...invoiceAudit, allocateProductionOrderId: invoice.allocation?.id ?? "" }, { skip: !invoice.allocation?.id });
  const allocation = useMemo(() => { const parsed = allocationSchema.safeParse(allocationQuery.data ?? null); return parsed.success && parsed.data ? parsed.data : invoice.allocation; }, [allocationQuery.data, invoice.allocation]);
  const priced = usePricedLines(allocation, invoice, invoice.createdAt);
  const loading = priced.loading || allocationQuery.isFetching;
  const unavailable = priced.unavailable || Boolean(allocationQuery.error);
  const isInvoice = false;
  const name = isInvoice ? "Invoice" : "Proforma invoice";
  const customer = allocation?.customer ?? null;
  const first = allocation?.products[0] ?? null;
  const back = isInvoice ? invoicesPath : proformaPath;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={`${name} ${invoice.code}`} crumbs={[{ label: isInvoice ? "Invoices" : "Proforma invoices", to: back }, { label: invoice.code }]} actions={<>
      <PrintButton preview={(close) => <PrintPreviewDialog title={`${name} · ${invoice.code}`} ready={!loading && !unavailable} note={unavailable ? "Prices could not be checked, so this document cannot be printed." : null} onClose={close}>
        <PrintHeader title={name} reference={invoice.code} />
        <PrintFacts facts={[{ label: "Bill to", value: customer?.name }, { label: "Address", value: customer?.address }, { label: "Email", value: customer?.email }, { label: "Phone", value: customer?.phone },
          { label: "Invoice date", value: formatDate(invoice.createdAt) }, { label: "Production order", value: allocation?.orderCode }]} />
        <InvoiceLines lines={priced.lines} loading={loading} unavailable={unavailable} print />
        <PrintSignatures roles={["Prepared by", "Approved by"]} />
      </PrintPreviewDialog>} />
      {/* Loading does not wait for the customer's purchase order: it can be marked before or after it is attached. */}
      {allocation?.approved && !allocation.loadedAt && has(dispatchPermissions.load) ? <Button type="button" size="sm" variant="outline" onClick={() => setOpen("load")}><PackageCheck />Record loading</Button> : null}
      {invoice.status === invoiceStatus.sent && has(dispatchPermissions.sendProforma) ? <Button type="button" size="sm" variant="outline" onClick={() => setOpen("attach")}><Paperclip />Attach purchase order</Button> : null}
      {invoice.status === invoiceStatus.pending && has(dispatchPermissions.sendProforma) ? <Button type="button" size="sm" disabled={loading || unavailable} title={unavailable ? "Prices could not be checked." : undefined} onClick={() => setOpen("send")}><Send />Send to customer</Button> : null}
    </>} />
    <div className="flex flex-wrap gap-2">
      {!invoice.customerPoVerifiedAt && invoice.status !== 0 && has("CanVerifyFinishedGoodsCustomerPo") ? <Button size="sm" variant="outline" onClick={() => setOpen("verify")}>Verify customer PO</Button> : null}
      {invoice.customerPoVerifiedAt && invoice.approved && !invoice.issuedInvoiceId && has("CanCreateInvoice") ? <Button size="sm" onClick={() => setOpen("issue")}>Issue invoice</Button> : null}
      {invoice.issuedInvoiceId && has("CanVoidFinishedGoodsInvoice") ? <Button size="sm" variant="outline" onClick={() => setOpen("void")}>Void invoice</Button> : null}
    </div>
    {invoice.customerPoVerifiedAt && !invoice.approved ? <p role="status" className="text-sm text-muted-foreground">Customer PO verified. Complete the configured invoice approval before issuing the invoice.</p> : null}
    {invoice.customerPoVerifiedAt && invoice.status === 2 && !invoice.issuedInvoiceId ? <p role="status" className="text-sm text-muted-foreground">The previous invoice is voided. Its history is retained; Finance can issue a replacement against this verified PO.</p> : null}
    <DetailGroup title="Customer PO and issued invoice"><DetailItem label="PO number" value={invoice.customerPoNumber} /><DetailItem label="PO verified" value={formatDateTime(invoice.customerPoVerifiedAt)} />
      <DetailItem label="Issued invoice" value={invoice.issuedInvoiceCode} /><DetailItem label="Issued" value={formatDateTime(invoice.invoiceIssuedAt)} /></DetailGroup>
    {open === "verify" || open === "issue" || open === "void" ? <CustomerPoDialog invoice={invoice} action={open} onClose={() => setOpen(null)} /> : null}
    <div className="flex flex-wrap items-center gap-2"><Standing status={invoice.status} /><span className="text-sm text-muted-foreground">{invoiceStatusLabels[invoice.status]?.note ?? ""}</span></div>
    <KeyFacts>
      <KeyFact label="Invoice date" value={formatDateTime(invoice.createdAt) ?? "–"} />
      <KeyFact label="Production order" value={allocation?.orderId ? <Link className="text-primary underline-offset-2 hover:underline" to={`/crm/production-order/${allocation.orderId}`}>{allocation.orderCode ?? "Open"}</Link> : allocation?.orderCode ?? "–"} />
      <KeyFact label="Created by" value={invoice.createdBy ?? "–"} />
      <KeyFact label="Loaded" value={formatDate(allocation?.loadedAt) ?? "Not yet"} />
    </KeyFacts>
    <div className="grid gap-3 lg:grid-cols-2">
      <DetailGroup title="Customer"><DetailItem label="Company" value={customer?.name} /><DetailItem label="Email" value={customer?.email} /><DetailItem label="Phone" value={customer?.phone} /><DetailItem label="Address" value={customer?.address} /></DetailGroup>
      <DetailGroup title="Production details"><DetailItem label="Department" value={first?.department} /><DetailItem label="Equipment" value={first?.equipment} /><DetailItem label="Storage" value={first?.storage} /></DetailGroup>
    </div>
    <section className="space-y-2"><h2 className="text-sm font-semibold">Products</h2><InvoiceLines lines={priced.lines} loading={loading} unavailable={unavailable} /></section>
    {allocation ? <section className="space-y-2"><h2 className="text-sm font-semibold">Packing list</h2><PackingListTable allocation={allocation} /></section> : null}
    <AttachmentList title="Customer purchase order" files={invoice.attachments} empty="No purchase order attached yet." />
    {open === "load" && allocation ? <StepDialog step="load" allocation={allocation} onClose={() => setOpen(null)} /> : null}
    {open === "attach" ? <AttachDialog invoice={invoice} onClose={() => setOpen(null)} /> : null}
    {open === "send" ? <ConfirmActionDialog require={dispatchPermissions.sendProforma} destructive={false} title={`Send ${invoice.code} to ${customer?.name ?? "the customer"}?`} description={`Record the proforma as sent to ${customer?.email ?? "the customer's address on record"} at the prices shown. Confirm it has been provided to the customer.`}
      confirmLabel="Send to customer" busyLabel="Sending…" onClose={() => setOpen(null)} onConfirm={async () => { const result = await send({ ...invoiceAudit, id: invoice.id }); if ("error" in result) return apiErrorMessage(result.error); toast.success(`${invoice.code} sent to the customer`); return null; }} /> : null}
  </article>;
}

/** One proforma invoice or invoice: the customer, the priced lines, what was packed, and the customer's purchase order. */
export function InvoiceDetailPage() {
  const { id = "" } = useParams();
  const query = useGetApiV1ProductionOrdersProformaInvoiceByProformaInvoiceIdQuery({ ...invoiceAudit, proformaInvoiceId: id }, { skip: !id });
  const invoice = useMemo(() => { const parsed = invoiceSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  if (query.isLoading) return <DetailPageSkeleton label="Loading invoice" groups={3} />;
  if (!invoice) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Invoice unavailable</h1><p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned an invoice the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button><Button asChild size="sm"><Link to={proformaPath}>Proforma invoices</Link></Button></div></div>;
  return <Detail invoice={invoice} />;
}
