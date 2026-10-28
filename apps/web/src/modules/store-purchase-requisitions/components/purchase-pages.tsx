import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmActionDialog } from "@/shared/actions";
import { inventoryApi } from "@/shared/api/generated/inventory";
import { useAccess } from "@/shared/auth/use-access";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { Store, storeValue, stores } from "@/shared/inventory/stores";
import { WorkflowStoreLinks } from "@/shared/inventory/workflow-store-links";
import { storeWorkflowLink, workflowRule } from "@/shared/inventory/workflows";
import { PageHeader } from "@/shared/navigation/page-header";
import { usePageSearch } from "@/shared/search/page-search";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import {
  RequisitionStatus, lineSourced, lineStatusLabel, purchaseEditable, purchaseRequisitionAudit, purchaseRequisitionPageSchema, purchaseRequisitionRoot, purchaseRequisitionSchema,
  requisitionStatusLabel, samePurchaseRequisition, type PurchaseRequisition,
} from "../lib/purchase-requisitions";
import { PurchaseRequisitionEditor } from "./purchase-editor";

const column = dataTableColumns<PurchaseRequisition>();
const ALL = "all";
const detailPath = (id: string) => `${purchaseRequisitionRoot}/${id}/details`;

/** A store's purchase requisitions, newest first. */
export function PurchaseRequisitionsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const store = storeValue(params.get("storeType")) ?? Store.General;
  const { can } = useAccess();
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("purchase requisitions", busy);
  const [status, setStatus] = useState(ALL);
  const table = useServerTable({ pageSize: 50, resetKey: `${String(store)}|${search}|${status}` });
  const query = inventoryApi.useGetApiV1ProcurementInventoryQuery({ ...purchaseRequisitionAudit, store, page: table.page, pageSize: table.pageSize,
    ...(search ? { searchQuery: search } : {}), ...(status === ALL ? { anyStatus: true } : { status: Number(status) as 0 | 1 }) }, { refetchOnMountOrArgChange: 30 });
  const parsed = useMemo(() => query.data ? purchaseRequisitionPageSchema.safeParse(query.data) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const [creating, setCreating] = useState(false);
  const columns = useMemo(() => column.columns([
    column.accessor("code", { header: "Requisition", cell: ({ row }) => <span className="font-medium">{row.original.code}</span> }),
    column.accessor((r) => r.createdAt ?? "", { id: "raised", header: "Raised", size: 120, cell: ({ row }) => formatDate(row.original.createdAt) ?? "–" }),
    column.accessor((r) => r.expectedDelivery ?? "", { id: "delivery", header: "Expected delivery", size: 150, cell: ({ row }) => formatDate(row.original.expectedDelivery) ?? "–" }),
    column.accessor((r) => r.raisedBy ?? "", { id: "by", header: "Raised by", cell: ({ row }) => row.original.raisedBy ?? "–" }),
    column.accessor((r) => r.lines.length, { id: "items", header: "Items", size: 90 }),
    column.accessor("status", { header: "Status", size: 120, cell: ({ row }) => <Badge variant={row.original.status === RequisitionStatus.Complete ? "default" : "outline"}>{requisitionStatusLabel(row.original.status)}</Badge> }),
  ]), []);
  return <section className="page-fill">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">GENERAL STORES</p><h1 className="text-xl font-semibold">Purchase requisitions</h1>
      <p className="text-sm text-muted-foreground">What the {(stores[store] ?? "store").toLowerCase()} has asked Procurement to buy.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Status" size="sm" className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent position="popper"><SelectItem value={ALL}>All statuses</SelectItem><SelectItem value={String(RequisitionStatus.Pending)}>Pending</SelectItem><SelectItem value={String(RequisitionStatus.Complete)}>Sourced</SelectItem></SelectContent></Select>
        {can(workflowRule(store, "purchaseRequisitions", "create")) ? <Button type="button" size="sm" onClick={() => setCreating(true)}><Plus />Raise requisition</Button> : null}
      </div></header>
    <WorkflowStoreLinks root={purchaseRequisitionRoot} store={store} workflows={["purchaseRequisitions"]} />
    <ServerDataTable label="Purchase requisitions" columns={columns} rows={rows} getRowId={(r) => r.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      onRowOpen={(r) => void navigate(detailPath(r.id))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned requisitions the app could not read." : null}
      emptyTitle={search || status !== ALL ? "No requisitions match" : "No purchase requisitions"} emptyDescription={search ? "Search by requisition number." : undefined} />
    {creating ? <PurchaseRequisitionEditor store={store} requisition={null} onClose={() => setCreating(false)} onSaved={(id) => { setCreating(false); if (id) void navigate(detailPath(id)); }} /> : null}
  </section>;
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="text-sm">{children}</dd></div>;
}

/** One store purchase requisition, its items with their stock levels, and editing while nothing is sourced. */
export function PurchaseRequisitionDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { can } = useAccess();
  const query = inventoryApi.useGetApiV1ProcurementInventoryByIdQuery({ ...purchaseRequisitionAudit, id }, { skip: !id, refetchOnMountOrArgChange: true });
  const [reread] = inventoryApi.useLazyGetApiV1ProcurementInventoryByIdQuery();
  const [remove] = inventoryApi.useDeleteApiV1ProcurementInventoryByIdMutation();
  const parsed = useMemo(() => query.data ? purchaseRequisitionSchema.safeParse(query.data) : null, [query.data]);
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const crumbs = [{ label: "Purchase requisitions", to: purchaseRequisitionRoot }];
  if (query.isLoading) return <DetailPageSkeleton label="Loading purchase requisition" />;
  if (query.error || !parsed?.success) return <article className="space-y-4"><PageHeader title="Purchase requisition" crumbs={crumbs} />
    <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center"><h2 className="text-lg font-semibold">Requisition unavailable</h2>
      <p className="text-sm text-muted-foreground">{query.error ? apiErrorMessage(query.error) : "The server returned a requisition the app could not read."}</p>
      <Button size="sm" variant="outline" onClick={() => void query.refetch()}>Retry</Button></div></article>;
  const requisition = parsed.data;
  const store = requisition.store;
  const changeable = store !== null && purchaseEditable(requisition);
  const canEdit = changeable && can(workflowRule(store, "purchaseRequisitions", "edit"));
  const canDelete = changeable && can(workflowRule(store, "purchaseRequisitions", "delete"));
  return <article className="min-w-0 space-y-4">
    <PageHeader title={requisition.code} crumbs={[...crumbs, { label: requisition.code }]} actions={canEdit || canDelete ? <>
      {canEdit ? <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Pencil />Edit</Button> : null}
      {canDelete ? <Button size="sm" variant="outline" onClick={() => setRemoving(true)}><Trash2 />Delete</Button> : null}</> : undefined} />
    <section aria-label="Requisition" className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm text-muted-foreground">{store === null ? "No items" : stores[store]}</span>
        <Badge variant={requisition.status === RequisitionStatus.Complete ? "default" : "outline"}>{requisitionStatusLabel(requisition.status)}</Badge></div>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Fact label="Raised">{formatDate(requisition.createdAt) ?? "–"}</Fact><Fact label="Raised by">{requisition.raisedBy ?? "–"}</Fact>
        <Fact label="Expected delivery">{formatDate(requisition.expectedDelivery) ?? "–"}</Fact><Fact label="Items">{requisition.lines.length}</Fact></dl>
      <div><p className="text-xs text-muted-foreground">Remarks</p><p className="whitespace-pre-wrap text-sm">{requisition.remarks ?? "–"}</p></div>
    </section>
    <section aria-label="Requisition items" className="space-y-2 rounded-lg border bg-card p-4"><h2 className="font-semibold">Items</h2>
      <div className="max-w-full overflow-x-auto"><table className="w-full min-w-[48rem] text-left text-sm"><thead className="border-b text-xs text-muted-foreground"><tr>
        {["Item", "Code", "Requested", "On hand", "Reorder level", "Minimum", "Maximum", "Status"].map((h) => <th key={h} scope="col" className="p-2">{h}</th>)}</tr></thead>
        <tbody>{requisition.lines.map((line) => <tr key={line.id} className="border-b last:border-0"><td className="p-2 font-medium">{line.name}</td><td className="p-2 font-mono text-xs">{line.code}</td>
          <td className="p-2">{`${String(line.quantity)} ${line.unit}`.trim()}</td><td className="p-2">{line.available}</td><td className="p-2">{line.reorder}</td><td className="p-2">{line.minimum}</td><td className="p-2">{line.maximum}</td>
          <td className="p-2"><Badge variant={lineSourced(line.status) ? "default" : "outline"}>{lineStatusLabel(line.status)}</Badge></td></tr>)}</tbody></table></div>
    </section>
    {editing && store !== null ? <PurchaseRequisitionEditor store={store} requisition={requisition} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); void query.refetch(); }} /> : null}
    {removing && store !== null ? <ConfirmActionDialog require={workflowRule(store, "purchaseRequisitions", "delete")} title={`Delete ${requisition.code}?`}
      description="The requisition is withdrawn before Procurement sources any of it." confirmLabel="Delete requisition" busyLabel="Deleting…" onClose={() => setRemoving(false)}
      onConfirm={async () => {
        const fresh = await reread({ ...purchaseRequisitionAudit, id: requisition.id }, false);
        const current = fresh.data ? purchaseRequisitionSchema.safeParse(fresh.data) : null;
        if (!current?.success || !samePurchaseRequisition(requisition, current.data)) return "This requisition changed after you opened it. Close this and check it again.";
        const result = await remove({ ...purchaseRequisitionAudit, id: requisition.id }); if ("error" in result) return apiErrorMessage(result.error);
        toast.success("Purchase requisition deleted"); void navigate(storeWorkflowLink(purchaseRequisitionRoot, store)); return null;
      }} /> : null}
  </article>;
}
