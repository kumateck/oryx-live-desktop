import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Check, X } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BatchBreakdown, amount } from "@/modules/stock-issue/components/batch-breakdown";
import { ConfirmActionDialog } from "@/shared/actions";
import { api } from "@/shared/api/base-api";
import { warehouseApi } from "@/shared/api/generated/warehouse";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { useAccess } from "@/shared/auth/use-access";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDateTime } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { usePageSearch } from "@/shared/search/page-search";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { approveBlock, audit, decidePermissions, readDirection, swapPath, swapRowsSchema, swapSchema, swapStatusLabels, swapsPath, type Direction, type Swap } from "../swaps";

const tag = { type: "SwapRequests" as const, id: "all" };
const decided = (_result: unknown, error: unknown) => error ? [] : [tag, "StockOnShelves" as const, "StockIssue" as const, "Requisition" as const];
const { useGetApiV1WarehouseSwapQuery, useGetApiV1WarehouseSwapByIdQuery, usePutApiV1WarehouseSwapByIdApproveMutation } = warehouseApi.enhanceEndpoints({ endpoints: {
  getApiV1WarehouseSwap: { providesTags: [tag] }, getApiV1WarehouseSwapById: { providesTags: [tag] }, putApiV1WarehouseSwapByIdApprove: { invalidatesTags: decided } } });
/** The server's reject action is not in its published contract, so it is declared here. */
const { useRejectSwapMutation } = api.injectEndpoints({ endpoints: (build) => ({ rejectSwap: build.mutation<void, { id: string; module: string; subModule: string }>({
  query: ({ id, module, subModule }) => ({ url: `/api/v1/warehouse/swap/${id}/reject`, method: "PUT", headers: { Module: module, SubModule: subModule } }), invalidatesTags: decided }) }) });

function Standing({ status }: { status: number }) {
  return <Badge variant={status === 1 ? "default" : status === 2 ? "destructive" : "outline"}>{swapStatusLabels[status] ?? "Unknown"}</Badge>;
}
const directions: { value: Direction; label: string; hint: string }[] = [{ value: 0, label: "Asked of us", hint: "Other stores asking to swap batches with yours. These are yours to decide." }, { value: 1, label: "Asked by us", hint: "Swaps your store asked other stores for." }];
const column = dataTableColumns<Swap>();
const total = (list: Swap["giving"]) => list.reduce((sum, item) => sum + item.quantity, 0);

