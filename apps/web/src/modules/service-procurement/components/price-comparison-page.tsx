import { useMemo, useState } from "react";
import { Scale } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { servicesApi } from "@/shared/api/generated/services";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { jobOrderSchema, type JobOrder } from "@/shared/services/job-order";
import { amount, quotationPageSchema, serviceAudit, serviceKeys, servicePaths, type Quotation } from "../lib/service-procurement";

const QUOTATIONS_RECEIVED = 2;
const select = { kind: "all" as const, permissions: [serviceKeys.pricingView, serviceKeys.pricingApply] };
const column = dataTableColumns<JobOrder>();
const pageSchema = quotationPageSchema;
/** The fields a person compared; if any changed on the server, the choice is made again. */
const fingerprint = (q: Quotation) => [q.id, q.status, q.selected, q.total, q.days, q.completion].join("|");

function QuotationCard({ quotation }: { quotation: Quotation }) {
  return <label htmlFor={`quote-${quotation.id}`} className="flex cursor-pointer flex-col gap-3 rounded-lg border bg-card p-4 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:ring-2 has-[[data-state=checked]]:ring-primary/30">
    <div className="flex items-start gap-3"><RadioGroupItem id={`quote-${quotation.id}`} value={quotation.id} className="mt-1" />
      <div className="min-w-0 flex-1"><p className="font-semibold">{quotation.provider}</p>
        <p className="text-lg font-bold text-primary">{amount(quotation.total, quotation.currency)}</p>
        <p className="text-xs text-muted-foreground">{quotation.number ? `#${quotation.number} · ` : ""}{quotation.days} days · done by {formatDate(quotation.completion) ?? "–"}</p></div></div>
    <dl className="space-y-1 text-sm">
      {quotation.charges.map((c, i) => <div key={`${c.name}-${String(i)}`} className="flex justify-between gap-2"><dt className="text-muted-foreground">{c.name}</dt><dd>{amount(c.cost, quotation.currency)}</dd></div>)}
      {quotation.items.map((m) => <div key={m.id} className="flex justify-between gap-2"><dt className="text-muted-foreground">{m.name} ({m.quantity} {m.unit})</dt><dd>{amount(m.total, quotation.currency)}</dd></div>)}
    </dl>
    {quotation.notes ? <p className="whitespace-pre-wrap border-t pt-2 text-xs text-muted-foreground">{quotation.notes}</p> : null}
  </label>;
}

