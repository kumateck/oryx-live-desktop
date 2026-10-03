import { useMemo } from "react";
import type { PurchaseOrder } from "@/modules/proforma-requests/schemas/purchase-order-schema";
import { OrderStatusBadge } from "@/modules/purchase-orders/components/order-status-badge";
import { ServerDataTable, dataTableColumns } from "@/shared/datatable";
import { formatDate } from "@/shared/format/dates";
import { formatMoney } from "@/shared/procurement/price";

const column = dataTableColumns<PurchaseOrder>();
const dash = <span className="text-muted-foreground">–</span>;

/** Every purchase order, whatever stage it is at. */
export function OrderListTable({ rows, search, filtered, paging, loading, refreshing, error, onRetry, onOpen }: {
  rows: readonly PurchaseOrder[]; search: string; filtered: boolean;
  paging: { page: number; pageSize: number; totalRows: number; onPageChange: (page: number) => void; onPageSizeChange: (pageSize: number) => void };
  loading: boolean; refreshing: boolean; error: string | null; onRetry: () => void; onOpen: (row: PurchaseOrder) => void;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor("code", { header: "Purchase order", size: 200, cell: ({ row }) => <span className="break-words font-medium">{row.original.code}</span> }),
    column.accessor((row) => row.supplier.name, { id: "supplier", header: "Supplier", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.supplier.name}</div>
      <div className="text-xs text-muted-foreground">{row.original.items.length} {row.original.items.length === 1 ? "material" : "materials"}</div></div> }),
    column.accessor((row) => row.createdAt ?? "", { id: "awarded", header: "Awarded", size: 140, cell: ({ row }) => formatDate(row.original.createdAt) ?? dash }),
    column.accessor((row) => row.expectedDelivery ?? row.estimatedDelivery ?? "", { id: "delivery", header: "Delivery expected", size: 170, cell: ({ row }) => formatDate(row.original.expectedDelivery ?? row.original.estimatedDelivery) ?? dash }),
    column.accessor((row) => row.recorded.grandTotal ?? row.total ?? 0, { id: "value", header: "Value", size: 180, cell: ({ row }) => { const value = row.original.recorded.grandTotal ?? row.original.total;
      return value === null ? <span className="text-muted-foreground">Not costed</span> : <span className="font-medium">{formatMoney(value, row.original.supplier.currency)}</span>; } }),
    column.accessor("status", { header: "Status", size: 210, cell: ({ row }) => <OrderStatusBadge status={row.original.status} /> }),
  ]), []);
  return <ServerDataTable label="Purchase orders" columns={columns} rows={rows} getRowId={(row) => row.id} {...paging} loading={loading} refreshing={refreshing} error={error} onRetry={onRetry} onRowOpen={onOpen}
    emptyTitle={search.trim() || filtered ? "No purchase orders match" : "No purchase orders"} emptyDescription={search.trim() || filtered ? "Change the search or the status." : "Orders appear here once suppliers are chosen in price comparison."} />;
}
