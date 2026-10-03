import { useEffect, useMemo, useState } from "react";
import { PackageCheck } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BatchBreakdown, amount } from "@/modules/stock-issue/components/batch-breakdown";
import { ConfirmActionDialog } from "@/shared/actions";
import { NoAccess } from "@/shared/auth/no-access";
import { useAccess } from "@/shared/auth/use-access";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { materialKindLabels } from "@/shared/reference-data/kind-tabs";
import { RichTextView, richTextToPlain } from "@/shared/rich-text/rich-text-view";
import { usePageSearch } from "@/shared/search/page-search";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useGetApiV1ProductionScheduleStockTransferBatchByStockTransferIdQuery, useGetApiV1ProductionScheduleStockTransferByStockTransferIdQuery, useGetApiV1ProductionScheduleStockTransferInBoundQuery,
  useGetApiV1ProductionScheduleStockTransferOutBoundQuery, usePutApiV1ProductionScheduleStockTransferIssueByStockTransferIdMutation } from "../transfer-api";
import { audit, issuePermissions, transferBatchesSchema, transferIssueBlock, transferPath, transferRowsSchema, transferSchema, transferStatus, transferStatusLabels, transfersPath, viewPermissions, type Transfer } from "../transfers";

function Standing({ status }: { status: number }) {
  return <Badge variant={status === transferStatus.issued ? "default" : status === transferStatus.rejected ? "destructive" : status === transferStatus.approved ? "secondary" : "outline"}>{transferStatusLabels[status] ?? "Unknown"}</Badge>;
}
type Direction = "in" | "out";
const directions: { value: Direction; label: string; hint: string }[] = [{ value: "in", label: "To supply", hint: "Other departments asking your store for stock." }, { value: "out", label: "Requested by us", hint: "Stock your department asked other stores for." }];
const stages = [{ value: transferStatus.approved, label: "Ready to issue" }, { value: transferStatus.issued, label: "Issued" }] as const;
const column = dataTableColumns<Transfer>();

