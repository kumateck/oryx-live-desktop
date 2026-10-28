import { useEffect, useMemo, useState } from "react";
import { PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { BatchBreakdown, amount } from "@/modules/stock-issue/components/batch-breakdown";
import { ConfirmActionDialog, TableMenu, TableMenuHeader } from "@/shared/actions";
import { productionApi } from "@/shared/api/generated/production";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { KindSwitch } from "@/shared/reference-data/kind-switch";
import { useKindTabs, type MaterialKind } from "@/shared/reference-data/kind-tabs";
import { usePageSearch } from "@/shared/search/page-search";
import { audit, extraIssueBlock, extraRowsSchema, issueBody, type ExtraMaterial } from "../extra-material";
import { addTags } from "@/shared/api/add-tags";

const list = { type: "StockIssue" as const, id: "extra" };
const { useGetApiV1ProductionScheduleExtraPackingQuery, usePostApiV1ProductionScheduleExtraPackingApproveByProductionExtraPackingIdMutation } = productionApi.enhanceEndpoints({ endpoints: {
  getApiV1ProductionScheduleExtraPacking: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
  postApiV1ProductionScheduleExtraPackingApproveByProductionExtraPackingId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [list, "StockOnShelves", "ActivityBoard"]); } } });
const issuePermissions: Record<MaterialKind, string> = { 0: "CanIssueRawMaterialRequisitions", 1: "CanIssuePackagingMaterialRequisitions" };
const column = dataTableColumns<ExtraMaterial>();

/** Extra material asked for by production after a batch has started, waiting to be issued from the store. */
export function ExtraMaterialPage() {
  const { kind, select, tabs } = useKindTabs(issuePermissions);
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("extra material requisitions", busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${kind}` });
  const query = useGetApiV1ProductionScheduleExtraPackingQuery({ ...audit, kind: kind ?? 0, page: table.page, pageSize: table.pageSize, searchQuery: search }, { skip: kind === null });
  const parsed = useMemo(() => query.data ? extraRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const [issuing, setIssuing] = useState<ExtraMaterial | null>(null);
  const [issue] = usePostApiV1ProductionScheduleExtraPackingApproveByProductionExtraPackingIdMutation();
  const columns = useMemo(() => column.columns([
    column.accessor("materialName", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.materialName}</div><div className="text-xs text-muted-foreground">{row.original.materialCode ?? "No code"}</div></div> }),
    column.accessor((row) => row.product ?? "", { id: "product", header: "For", cell: ({ row }) => <div className="min-w-0"><div className="break-words">{row.original.product ?? "–"}</div>
      <div className="break-words text-xs text-muted-foreground">{[row.original.schedule, row.original.batch ? `Batch ${row.original.batch}` : null].filter(Boolean).join(" · ") || "No schedule"}</div></div> }),
    column.accessor((row) => row.createdAt ?? "", { id: "requested", header: "Requested", size: 170, cell: ({ row }) => <div><div>{formatDate(row.original.createdAt) ?? "–"}</div><div className="text-xs text-muted-foreground">{row.original.requestedBy ?? ""}</div></div> }),
    column.accessor("quantity", { header: "Quantity", size: 140, cell: ({ row }) => amount(row.original.quantity, row.original.unit) }),
    column.display({ id: "batches", header: "Issued from", cell: ({ row }) => <BatchBreakdown line={row.original} /> }),
    column.accessor("approved", { header: "Approval", size: 160, cell: ({ row }) => row.original.approved ? <Badge variant="secondary">Approved</Badge> : <Badge variant="outline">Awaiting approval</Badge> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => { const block = extraIssueBlock(row.original);
      return <TableMenu label={`Actions for ${row.original.materialName}`} items={[{ id: "issue", label: "Issue", icon: PackageCheck, onSelect: () => setIssuing(row.original), ...(block ? { disabled: true, disabledReason: block } : {}) }]} />; } }),
  ]), []);
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">WAREHOUSE</p><h1 className="text-xl font-semibold">Extra material requisitions</h1></div>
      <KindSwitch tabs={tabs} kind={kind} onSelect={select} />
    </div>
    <ServerDataTable label="Extra material requisitions" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()} error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned requests the app could not read." : null}
      emptyTitle={search.trim() ? "Nothing matches this search" : "No extra material to issue"} emptyDescription={search.trim() ? "Search by material name or code." : "Requests appear here when production asks for more material on a batch already under way."} />
    {issuing ? <ConfirmActionDialog require={issuePermissions[kind ?? 0]} destructive={false} title={`Issue ${amount(issuing.quantity, issuing.unit)} of ${issuing.materialName}?`}
      description={`It leaves the store for ${issuing.product ?? "production"}${issuing.batch ? `, batch ${issuing.batch}` : ""}, from ${issuing.batches.length === 1 ? "the batch" : `the ${issuing.batches.length} batches`} shown. This cannot be undone.`}
      confirmLabel="Issue material" busyLabel="Issuing…" onClose={() => setIssuing(null)} onConfirm={async () => {
        const result = await issue({ ...audit, productionExtraPackingId: issuing.id, body: issueBody(issuing) });
        if ("error" in result) return apiErrorMessage(result.error);
        toast.success(`${issuing.materialName} issued`);
        return null; }} /> : null}
  </section>;
}
