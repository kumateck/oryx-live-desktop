import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ServerDataTable, dataTableColumns } from "@/shared/datatable";
import { formatDate } from "@/shared/format/dates";
import { formatMoney } from "@/shared/procurement/price";
import type { PurchaseOrder } from "../schemas/purchase-order-schema";

const column = dataTableColumns<PurchaseOrder>();

/** Purchase orders at one stage, each with the single action that stage has. */
export function PurchaseOrdersTable({ label, rows, search, action, paging, loading, refreshing, error, onRetry, emptyTitle, emptyDescription }: {
  label: string; rows: readonly PurchaseOrder[]; search: string; emptyTitle: string; emptyDescription: string;
  action: { label: string; icon: LucideIcon; permission: string; onSelect: (row: PurchaseOrder) => void };
  paging: { page: number; pageSize: number; totalRows: number; onPageChange: (page: number) => void; onPageSizeChange: (pageSize: number) => void };
  loading: boolean; refreshing: boolean; error: string | null; onRetry: () => void;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor("code", { header: "Purchase order", size: 220, cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.code}</div>
      <div className="text-xs text-muted-foreground">Awarded {formatDate(row.original.createdAt) ?? "on an unrecorded date"}</div></div> }),
    column.accessor((row) => row.supplier.name, { id: "supplier", header: "Supplier", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.supplier.name}</div>
      <div className={row.original.supplier.email ? "break-all text-xs text-muted-foreground" : "text-xs text-destructive"}>{row.original.supplier.email ?? "No email address"}</div></div> }),
    column.accessor((row) => row.items.length, { id: "materials", header: "Materials", cell: ({ row }) => <div className="min-w-0"><div>{row.original.items.length} {row.original.items.length === 1 ? "material" : "materials"}</div>
      <div className="break-words text-xs text-muted-foreground">{row.original.items.slice(0, 3).map((item) => item.materialName).join(", ")}{row.original.items.length > 3 ? ` and ${row.original.items.length - 3} more` : ""}</div></div> }),
    column.accessor((row) => row.total ?? 0, { id: "total", header: "Order value", size: 180, cell: ({ row }) => row.original.total === null ? <span className="text-muted-foreground">Not costed</span> : <span className="font-medium">{formatMoney(row.original.total, row.original.supplier.currency)}</span> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.code}`}
      items={[{ id: "act", label: action.label, icon: action.icon, require: action.permission, onSelect: () => action.onSelect(row.original) }]} /> }),
  ]), [action]);
  return <ServerDataTable label={label} columns={columns} rows={rows} getRowId={(row) => row.id} {...paging} loading={loading} refreshing={refreshing} error={error} onRetry={onRetry}
    emptyTitle={search.trim() ? "No purchase orders match this search" : emptyTitle} emptyDescription={search.trim() ? "Search by purchase order number." : emptyDescription} />;
}
