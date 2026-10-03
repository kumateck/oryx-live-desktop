import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { ServerDataTable, dataTableColumns } from "@/shared/datatable";
import { formatDate } from "@/shared/format/dates";
import { formatMoney } from "@/shared/procurement/price";
import { supplierTypeLabels } from "@/shared/procurement/supplier-type";
import type { ShipmentInvoice } from "../schemas/invoice-schema";

const column = dataTableColumns<ShipmentInvoice>();

export function InvoicesTable({ rows, search, paging, loading, refreshing, error, onRetry, onOpen }: {
  rows: readonly ShipmentInvoice[]; search: string;
  paging: { page: number; pageSize: number; totalRows: number; onPageChange: (page: number) => void; onPageSizeChange: (pageSize: number) => void };
  loading: boolean; refreshing: boolean; error: string | null; onRetry: () => void; onOpen: (row: ShipmentInvoice) => void;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor("code", { header: "Invoice", size: 200, cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.code}</div>
      <div className="text-xs text-muted-foreground">{formatDate(row.original.createdAt) ?? "Date not recorded"}</div></div> }),
    column.accessor((row) => row.supplier.name, { id: "supplier", header: "Supplier", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.supplier.name}</div>
      <div className="text-xs text-muted-foreground">{row.original.supplier.type === null ? "Type not recorded" : `${supplierTypeLabels[row.original.supplier.type]} supplier`}</div></div> }),
    column.accessor((row) => row.orders.join(", "), { id: "orders", header: "Purchase orders", cell: ({ row }) => <span className="break-words">{row.original.orders.join(", ") || "–"}</span> }),
    column.accessor((row) => row.total ?? 0, { id: "total", header: "Value", size: 170, cell: ({ row }) => row.original.total === null ? <span className="text-muted-foreground">Not costed</span> : <span className="font-medium">{formatMoney(row.original.total, row.original.currency)}</span> }),
    column.accessor("onShipment", { header: "Shipment", size: 170, cell: ({ row }) => row.original.onShipment ? <Badge variant="secondary">On a shipment</Badge> : <Badge variant="outline">Not yet shipped</Badge> }),
  ]), []);
  return <ServerDataTable label="Shipment invoices" columns={columns} rows={rows} getRowId={(row) => row.id} {...paging} loading={loading} refreshing={refreshing} error={error} onRetry={onRetry} onRowOpen={onOpen}
    emptyTitle={search.trim() ? "No invoices match this search" : "No shipment invoices"} emptyDescription={search.trim() ? "Search by invoice number." : "A supplier's invoice is recorded here once its purchase order has been sent."} />;
}
