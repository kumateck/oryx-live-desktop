import { useMemo, useState } from "react";
import { CheckCircle2, FileInput, Send } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { servicesApi } from "@/shared/api/generated/services";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { ProformaStatus, amount, proformaPageSchema, proformaStatusLabel, quotationPageSchema, serviceAudit, type Proforma, type Quotation } from "../lib/service-procurement";
import { ApproveProformaDialog, RequestProformaDialog, RespondProformaDialog, proformaRules } from "./proforma-dialogs";

type View = "request" | "requested" | "received" | "approved";
const views: { id: View; label: string }[] = [
  { id: "request", label: "To request" }, { id: "requested", label: "Awaiting response" }, { id: "received", label: "Received" }, { id: "approved", label: "Approved" },
];
const statusOf = { requested: ProformaStatus.Requested, received: ProformaStatus.Received, approved: ProformaStatus.Approved } as const satisfies Record<Exclude<View, "request">, number>;
const QUOTATION_SELECTED = 3;
const quoteColumn = dataTableColumns<Quotation>();
const proformaColumn = dataTableColumns<Proforma>();
const orderLink = (id: string, label: string) => id ? <Link className="underline-offset-4 hover:underline" to={`/extrals/job-orders/${id}/details`}>{label}</Link> : label;

/** Proforma invoices for selected service quotations: request, record the response, approve. */
export function ServiceProformaPage() {
  const [view, setView] = useState<View>("request");
  const table = useServerTable({ pageSize: 50, resetKey: view });
  const quotes = servicesApi.useGetApiV1ServiceQuotationsQuery({ ...serviceAudit, page: table.page, pageSize: table.pageSize, jobOrderStatus: QUOTATION_SELECTED, status: QUOTATION_SELECTED },
    { skip: view !== "request", refetchOnMountOrArgChange: 30 });
  const proformas = servicesApi.useGetApiV1ServiceProformaInvoicesQuery({ ...serviceAudit, page: table.page, pageSize: table.pageSize, status: view === "request" ? 0 : statusOf[view] },
    { skip: view === "request", refetchOnMountOrArgChange: 30 });
  const quoteRows = useMemo(() => { const p = quotes.data ? quotationPageSchema.safeParse(quotes.data) : null; return p?.success ? p.data.data.filter((q) => q.selected) : []; }, [quotes.data]);
  const proformaRows = useMemo(() => { const p = proformas.data ? proformaPageSchema.safeParse(proformas.data) : null; return p?.success ? p.data.data : []; }, [proformas.data]);
  const [requesting, setRequesting] = useState<Quotation | null>(null);
  const [responding, setResponding] = useState<Proforma | null>(null);
  const [approving, setApproving] = useState<Proforma | null>(null);
  const quoteColumns = useMemo(() => quoteColumn.columns([
    quoteColumn.accessor("provider", { header: "Service provider", cell: ({ row }) => <span className="font-medium">{row.original.provider}</span> }),
    quoteColumn.accessor((q) => q.service ?? "", { id: "service", header: "Service", cell: ({ row }) => row.original.service ?? "–" }),
    quoteColumn.accessor((q) => q.number ?? "", { id: "number", header: "Quotation", size: 140, cell: ({ row }) => row.original.number ?? "–" }),
    quoteColumn.accessor("total", { header: "Total", size: 140, cell: ({ row }) => amount(row.original.total, row.original.currency) }),
    quoteColumn.accessor((q) => q.completion ?? "", { id: "completion", header: "Completion", size: 120, cell: ({ row }) => formatDate(row.original.completion) ?? "–" }),
    quoteColumn.display({ id: "order", header: "Job order", size: 120, cell: ({ row }) => orderLink(row.original.jobOrderId, "Open") }),
    quoteColumn.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.provider}`} items={[
      { id: "request", label: "Request proforma", icon: Send, require: proformaRules.request, onSelect: () => setRequesting(row.original) }]} /> }),
  ]), []);
  const proformaColumns = useMemo(() => proformaColumn.columns([
    proformaColumn.accessor("provider", { header: "Service provider", cell: ({ row }) => <span className="font-medium">{row.original.provider}</span> }),
    proformaColumn.accessor("jobOrder", { header: "Job order", size: 140, cell: ({ row }) => orderLink(row.original.jobOrderId, row.original.jobOrder) }),
    proformaColumn.accessor((p) => p.invoice ?? "", { id: "invoice", header: "Invoice", size: 140, cell: ({ row }) => row.original.invoice ?? "–" }),
    proformaColumn.accessor((p) => p.requested ?? "", { id: "requested", header: "Requested", size: 120, cell: ({ row }) => formatDate(row.original.requested) ?? "–" }),
    proformaColumn.accessor((p) => p.responded ?? "", { id: "responded", header: "Received", size: 120, cell: ({ row }) => formatDate(row.original.responded) ?? "–" }),
    proformaColumn.accessor("total", { header: "Total", size: 140, cell: ({ row }) => amount(row.original.total, row.original.currency) }),
    proformaColumn.accessor("status", { header: "Status", size: 150, cell: ({ row }) => <Badge variant="outline">{proformaStatusLabel(row.original.status)}</Badge> }),
    proformaColumn.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => {
      const p = row.original;
      if (p.status === ProformaStatus.Requested) return <TableMenu label={`Actions for ${p.provider}`} items={[{ id: "respond", label: "Record response", icon: FileInput, require: proformaRules.respond, onSelect: () => setResponding(p) }]} />;
      if (p.status === ProformaStatus.Received) return <TableMenu label={`Actions for ${p.provider}`} items={[{ id: "approve", label: "Approve", icon: CheckCircle2, require: proformaRules.approve, onSelect: () => setApproving(p) }]} />;
      return null;
    } }),
  ]), []);
  const active = view === "request" ? quotes : proformas;
  const meta = pageMeta(active.data, table, view === "request" ? quoteRows.length : proformaRows.length);
  const shared = { getRowId: (r: { id: string }) => r.id, page: table.page, pageSize: table.pageSize, totalRows: meta.totalRows, onPageChange: table.onPageChange, onPageSizeChange: table.onPageSizeChange,
    loading: active.isLoading, refreshing: active.isFetching && !active.isLoading, onRetry: () => void active.refetch(), error: active.error ? apiErrorMessage(active.error) : null };
  return <section className="page-fill">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">SERVICES</p><h1 className="text-xl font-semibold">Service proforma requests</h1>
      <p className="text-sm text-muted-foreground">Ask the chosen provider for a proforma invoice, record it when it arrives, and approve it.</p></div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="View">{views.map((v) => <Button key={v.id} size="sm" variant={view === v.id ? "default" : "outline"} aria-pressed={view === v.id} onClick={() => setView(v.id)}>{v.label}</Button>)}</div></header>
    {view === "request"
      ? <ServerDataTable label="Selected quotations" columns={quoteColumns} rows={quoteRows} {...shared} emptyTitle="No selected quotations need a proforma" />
      : <ServerDataTable label={`Proformas ${views.find((v) => v.id === view)?.label.toLowerCase() ?? ""}`} columns={proformaColumns} rows={proformaRows} {...shared} emptyTitle="No proforma invoices here" />}
    {requesting ? <RequestProformaDialog quotation={requesting} onClose={() => setRequesting(null)} /> : null}
    {responding ? <RespondProformaDialog proforma={responding} onClose={() => setResponding(null)} /> : null}
    {approving ? <ApproveProformaDialog proforma={approving} onClose={() => setApproving(null)} /> : null}
  </section>;
}
