import { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { PlaceStockDialog } from "@/modules/distributed-area/components/shelve-stock-dialog";
import { shelvePermissions } from "@/modules/distributed-area/lib/distributed-access";
import { batchNumber } from "@/modules/stock-issue/lib/stock-issue";
import { amount } from "@/modules/stock-issue/components/batch-breakdown";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatMonthYear } from "@/shared/format/dates";
import { KindSwitch } from "@/shared/reference-data/kind-switch";
import { useKindTabs } from "@/shared/reference-data/kind-tabs";
import { usePageSearch } from "@/shared/search/page-search";
import { useGetApiV1MaterialHoldingQuery, useShelveHeldStockMutation } from "../transfer-api";
import { audit, holdingRowsSchema, viewPermissions, type HeldStock } from "../transfers";

const column = dataTableColumns<HeldStock>();

/** Stock issued to this department by transfer, waiting to be put on shelves. */
export function TransferAllocationPage() {
  const { kind, select, tabs } = useKindTabs(viewPermissions);
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("transferred stock", busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${kind}` });
  const query = useGetApiV1MaterialHoldingQuery({ ...audit, kind: kind ?? 0, page: table.page, pageSize: table.pageSize, searchQuery: search }, { skip: kind === null });
  const parsed = useMemo(() => query.data ? holdingRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  const [placing, setPlacing] = useState<HeldStock | null>(null);
  const [shelve] = useShelveHeldStockMutation();
  const permission = kind === null ? null : shelvePermissions[kind];
  const columns = useMemo(() => column.columns([
    column.accessor("materialName", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.materialName}</div><div className="text-xs text-muted-foreground">{row.original.materialCode ?? "No code"}</div></div> }),
    column.accessor((row) => row.batchNumber ?? "", { id: "batch", header: "Batch", size: 170, cell: ({ row }) => <div><div>{batchNumber(row.original.batchNumber)}</div><div className="text-xs text-muted-foreground">{row.original.expires ? `Expires ${formatMonthYear(row.original.expires) ?? ""}` : "No expiry date"}</div></div> }),
    column.accessor((row) => row.from ?? "", { id: "from", header: "From", cell: ({ row }) => row.original.from ?? "–" }),
    column.accessor("quantity", { header: "Received", size: 150, cell: ({ row }) => amount(row.original.quantity, row.original.unit) }),
    ...(permission ? [column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.materialName} batch ${batchNumber(row.original.batchNumber)}`}
      items={[{ id: "shelve", label: "Put on shelves", icon: MapPin, require: permission, onSelect: () => setPlacing(row.original) }]} /> })] : []),
  ]), [permission]);
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow">WAREHOUSE</p><h1 className="text-xl font-semibold">Transferred stock to shelve</h1></div>
      <KindSwitch tabs={tabs} kind={kind} onSelect={select} />
    </div>
    <ServerDataTable label="Transferred stock" columns={columns} rows={rows} getRowId={(row) => row.key} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows} onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange}
      loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()} error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned stock the app could not read." : null}
      emptyTitle={search.trim() ? "Nothing matches this search" : "Nothing to shelve"} emptyDescription={search.trim() ? "Search by material name or code." : "Stock another department issues to yours by transfer appears here until it is put on shelves."} />
    {placing && kind !== null ? <PlaceStockDialog stock={placing} kind={kind} title="Put transferred stock on shelves" description="Place the whole quantity, on one shelf or split over several." onClose={() => setPlacing(null)}
      onPlace={async (shelves) => { const result = await shelve({ ...audit, body: { materialBatchId: placing.batchId, holdingMaterialId: placing.holdingId, shelfMaterialBatches: shelves } });
        return "error" in result ? apiErrorMessage(result.error) : null; }} /> : null}
  </section>;
}
