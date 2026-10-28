import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { ServerDataTable, dataTableColumns, pageMeta, useServerTable } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { usePageSearch } from "@/shared/search/page-search";
import { toLargestUnit } from "@/shared/units/quantity";
import { useGetApiV1ProductionScheduleManufacturingQuery } from "../api/issue-bmr-api";
import { issueBmrAudit, issueBmrDetailPath } from "../lib/issue-bmr";
import { bmrRowsSchema, type Bmr } from "../schemas/bmr-schema";

const column = dataTableColumns<Bmr>();
const columns = column.columns([
  column.accessor((row) => row.requestedAt ?? "", { id: "requested", header: "Requested", size: 130, cell: ({ row }) => formatDate(row.original.requestedAt) ?? "–" }),
  column.accessor((row) => row.schedule ?? "", { id: "schedule", header: "Schedule", size: 150, cell: ({ row }) => row.original.schedule ?? "–" }),
  column.accessor((row) => row.productName ?? "", { id: "product", header: "Product", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.productName ?? "Unnamed product"}</div>
    <div className="text-xs text-muted-foreground">{row.original.productCode ?? "No code"}</div></div> }),
  column.accessor((row) => row.department ?? "", { id: "department", header: "Department", size: 170, cell: ({ row }) => row.original.department ?? "–" }),
  column.accessor("quantity", { header: "Batch size", size: 130, cell: ({ row }) => toLargestUnit(row.original.quantity, row.original.unit)?.text ?? "–" }),
  column.accessor((row) => row.batchNumber ?? "", { id: "batch", header: "Batch", size: 130, cell: ({ row }) => row.original.batchNumber ?? "–" }),
  column.accessor((row) => row.issuedAt ?? "", { id: "status", header: "Status", size: 150, cell: ({ row }) => row.original.issuedAt
    ? <div><Badge>Issued</Badge><div className="text-xs text-muted-foreground">{formatDate(row.original.issuedAt)}</div></div> : <Badge variant="outline">Awaiting issue</Badge> }),
]);

/** Batch manufacturing and packaging records production has requested from QA. */
export function IssueBmrListPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const search = usePageSearch("batch records", busy);
  const table = useServerTable({ pageSize: 50, resetKey: search });
  const query = useGetApiV1ProductionScheduleManufacturingQuery({ ...issueBmrAudit, page: table.page, pageSize: table.pageSize, searchQuery: search });
  const parsed = useMemo(() => query.data ? bmrRowsSchema.safeParse(query.data.data ?? []) : null, [query.data]);
  const rows = useMemo(() => parsed?.success ? parsed.data : [], [parsed]);
  const meta = pageMeta(query.data, table, rows.length);
  useEffect(() => { setBusy(query.isFetching); }, [query.isFetching]);
  return <section className="page-fill">
    <div><p className="eyebrow">QUALITY ASSURANCE</p><h1 className="text-xl font-semibold">BMR and BPR requests</h1></div>
    <ServerDataTable label="BMR and BPR requests" columns={columns} rows={rows} getRowId={(row) => row.id} page={table.page} pageSize={table.pageSize} totalRows={meta.totalRows}
      onPageChange={table.onPageChange} onPageSizeChange={table.onPageSizeChange} loading={query.isLoading} refreshing={query.isFetching && !query.isLoading} onRetry={() => void query.refetch()}
      onRowOpen={(row) => void navigate(issueBmrDetailPath(row.id))}
      error={query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned records the app could not read." : null}
      emptyTitle={search.trim() ? "No records match this search" : "No batch records requested"} emptyDescription={search.trim() ? "Search by product or schedule." : "Production requests a record when a batch reaches its BMR step."} />
  </section>;
}
