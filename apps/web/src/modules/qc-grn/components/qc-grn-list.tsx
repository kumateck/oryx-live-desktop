import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { KindSwitch } from "@/shared/reference-data/kind-switch";
import { useKindTabs } from "@/shared/reference-data/kind-tabs";
import { usePageSearch } from "@/shared/search/page-search";
import { qcGrnWarehouseApi } from "../api/qc-grn-api";
import { grnDetailPath, grnListAudit, grnStatusLabels, qcPermissions } from "../lib/qc-grn";
import { qcGrnRowsSchema, type QcGrnRow } from "../schemas/grn-schema";

const column = dataTableColumns<QcGrnRow>();
const columns = column.columns([
  column.accessor("number", { header: "GRN", cell: ({ row }) => <span className="break-words font-medium">{row.original.number}</span> }),
  column.accessor("batches", { header: "Batches", size: 110 }),
  column.accessor((row) => row.carrier ?? "", { id: "carrier", header: "Carrier", cell: ({ row }) => row.original.carrier ?? "–" }),
  column.accessor((row) => row.receivedAt ?? "", { id: "received", header: "Received", size: 140, cell: ({ row }) => formatDate(row.original.receivedAt) ?? "–" }),
  column.accessor((row) => row.status ?? -1, { id: "status", header: "Status", size: 140, cell: ({ row }) => row.original.status === null ? "–"
    : <Badge variant={row.original.status === 2 ? "default" : row.original.status === 1 ? "secondary" : "outline"}>{grnStatusLabels[row.original.status] ?? "Unknown"}</Badge> }),
]);

/** Goods received notes whose batches QC samples and tests, raw and packaging material apart. */
export function QcGrnListPage() {
  const navigate = useNavigate();
  const { kind, select, tabs } = useKindTabs(qcPermissions.view);
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("goods receipt notes", busy);
  const table = useServerTable({ pageSize: 50, resetKey: `${search}|${String(kind)}` });
  const query = qcGrnWarehouseApi.useGetApiV1WarehouseGrnsQcQuery({ ...grnListAudit, kind: kind ?? 0, page: table.page, pageSize: table.pageSize, searchQuery: search }, { skip: kind === null });
  const parsed = useMemo(() => query.data ? qcGrnRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  return <section className="page-fill">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">QUALITY CONTROL</p><h1 className="text-xl font-semibold">Goods receipt notes</h1></div>
      <KindSwitch tabs={tabs} kind={kind} onSelect={select} /></div>
    <ServerDataTable label="Goods receipt notes" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      onRowOpen={(row) => void navigate(grnDetailPath(row.id, kind ?? 0))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned notes the app could not read." : null}
      emptyTitle={search.trim() ? "No notes match this search" : "No goods receipt notes"} emptyDescription={search.trim() ? "Search by GRN number." : "Notes appear here once the warehouse receives materials."} />
  </section>;
}
