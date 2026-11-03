import { EditQuotationDialog, RecordQuotationDialog, type ProviderRow } from "./service-quotation-dialogs";
import { useMemo, useState } from "react";
import { FilePlus2, Pencil } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { servicesApi } from "@/shared/api/generated/services";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { amount, quotationPageSchema, quotationStatusLabel, serviceAudit, serviceKeys, type Quotation } from "../lib/service-procurement";

const providerColumn = dataTableColumns<ProviderRow>();
const quoteColumn = dataTableColumns<Quotation>();
const send = { kind: "all" as const, permissions: [serviceKeys.responsesView, serviceKeys.responseSend] };

/** Job orders waiting for providers' quotations, and the quotations recorded so far. */
export function ServiceQuoteResponsesPage() {
  const [view, setView] = useState<"waiting" | "recorded">("waiting");
  const table = useServerTable({ pageSize: 50, resetKey: view });
  const providers = servicesApi.useGetApiV1JobOrdersServiceProvidersQuery({ ...serviceAudit, page: table.page, pageSize: table.pageSize }, { skip: view !== "waiting", refetchOnMountOrArgChange: 30 });
  const quotations = servicesApi.useGetApiV1ServiceQuotationsQuery({ ...serviceAudit, page: table.page, pageSize: table.pageSize }, { skip: view !== "recorded", refetchOnMountOrArgChange: 30 });
  const providerRows = useMemo<ProviderRow[]>(() => (providers.data?.data ?? []).flatMap((p) => p.id && p.jobOrderId && p.serviceProvider?.id ? [{ id: p.id, jobOrderId: p.jobOrderId,
    providerId: p.serviceProvider.id, provider: p.serviceProvider.name ?? "Unnamed provider", sentAt: p.sentAt ?? null, responded: Boolean(p.responseReceived), respondedAt: p.responseDate ?? null }] : []), [providers.data]);
  const quoteRows = useMemo(() => { const parsed = quotations.data ? quotationPageSchema.safeParse(quotations.data) : null; return parsed?.success ? parsed.data.data : []; }, [quotations.data]);
  const [recording, setRecording] = useState<ProviderRow | null>(null);
  const [editing, setEditing] = useState<Quotation | null>(null);
  const providerColumns = useMemo(() => providerColumn.columns([
    providerColumn.accessor("provider", { header: "Service provider", cell: ({ row }) => <span className="font-medium">{row.original.provider}</span> }),
    providerColumn.accessor((r) => r.sentAt ?? "", { id: "sent", header: "Requested", size: 130, cell: ({ row }) => formatDate(row.original.sentAt) ?? "–" }),
    providerColumn.accessor("responded", { header: "Response", size: 170, cell: ({ row }) => row.original.responded ? <Badge>Received {formatDate(row.original.respondedAt) ?? ""}</Badge> : <Badge variant="outline">Waiting</Badge> }),
    providerColumn.display({ id: "order", header: "Job order", size: 140, cell: ({ row }) => <Link className="text-sm underline-offset-4 hover:underline" to={`/extrals/job-orders/${row.original.jobOrderId}/details`}>Open job order</Link> }),
    providerColumn.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => row.original.responded ? null : <TableMenu label={`Actions for ${row.original.provider}`} items={[
      { id: "record", label: "Record quotation", icon: FilePlus2, require: send, onSelect: () => setRecording(row.original) }]} /> }),
  ]), []);
  const quoteColumns = useMemo(() => quoteColumn.columns([
    quoteColumn.accessor("provider", { header: "Service provider", cell: ({ row }) => <span className="font-medium">{row.original.provider}</span> }),
    quoteColumn.accessor((q) => q.number ?? "", { id: "number", header: "Quotation", size: 140, cell: ({ row }) => row.original.number ?? "–" }),
    quoteColumn.accessor((q) => q.submitted ?? "", { id: "submitted", header: "Submitted", size: 120, cell: ({ row }) => formatDate(row.original.submitted) ?? "–" }),
    quoteColumn.accessor("total", { header: "Total", size: 140, cell: ({ row }) => amount(row.original.total, row.original.currency) }),
    quoteColumn.accessor("status", { header: "Status", size: 130, cell: ({ row }) => <Badge variant={row.original.selected ? "default" : "outline"}>{quotationStatusLabel(row.original.status)}</Badge> }),
    quoteColumn.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => row.original.jobOrderStatus === 2 && !row.original.selected
      ? <TableMenu label={`Actions for ${row.original.provider}`} items={[{ id: "edit", label: "Edit", icon: Pencil, require: send, onSelect: () => setEditing(row.original) }]} /> : null }),
  ]), []);
  const active = view === "waiting" ? providers : quotations;
  const meta = pageMeta(active.data, table, view === "waiting" ? providerRows.length : quoteRows.length);
  return <section className="page-fill">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">SERVICES</p><h1 className="text-xl font-semibold">Service quote responses</h1>
      <p className="text-sm text-muted-foreground">Quotations from the providers a job order was sent to.</p></div>
      <div className="flex gap-2" role="group" aria-label="View"><Button size="sm" variant={view === "waiting" ? "default" : "outline"} aria-pressed={view === "waiting"} onClick={() => setView("waiting")}>Providers asked</Button>
        <Button size="sm" variant={view === "recorded" ? "default" : "outline"} aria-pressed={view === "recorded"} onClick={() => setView("recorded")}>Recorded quotations</Button></div></header>
    {view === "waiting"
      ? <ServerDataTable label="Providers asked for quotations" columns={providerColumns} rows={providerRows} getRowId={(r) => r.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
          onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={providers.isLoading} onRetry={() => void providers.refetch()} error={providers.error ? apiErrorMessage(providers.error) : null} emptyTitle="No providers have been asked" />
      : <ServerDataTable label="Recorded quotations" columns={quoteColumns} rows={quoteRows} getRowId={(q) => q.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
          onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={quotations.isLoading} onRetry={() => void quotations.refetch()} error={quotations.error ? apiErrorMessage(quotations.error) : null} emptyTitle="No quotations recorded" />}
    {recording ? <RecordQuotationDialog row={recording} onClose={() => setRecording(null)} /> : null}
    {editing ? <EditQuotationDialog quotation={editing} onClose={() => setEditing(null)} /> : null}
  </section>;
}
