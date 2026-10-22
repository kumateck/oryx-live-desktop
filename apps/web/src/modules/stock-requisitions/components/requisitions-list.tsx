import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { useAccess } from "@/shared/auth/use-access";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { Store, storeValue, stores } from "@/shared/inventory/stores";
import { WorkflowStoreLinks } from "@/shared/inventory/workflow-store-links";
import { workflowRule, type StoreWorkflow } from "@/shared/inventory/workflows";
import { usePageSearch } from "@/shared/search/page-search";
import { RequisitionStatus, statusLabel, stockRequisitionAudit, stockRequisitionPageSchema, type StockRequisition } from "../lib/stock-requisitions";
import { RequisitionEditor } from "./requisition-editor";

const column = dataTableColumns<StockRequisition>();
const ALL = "all";
export const statusVariant = (status: number) => status === RequisitionStatus.Completed ? "default" as const : status === RequisitionStatus.Partial ? "secondary" as const : "outline" as const;

/**
 * Stock requisitions of one store, for the people who raise them (`raise`) or issue against them (`issue`). The same list
 * serves both pages; only raising and where a row opens differ.
 */
export function StockRequisitionsList({ mode, root, detailPath }: { mode: "raise" | "issue"; root: string; detailPath: (id: string, store: Store) => string }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const store = storeValue(params.get("storeType")) ?? Store.General;
  const { can } = useAccess();
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("stock requisitions", busy);
  const [status, setStatus] = useState<string>(mode === "issue" ? String(RequisitionStatus.Pending) : ALL);
  const table = useServerTable({ pageSize: 50, resetKey: `${String(store)}|${search}|${status}` });
  const query = inventoryApi.useGetApiV1ItemsStockRequisitionsQuery({
    ...stockRequisitionAudit, store, page: table.page, pageSize: table.pageSize, ...(search ? { searchQuery: search } : {}),
    ...(status === ALL ? {} : { status: Number(status) as 0 | 1 | 2 }),
  }, { refetchOnMountOrArgChange: 30 });
  const parsed = useMemo(() => query.data ? stockRequisitionPageSchema.safeParse(query.data) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const [creating, setCreating] = useState(false);
  const workflows: StoreWorkflow[] = mode === "raise" ? ["stockRequisitions"] : ["issueStock"];
  const columns = useMemo(() => column.columns([
    column.accessor("number", { header: "Requisition", cell: ({ row }) => <span className="font-medium">{row.original.number}</span> }),
    column.accessor((row) => row.department?.name ?? "", { id: "department", header: "Department", cell: ({ row }) => row.original.department?.name ?? "–" }),
    column.accessor((row) => row.requestedBy?.name ?? "", { id: "requestedBy", header: "Requested by", cell: ({ row }) => row.original.requestedBy?.name ?? "–" }),
    column.accessor((row) => row.createdAt ?? "", { id: "raised", header: "Raised", size: 130, cell: ({ row }) => formatDate(row.original.createdAt) ?? "–" }),
    column.accessor((row) => row.lines.length, { id: "items", header: "Items", size: 90 }),
    column.accessor("status", { header: "Status", size: 140, cell: ({ row }) => <Badge variant={statusVariant(row.original.status)}>{statusLabel(row.original.status)}</Badge> }),
  ]), []);
  return <section className="page-fill">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">GENERAL STORES</p>
      <h1 className="text-xl font-semibold">{mode === "raise" ? "Stock requisitions" : "Issue stock"}</h1>
      <p className="text-sm text-muted-foreground">{mode === "raise" ? `Items requested from the ${(stores[store] ?? "store").toLowerCase()}.` : `Requisitions waiting for stock from the ${(stores[store] ?? "store").toLowerCase()}.`}</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Status" size="sm" className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent position="popper"><SelectItem value={ALL}>All statuses</SelectItem>
            {[RequisitionStatus.Pending, RequisitionStatus.Partial, RequisitionStatus.Completed].map((s) => <SelectItem key={s} value={String(s)}>{statusLabel(s)}</SelectItem>)}</SelectContent></Select>
        {mode === "raise" && can(workflowRule(store, "stockRequisitions", "create")) ? <Button type="button" size="sm" onClick={() => setCreating(true)}><Plus />Raise requisition</Button> : null}
      </div></header>
    <WorkflowStoreLinks root={root} store={store} workflows={workflows} />
    <ServerDataTable label={mode === "raise" ? "Stock requisitions" : "Requisitions to issue"} columns={columns} rows={rows} getRowId={(row) => row.id}
      page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      onRowOpen={(row) => void navigate(detailPath(row.id, store))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned requisitions the app could not read." : null}
      emptyTitle={search || status !== ALL ? "No requisitions match" : "No stock requisitions"} emptyDescription={search ? "Search by number or department." : undefined} />
    {creating ? <RequisitionEditor store={store} requisition={null} onClose={() => setCreating(false)} onSaved={(id) => { setCreating(false); if (id) void navigate(detailPath(id, store)); }} /> : null}
  </section>;
}