function CompareDialog({ order, onClose }: { order: JobOrder; onClose: () => void }) {
  const permission = usePermissionAction(select);
  const quotes = servicesApi.useGetApiV1ServiceQuotationsQuery({ ...serviceAudit, jobOrderId: order.id, page: 1, pageSize: 100 }, { refetchOnMountOrArgChange: true });
  const [readQuotes] = servicesApi.useLazyGetApiV1ServiceQuotationsQuery();
  const [readOrder] = servicesApi.useLazyGetApiV1JobOrdersByIdQuery();
  const [choose, choosing] = servicesApi.usePostApiV1JobOrdersSelectQuotationMutation();
  const parsed = useMemo(() => quotes.data ? pageSchema.safeParse(quotes.data) : null, [quotes.data]);
  const rows = useMemo(() => parsed?.success ? [...parsed.data.data].sort((a, b) => a.total - b.total) : [], [parsed]);
  const [chosen, setChosen] = useState("");
  const [confirming, setConfirming] = useState<{ quotation: Quotation; seen: string[] } | null>(null);
  const [message, setMessage] = useState("");
  const apply = async () => {
    if (!confirming) return;
    setMessage("");
    const denied = permission.check(); if (denied) { setMessage(denied); return; }
    const [freshOrder, freshQuotes] = await Promise.all([readOrder({ ...serviceAudit, id: order.id }, false), readQuotes({ ...serviceAudit, jobOrderId: order.id, page: 1, pageSize: 100 }, false)]);
    const current = freshOrder.data ? jobOrderSchema.safeParse(freshOrder.data) : null;
    const list = freshQuotes.data ? pageSchema.safeParse(freshQuotes.data) : null;
    if (!current?.success || !list?.success) { setMessage("The job order could not be checked again. Try again."); return; }
    if (current.data.status !== QUOTATIONS_RECEIVED) { setMessage("This job order is no longer waiting for a quotation to be chosen."); return; }
    if (list.data.data.map(fingerprint).sort().join(",") !== [...confirming.seen].sort().join(",")) { setMessage("The quotations changed after you opened them. Close this and compare them again."); return; }
    const result = await choose({ ...serviceAudit, domainEntitiesJobRequestsSelectQuotationRequest: { jobOrderId: order.id, quotationId: confirming.quotation.id } });
    if ("error" in result) { setMessage(apiErrorMessage(result.error)); return; }
    toast.success("Quotation selected", { description: `Next, request ${confirming.quotation.provider}'s proforma invoice under Service proforma requests. Approve it before raising a memo.` });
    onClose();
  };
  return <Dialog open onOpenChange={(open) => { if (!open && !choosing.isLoading) onClose(); }}>
    <DialogContent className="sm:max-w-5xl"><DialogHeader><DialogTitle>Compare quotations for {order.code ?? "the job order"}</DialogTitle>
      <DialogDescription>{order.service?.name ?? "Service"} · {rows.length} quotation{rows.length === 1 ? "" : "s"}, cheapest first.</DialogDescription></DialogHeader>
      <DialogBody className="space-y-3">
        {quotes.isLoading ? <p className="text-sm text-muted-foreground"><Spinner className="mr-2 inline" />Loading quotations…</p>
          : quotes.error || (parsed && !parsed.success) ? <p role="alert" className="text-sm text-destructive">{quotes.error ? apiErrorMessage(quotes.error) : "The server returned quotations the app could not read."}</p>
          : rows.length === 0 ? <p className="text-sm text-muted-foreground">No quotations have been recorded for this job order.</p>
          : <RadioGroup aria-label="Quotations" value={chosen} onValueChange={(v) => { setChosen(v); setConfirming(null); setMessage(""); }} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" disabled={choosing.isLoading}>
              {rows.map((q) => <QuotationCard key={q.id} quotation={q} />)}</RadioGroup>}
        {confirming ? <p className="rounded-md border border-primary/40 bg-primary/5 p-3 text-sm">Select {confirming.quotation.provider}'s quotation of {amount(confirming.quotation.total, confirming.quotation.currency)}? The other quotations are closed and cannot be chosen later.</p> : null}
        {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      </DialogBody>
      <DialogFooter><Button type="button" variant="outline" disabled={choosing.isLoading} onClick={confirming ? () => setConfirming(null) : onClose}>{confirming ? "Back" : "Cancel"}</Button>
        {confirming ? <Button type="button" disabled={choosing.isLoading} onClick={() => void apply()}>{choosing.isLoading ? <><Spinner />Selecting…</> : "Confirm selection"}</Button>
          : <Button type="button" disabled={!chosen || !permission.allowed} onClick={() => { const quotation = rows.find((q) => q.id === chosen); if (quotation) setConfirming({ quotation, seen: rows.map(fingerprint) }); }}>Select quotation</Button>}</DialogFooter>
    </DialogContent></Dialog>;
}

/** Job orders whose quotations are in, waiting for one to be chosen. */
export function ServicePriceComparisonPage() {
  const table = useServerTable({ pageSize: 50 });
  const query = servicesApi.useGetApiV1JobOrdersQuery({ ...serviceAudit, page: table.page, pageSize: table.pageSize, status: QUOTATIONS_RECEIVED }, { refetchOnMountOrArgChange: 30 });
  const rows = useMemo(() => (query.data?.data ?? []).flatMap((o) => { const p = jobOrderSchema.safeParse(o); return p.success ? [p.data] : []; }), [query.data]);
  const meta = pageMeta(query.data, table, rows.length);
  const [comparing, setComparing] = useState<JobOrder | null>(null);
  const columns = useMemo(() => column.columns([
    column.accessor((o) => o.code ?? "", { id: "code", header: "Job order", cell: ({ row }) => <Link className="font-medium underline-offset-4 hover:underline" to={`/extrals/job-orders/${row.original.id}/details`}>{row.original.code ?? "–"}</Link> }),
    column.accessor((o) => o.service?.name ?? "", { id: "service", header: "Service", cell: ({ row }) => row.original.service?.name ?? "–" }),
    column.accessor((o) => o.issuedDate ?? "", { id: "issued", header: "Issued", size: 120, cell: ({ row }) => formatDate(row.original.issuedDate) ?? "–" }),
    column.accessor((o) => o.quotations.length, { id: "quotes", header: "Quotations", size: 140, cell: ({ row }) => <Badge variant="outline">{row.original.quotations.length} of {row.original.serviceProviders.length} in</Badge> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.code ?? "job order"}`} items={[
      { id: "compare", label: "Compare and select", icon: Scale, require: { kind: "all", permissions: [serviceKeys.pricingView] }, onSelect: () => setComparing(row.original) }]} /> }),
  ]), []);
  return <section className="page-fill">
    <header><p className="eyebrow">SERVICES</p><h1 className="text-xl font-semibold">Service price comparison</h1>
      <p className="text-sm text-muted-foreground">Select a quotation, then request and approve its proforma invoice before raising a service memo.</p>
      <PermissionGuard require={serviceKeys.proformaRequestsView}>
        <Button asChild size="sm" variant="outline" className="mt-2"><Link to={servicePaths.proformas}>Service proforma requests</Link></Button>
      </PermissionGuard></header>
    <ServerDataTable label="Job orders awaiting a choice" columns={columns} rows={rows} getRowId={(o) => o.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      onRowOpen={setComparing} error={query.error ? apiErrorMessage(query.error) : null} emptyTitle="No job orders are waiting for a choice" />
    {comparing ? <CompareDialog order={comparing} onClose={() => setComparing(null)} /> : null}
  </section>;
}