/** Requests to swap batches between stores, so that older stock is used first. */
export function SwapListPage() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const [params, setParams] = useSearchParams();
  const direction = readDirection(params.get("direction"));
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("swap requests", busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${direction}` });
  const departmentId = user?.departmentId ?? null;
  const query = useGetApiV1WarehouseSwapQuery({ ...audit, departmentId: departmentId ?? "", direction, page: table.page, pageSize: table.pageSize, ...(search.trim() ? { searchQuery: search } : {}) }, { skip: !departmentId });
  const parsed = useMemo(() => query.data ? swapRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  // Requests still to be decided come first.
  const rows = useMemo(() => parsed?.success ? [...parsed.data].sort((a, b) => Number(b.status === 0) - Number(a.status === 0)) : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const columns = useMemo(() => column.columns([
    column.accessor("materialName", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.materialName}</div><div className="text-xs text-muted-foreground">{row.original.materialCode ?? "No code"}</div></div> }),
    column.accessor((row) => (direction === 0 ? row.asking : row.asked) ?? "", { id: "store", header: direction === 0 ? "Asked by" : "Asked of", cell: ({ row }) => (direction === 0 ? row.original.asking : row.original.asked) ?? "–" }),
    column.display({ id: "quantity", header: "Quantity", size: 140, cell: ({ row }) => amount(total(row.original.taking), row.original.unit) }),
    column.display({ id: "batches", header: "Batches wanted", cell: ({ row }) => <BatchBreakdown line={{ unit: row.original.unit, batches: row.original.taking }} /> }),
    column.accessor("status", { header: "Status", size: 190, cell: ({ row }) => <Standing status={row.original.status} /> }),
  ]), [direction]);
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">WAREHOUSE</p><h1 className="text-xl font-semibold">Swap requests</h1><p className="text-sm text-muted-foreground">{directions[direction]?.hint}</p></div>
      <div role="group" aria-label="Direction" className="flex gap-1">{directions.map((item) => <Button key={item.value} type="button" size="sm" variant={direction === item.value ? "default" : "outline"} aria-pressed={direction === item.value}
        onClick={() => setParams((current) => { const next = new URLSearchParams(current); next.set("direction", String(item.value)); return next; }, { replace: true })}>{item.label}</Button>)}</div>
    </div>
    {departmentId ? <ServerDataTable label="Swap requests" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()} onRowOpen={(row) => void navigate(swapPath(row.id, direction))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned requests the app could not read." : null}
      emptyTitle={search.trim() ? "No requests match this search" : "No swap requests"} emptyDescription={search.trim() ? "Search by material or batch." : direction === 0 ? "Nobody has asked your store to swap batches." : "Your store has not asked for a swap."} />
      : <p role="alert" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">Your account has no department, so there is no store to list swaps for.</p>}
  </section>;
}

function Detail({ id }: { id: string }) {
  const { has } = useAccess();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const direction = readDirection(params.get("direction"));
  const query = useGetApiV1WarehouseSwapByIdQuery({ ...audit, id });
  const swap = useMemo(() => { const parsed = swapSchema.safeParse(query.data ?? null); return parsed.success ? parsed.data : null; }, [query.data]);
  const [deciding, setDeciding] = useState<"approve" | "reject" | null>(null);
  const [approve] = usePutApiV1WarehouseSwapByIdApproveMutation();
  const [reject] = useRejectSwapMutation();
  if (query.isLoading) return <DetailPageSkeleton label="Loading swap request" groups={3} />;
  if (!swap) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center">
    <h1 className="text-lg font-semibold">Swap request unavailable</h1><p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned a request the app could not read."}</p>
    <div className="flex justify-center gap-2"><Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button><Button asChild size="sm"><Link to={swapsPath}>Swap requests</Link></Button></div></div>;
  const back = `${swapsPath}?direction=${direction}`;
  const block = approveBlock(swap);
  // The store that is asked decides; the store that asked can only watch.
  const mayDecide = direction === 0 && swap.status === 0 && has(decidePermissions[swap.kind]);
  return <article className="min-w-0 space-y-4">
    <PageHeader title={`Swap of ${swap.materialName}`} crumbs={[{ label: "Swap requests", to: back }, { label: swap.materialName }]} actions={mayDecide ? <>
      <Button type="button" variant="outline" className="text-destructive" onClick={() => setDeciding("reject")}><X />Reject</Button>
      <Button type="button" disabled={block !== null} title={block ?? undefined} onClick={() => setDeciding("approve")}><Check />Approve</Button></> : null} />
    <Standing status={swap.status} />
    {mayDecide && block ? <p role="status" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">{block}</p> : null}
    <KeyFacts>
      <KeyFact label="Material" value={swap.materialName} note={swap.materialCode ?? "No code"} />
      <KeyFact label="Asked by" value={swap.asking ?? "–"} />
      <KeyFact label="Asked of" value={swap.asked ?? "–"} />
      <KeyFact label="Decided" value={swap.status === 0 ? "Not yet" : formatDateTime(swap.decidedAt) ?? "–"} note={swap.decidedBy ?? undefined} />
    </KeyFacts>
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-start">
      <section className="space-y-2 rounded-lg border bg-card p-4"><h2 className="text-sm font-semibold">{swap.asking ?? "The asking store"} gives up</h2><BatchBreakdown line={{ unit: swap.unit, batches: swap.giving }} />
        <p className="text-sm text-muted-foreground">{amount(total(swap.giving), swap.unit)} in all</p></section>
      <ArrowLeftRight aria-hidden="true" className="mx-auto mt-6 hidden size-5 text-muted-foreground lg:block" />
      <section className="space-y-2 rounded-lg border bg-card p-4"><h2 className="text-sm font-semibold">{swap.asked ?? "The other store"} gives in return</h2><BatchBreakdown line={{ unit: swap.unit, batches: swap.taking }} />
        <p className="text-sm text-muted-foreground">{amount(total(swap.taking), swap.unit)} in all</p></section>
    </div>
    {deciding ? <ConfirmActionDialog require={decidePermissions[swap.kind]} destructive={deciding === "reject"} title={deciding === "approve" ? "Approve this swap?" : "Reject this swap?"}
      description={deciding === "approve" ? `The batches change hands between ${swap.asking ?? "the asking store"} and ${swap.asked ?? "your store"} straight away. This cannot be undone.` : "The batches stay where they are and the request is closed."}
      confirmLabel={deciding === "approve" ? "Approve swap" : "Reject swap"} busyLabel="Saving…" onClose={() => setDeciding(null)} onConfirm={async () => {
        const result = deciding === "approve" ? await approve({ ...audit, id: swap.id }) : await reject({ ...audit, id: swap.id });
        if ("error" in result) return apiErrorMessage(result.error);
        toast.success(deciding === "approve" ? "Swap approved" : "Swap rejected");
        void navigate(back);
        return null; }} /> : null}
  </article>;
}
export function SwapDetailPage() {
  const { id } = useParams();
  return id ? <Detail key={id} id={id} /> : null;
}
