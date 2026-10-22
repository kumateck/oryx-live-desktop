import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { servicesApi } from "@/shared/api/generated/services";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { jobOrderSchema, type JobOrder } from "@/shared/services/job-order";
import { OrderStatus, jobOrderAudit, jobOrderRoot, jobRequestRoot, orderStatusLabel } from "../lib/job-requests";

const pageSchema = z.object({ data: z.array(jobOrderSchema).nullish().transform((d) => d ?? []), pageIndex: z.number().optional(), pageCount: z.number().optional(), totalRecordCount: z.number().optional() });
const column = dataTableColumns<JobOrder>();
const ALL = "all";
const quoteStatus = ["Submitted", "Under review", "Negotiating", "Selected", "Rejected"];
const proformaStatus = ["Requested", "Response received", "Approved", "Rejected"];
const memoStatus = ["Draft", "Pending approval", "Approved", "Rejected", "Issued", "Completed", "Cancelled"];

/** Job orders sent to service providers. */
export function JobOrdersPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(ALL);
  const table = useServerTable({ pageSize: 50, resetKey: status });
  const query = servicesApi.useGetApiV1JobOrdersQuery({ ...jobOrderAudit, page: table.page, pageSize: table.pageSize, ...(status === ALL ? {} : { status: Number(status) as 0 }) }, { refetchOnMountOrArgChange: 30 });
  const parsed = useMemo(() => query.data ? pageSchema.safeParse(query.data) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  const columns = useMemo(() => column.columns([
    column.accessor((o) => o.code ?? "", { id: "code", header: "Job order", cell: ({ row }) => <span className="font-medium">{row.original.code ?? "–"}</span> }),
    column.accessor((o) => o.issuedDate ?? "", { id: "issued", header: "Issued", size: 120, cell: ({ row }) => formatDate(row.original.issuedDate) ?? "–" }),
    column.accessor((o) => o.issuedBy ?? "", { id: "by", header: "Issued by", cell: ({ row }) => row.original.issuedBy ?? "–" }),
    column.accessor((o) => o.service?.name ?? "", { id: "service", header: "Service", cell: ({ row }) => row.original.service?.name ?? "–" }),
    column.accessor((o) => o.serviceProviders.length, { id: "providers", header: "Providers", size: 100 }),
    column.accessor((o) => o.quotations.length, { id: "quotes", header: "Quotations", size: 110 }),
    column.accessor("status", { header: "Status", size: 170, cell: ({ row }) => <Badge variant="outline">{orderStatusLabel(row.original.status)}</Badge> }),
  ]), []);
  return <section className="page-fill">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">SERVICES</p><h1 className="text-xl font-semibold">Job orders</h1>
      <p className="text-sm text-muted-foreground">Job requests sent to service providers, from quotation to completion.</p></div>
      <Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Status" size="sm" className="w-48"><SelectValue /></SelectTrigger>
        <SelectContent position="popper"><SelectItem value={ALL}>All statuses</SelectItem>{Object.values(OrderStatus).map((s) => <SelectItem key={s} value={String(s)}>{orderStatusLabel(s)}</SelectItem>)}</SelectContent></Select></header>
    <ServerDataTable label="Job orders" columns={columns} rows={rows} getRowId={(o) => o.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      onRowOpen={(o) => void navigate(`${jobOrderRoot}/${o.id}/details`)}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned job orders the app could not read." : null}
      emptyTitle={status === ALL ? "No job orders" : "No job orders match"} />
  </section>;
}

/** One job order: the providers it went to, their quotations, and where it stands. */
export function JobOrderDetailPage() {
  const { id = "" } = useParams();
  const query = servicesApi.useGetApiV1JobOrdersByIdQuery({ ...jobOrderAudit, id }, { skip: !id, refetchOnMountOrArgChange: true });
  const parsed = useMemo(() => query.data ? jobOrderSchema.safeParse(query.data) : null, [query.data]);
  const crumbs = [{ label: "Job orders", to: jobOrderRoot }];
  if (query.isLoading) return <DetailPageSkeleton label="Loading job order" />;
  if (query.error || !parsed?.success) return <article className="space-y-4"><PageHeader title="Job order" crumbs={crumbs} />
    <p role="alert" className="text-sm text-destructive">{query.error ? apiErrorMessage(query.error) : "The server returned a job order the app could not read."}</p></article>;
  const order = parsed.data;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={order.code ?? "Job order"} crumbs={[...crumbs, { label: order.code ?? "Job order" }]} />
    <section aria-label="Job order" className="space-y-3 rounded-lg border bg-card p-4">
      <Badge variant="outline">{orderStatusLabel(order.status)}</Badge>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div><dt className="text-xs text-muted-foreground">Issued</dt><dd className="text-sm">{formatDate(order.issuedDate) ?? "–"}{order.issuedBy ? ` by ${order.issuedBy}` : ""}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Service</dt><dd className="text-sm">{order.service?.name ?? "–"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Job request</dt><dd className="text-sm">{order.jobRequestId ? <Link className="underline-offset-4 hover:underline" to={`${jobRequestRoot}/${order.jobRequestId}/details`}>Open job request</Link> : "–"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Signed</dt><dd className="text-sm">{order.issuedBySignature ? "Signature on file" : "No signature"}</dd></div>
      </dl>
      <p className="whitespace-pre-wrap text-sm">{order.description ?? "No description provided."}</p>
    </section>
    <section aria-label="Service providers" className="space-y-2 rounded-lg border bg-card p-4"><h2 className="font-semibold">Service providers</h2>
      <ul className="divide-y text-sm">{order.serviceProviders.map((p) => <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
        <div><div className="font-medium">{p.serviceProvider?.name ?? "Unnamed provider"}</div><div className="text-xs text-muted-foreground">{[p.serviceProvider?.phone, p.serviceProvider?.email].filter(Boolean).join(" · ") || "–"}</div></div>
        <span className="text-muted-foreground">Sent {formatDate(p.sentAt) ?? "–"} · {p.responseReceived ? `Answered ${formatDate(p.responseDate) ?? ""}` : "Waiting for a quotation"}</span></li>)}</ul></section>
    <section aria-label="Quotations" className="space-y-2 rounded-lg border bg-card p-4"><h2 className="font-semibold">Quotations</h2>
      {order.quotations.length === 0 ? <p className="text-sm text-muted-foreground">No quotations received yet.</p>
        : <div className="max-w-full overflow-x-auto"><table className="w-full min-w-[36rem] text-left text-sm"><thead className="border-b text-xs text-muted-foreground"><tr>
          {["Provider", "Quotation", "Total", "Completion", "Status"].map((h) => <th key={h} scope="col" className="p-2">{h}</th>)}</tr></thead>
          <tbody>{order.quotations.map((q) => <tr key={q.id} className="border-b last:border-0"><td className="p-2">{q.serviceProvider?.name ?? "–"}</td><td className="p-2">{q.quotationNumber ?? "–"}</td>
            <td className="p-2">{`${q.currency?.symbol ?? ""} ${(q.grandTotal ?? q.totalCost ?? 0).toFixed(2)}`.trim()}</td><td className="p-2">{formatDate(q.estimatedCompletionDate) ?? "–"}</td>
            <td className="p-2"><Badge variant={q.isSelected ? "default" : "outline"}>{quoteStatus[q.status] ?? "Unknown"}</Badge></td></tr>)}</tbody></table></div>}
    </section>
    {order.serviceProformaInvoice || order.serviceMemo ? <section aria-label="Proforma and memo" className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2">
      <div><p className="text-xs text-muted-foreground">Proforma invoice</p><p className="text-sm">{order.serviceProformaInvoice ? `${order.serviceProformaInvoice.invoiceNumber ?? "Requested"} · ${proformaStatus[order.serviceProformaInvoice.status] ?? "Unknown"}` : "Not requested"}</p></div>
      <div><p className="text-xs text-muted-foreground">Service memo</p><p className="text-sm">{order.serviceMemo ? `${order.serviceMemo.memoNumber ?? "Memo"} · ${memoStatus[order.serviceMemo.status] ?? "Unknown"}${order.serviceMemo.paid ? " · Paid" : ""}` : "Not created"}</p></div>
    </section> : null}
  </article>;
}
