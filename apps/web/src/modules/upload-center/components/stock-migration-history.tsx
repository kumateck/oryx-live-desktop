import { useMemo } from "react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDateTime } from "@/shared/format/dates";
import { migrationAudit, stockMigrationApi, type MigrationDto } from "../api/stock-migration-api";
import { migrationPath, migrationStatusLabels } from "../lib/stock-migration";

const column = dataTableColumns<MigrationDto>();

export function StockMigrationHistory({ departmentId, topUp = false }: { departmentId: string; topUp?: boolean }) {
  const navigate = useNavigate();
  const list = stockMigrationApi.useListQuery({ ...migrationAudit, departmentId });
  const rows = useMemo(() => (list.data ?? []).filter((row) => (row.mode === 1) === topUp), [list.data, topUp]);
  const columns = useMemo(() => column.columns([
    column.accessor((row) => row.fileName ?? "", { id: "file", header: "Source / reason", cell: ({ row }) =>
      <div className="break-words"><div className="font-medium">{row.original.fileName ?? "Stock sheet"}</div><div className="text-xs text-muted-foreground">{row.original.reason}</div></div> }),
    column.accessor((row) => row.createdAt ?? "", { id: "uploaded", header: "Created", cell: ({ row }) =>
      <div>{formatDateTime(row.original.createdAt)}<div className="text-xs text-muted-foreground">{row.original.createdBy}</div></div> }),
    column.accessor((row) => row.status ?? 0, { id: "status", header: "Status", size: 110, cell: ({ row }) =>
      <Badge variant={row.original.status === 1 ? "default" : "secondary"}>{migrationStatusLabels[row.original.status ?? 0]}</Badge> }),
    column.accessor((row) => row.total ?? 0, { id: "rows", header: "Rows", cell: ({ row }) =>
      <span className="text-xs">{row.original.ok} ready · {row.original.warning} to check · {row.original.blocked} to fix</span> }),
  ]), []);
  return <ClientDataTable label={topUp ? "Migration stock top-ups" : "Opening balance drafts"} columns={columns} rows={rows} getRowId={(row) => row.id ?? ""}
    loading={list.isLoading} refreshing={list.isFetching} error={list.error ? apiErrorMessage(list.error) : null} onRetry={() => void list.refetch()}
    onRowOpen={(row) => row.id && void navigate(migrationPath(row.id))} fill={false}
    emptyTitle={topUp ? "No migration top-ups yet" : "No opening balance drafts yet"} emptyDescription="Save a draft to review and approve its stock." />;
}
