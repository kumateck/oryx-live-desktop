import { useMemo } from "react";
import { ServerDataTable, dataTableColumns } from "@/shared/datatable";
import { formatDate } from "@/shared/format/dates";
import { requisitionTypeLabels } from "../lib/requisition-status";
import type { Requisition } from "../schemas/requisition-schema";
import { RequisitionStatusBadge } from "./requisition-status-badge";

const column = dataTableColumns<Requisition>();
const dash = <span className="text-muted-foreground">–</span>;

/** Requisitions as a list. `showType` adds the type column where stock and purchase requisitions are mixed. */
export function RequisitionsTable({ label, rows, search, paging, loading, refreshing, error, onRetry, onOpen, showType, emptyTitle, emptyDescription }: {
  label: string; rows: readonly Requisition[]; search: string; showType: boolean; emptyTitle: string; emptyDescription: string;
  paging: { page: number; pageSize: number; totalRows: number; onPageChange: (page: number) => void; onPageSizeChange: (pageSize: number) => void };
  loading: boolean; refreshing: boolean; error: string | null; onRetry: () => void; onOpen: (row: Requisition) => void;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor("code", { header: "Requisition", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.code}</div>
      <div className="text-xs text-muted-foreground">{row.original.items.length} {row.original.items.length === 1 ? "material" : "materials"}{row.original.product ? ` · for ${row.original.product}` : ""}</div></div> }),
    ...(showType ? [column.accessor((row) => requisitionTypeLabels[row.type], { id: "type", header: "Type", size: 120 })] : []),
    column.accessor((row) => row.createdAt ?? "", { id: "requested", header: "Requested", size: 220, cell: ({ row }) => <div className="min-w-0"><div>{formatDate(row.original.createdAt) ?? "–"}</div>
      <div className="break-words text-xs text-muted-foreground">{[row.original.requestedBy, row.original.department].filter(Boolean).join(" · ") || "Requester not recorded"}</div></div> }),
    column.accessor((row) => row.expectedDelivery ?? "", { id: "expected", header: "Needed by", size: 150, cell: ({ row }) => formatDate(row.original.expectedDelivery) ?? dash }),
    column.accessor("status", { header: "Status", size: 170, cell: ({ row }) => <RequisitionStatusBadge status={row.original.status} type={row.original.type} /> }),
  ]), [showType]);
  return <ServerDataTable label={label} columns={columns} rows={rows} getRowId={(row) => row.id} {...paging} loading={loading} refreshing={refreshing} error={error} onRetry={onRetry} onRowOpen={onOpen}
    emptyTitle={search.trim() ? "No requisitions match this search" : emptyTitle} emptyDescription={search.trim() ? "Search by requisition number or remarks." : emptyDescription} />;
}