/** Stock moving between departments' stores: what this store is asked to supply, and what it has asked for. */
export function TransferListPage() {
  const { has } = useAccess();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const direction: Direction = params.get("direction") === "out" ? "out" : "in";
  const stage = params.get("status") === String(transferStatus.issued) ? transferStatus.issued : transferStatus.approved;
  const set = (name: string, value: string) => setParams((current) => { const next = new URLSearchParams(current); next.set(name, value); return next; }, { replace: true });
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("stock transfers", busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${direction}|${stage}` });
  const arg = { ...audit, status: stage, page: table.page, pageSize: table.pageSize, searchQuery: search };
  const inbound = useGetApiV1ProductionScheduleStockTransferInBoundQuery(arg, { skip: direction !== "in" });
  const outbound = useGetApiV1ProductionScheduleStockTransferOutBoundQuery(arg, { skip: direction !== "out" });
  const query = direction === "in" ? inbound : outbound;
  const parsed = useMemo(() => query.data ? transferRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  // The server lists both kinds; a kind the user may not see is left out.
  const rows = useMemo(() => parsed?.success ? parsed.data.filter((row) => has(viewPermissions[row.kind]) || has(issuePermissions[row.kind])) : [], [parsed, has]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const columns = useMemo(() => column.columns([
    column.accessor("materialName", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.materialName}</div>
      <div className="text-xs text-muted-foreground">{[row.original.materialCode ?? "No code", `${materialKindLabels[row.original.kind]} material`].join(" · ")}</div></div> }),
    column.accessor((row) => (direction === "in" ? row.to : row.from) ?? "", { id: "department", header: direction === "in" ? "Asked for by" : "Supplied by", cell: ({ row }) => (direction === "in" ? row.original.to : row.original.from) ?? "–" }),
    column.accessor("quantity", { header: "Quantity", size: 140, cell: ({ row }) => amount(row.original.quantity, row.original.unit) }),
    column.accessor((row) => row.reason ?? "", { id: "reason", header: "Reason", cell: ({ row }) => { const reason = richTextToPlain(row.original.reason); return <span className="line-clamp-2 break-words" title={reason}>{reason || "–"}</span>; } }),
    column.accessor((row) => row.createdAt ?? "", { id: "requested", header: "Requested", size: 140, cell: ({ row }) => formatDate(row.original.createdAt) ?? "–" }),
    column.accessor("status", { header: "Status", size: 170, cell: ({ row }) => <Standing status={row.original.status} /> }),
  ]), [direction]);
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">WAREHOUSE</p><h1 className="text-xl font-semibold">Stock transfers</h1><p className="text-sm text-muted-foreground">{directions.find((item) => item.value === direction)?.hint}</p></div>
      <div className="flex flex-wrap gap-3">
        <div role="group" aria-label="Direction" className="flex gap-1">{directions.map((item) => <Button key={item.value} type="button" size="sm" variant={direction === item.value ? "default" : "outline"} aria-pressed={direction === item.value} onClick={() => set("direction", item.value)}>{item.label}</Button>)}</div>
        <div role="group" aria-label="Status" className="flex gap-1">{stages.map((item) => <Button key={item.value} type="button" size="sm" variant={stage === item.value ? "default" : "outline"} aria-pressed={stage === item.value} onClick={() => set("status", String(item.value))}>{item.label}</Button>)}</div>
      </div>
    </div>
    <ServerDataTable label="Stock transfers" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()} {...(direction === "in" ? { onRowOpen: (row: Transfer) => void navigate(transferPath(row.id)) } : {})}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned transfers the app could not read." : null}
      emptyTitle={search.trim() ? "No transfers match this search" : "No transfers here"} emptyDescription={search.trim() ? "Search by material name or code." : direction === "in" ? "Approved requests from other departments appear here." : "Transfers your department asked for appear here once approved."} />
  </section>;
}

function Detail({ id }: { id: string }) {
  const { has } = useAccess();
  const navigate = useNavigate();
  const query = useGetApiV1ProductionScheduleStockTransferByStockTransferIdQuery({ ...audit, stockTransferId: id });
  const batchQuery = useGetApiV1ProductionScheduleStockTransferBatchByStockTransferIdQuery({ ...audit, stockTransferId: id });
  const transfer = useMemo(() => { const parsed = transferSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  const batches = useMemo(() => { const parsed = transferBatchesSchema.safeParse(batchQuery.data ?? null); return parsed.success ? parsed.data : []; }, [batchQuery.data]);
  const [confirming, setConfirming] = useState(false);
  const [issue] = usePutApiV1ProductionScheduleStockTransferIssueByStockTransferIdMutation();
  if (query.isLoading || batchQuery.isLoading) return <DetailPageSkeleton label="Loading transfer" groups={4} />;
  if (!transfer) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Transfer unavailable</h1><p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned a transfer the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button><Button asChild size="sm"><Link to={transfersPath}>Stock transfers</Link></Button></div></div>;
  if (!has(viewPermissions[transfer.kind]) && !has(issuePermissions[transfer.kind])) return <NoAccess />;
  const block = batchQuery.error ? `The stock picked for this transfer could not be read: ${apiErrorMessage(batchQuery.error)}` : transferIssueBlock(transfer, batches);
  const open = transfer.status !== transferStatus.issued && transfer.status !== transferStatus.rejected;
  return <article className="min-w-0 space-y-4">
    <PageHeader title={`Transfer of ${transfer.materialName}`} crumbs={[{ label: "Stock transfers", to: transfersPath }, { label: transfer.materialName }]}
      actions={open && has(issuePermissions[transfer.kind]) ? <Button type="button" disabled={block !== null} onClick={() => setConfirming(true)}><PackageCheck />Issue stock</Button> : null} />
    <Standing status={transfer.status} />
    {open && block ? <p role="status" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">{block}</p> : null}
    <KeyFacts>
      <KeyFact label="Material" value={transfer.materialName} note={transfer.materialCode ?? "No code"} />
      <KeyFact label="Quantity" value={amount(transfer.quantity, transfer.unit)} />
      <KeyFact label="Asked for by" value={transfer.to ?? "–"} note={transfer.from ? `Supplied by ${transfer.from}` : undefined} />
      <KeyFact label="Requested" value={formatDateTime(transfer.createdAt) ?? "–"} />
      <KeyFact label="Approved" value={formatDateTime(transfer.approvedAt) ?? "Not yet"} note={transfer.issuedAt ? `Issued ${formatDateTime(transfer.issuedAt) ?? ""}` : undefined} />
    </KeyFacts>
    {transfer.reason ? <section className="space-y-1 rounded-lg border bg-card p-4"><h2 className="text-sm font-semibold">Reason</h2><RichTextView html={transfer.reason} className="text-sm" /></section> : null}
    <section className="space-y-2 rounded-lg border bg-card p-4"><h2 className="text-sm font-semibold">Issued from</h2><BatchBreakdown line={{ unit: transfer.unit, batches }} /></section>
    {confirming ? <ConfirmActionDialog require={issuePermissions[transfer.kind]} destructive={false} title={`Issue ${amount(transfer.quantity, transfer.unit)} of ${transfer.materialName}?`}
      description={`The batches shown leave your store for ${transfer.to ?? "the other department"}, where they wait to be put on shelves. This cannot be undone.`} confirmLabel="Issue stock" busyLabel="Issuing…" onClose={() => setConfirming(false)}
      onConfirm={async () => { const result = await issue({ ...audit, stockTransferId: transfer.id, body: batches.flatMap((batch) => batch.id ? [{ batchId: batch.id, quantity: batch.quantity }] : []) });
        if ("error" in result) return apiErrorMessage(result.error);
        toast.success("Transfer issued", { description: `${transfer.materialName} is on its way to ${transfer.to ?? "the other department"}.` });
        void navigate(transfersPath);
        return null; }} /> : null}
  </article>;
}
export function TransferDetailPage() {
  const { id } = useParams();
  return id ? <Detail key={id} id={id} /> : null;
}
