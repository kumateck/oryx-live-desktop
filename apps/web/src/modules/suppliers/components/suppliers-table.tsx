import { useMemo } from "react";
import { Link } from "react-router";
import { ServerDataTable, dataTableColumns } from "@/shared/datatable";
import { supplierPath, supplierStatus, supplierType } from "../lib/supplier-access";
import type { SupplierRow } from "../schemas/supplier-list-schema";

const column = dataTableColumns<SupplierRow>();
const rowId = (row: SupplierRow) => row.id;
export function SuppliersTable({ rows, search, paging, loading, refreshing, error, onRetry, onOpen }: {
  rows: readonly SupplierRow[]; search: string; paging: { page: number; pageSize: number; totalRows: number; onPageChange: (page: number) => void; onPageSizeChange: (size: number) => void };
  loading: boolean; refreshing: boolean; error: string | null; onRetry: () => void; onOpen: (row: SupplierRow) => void;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor("name", { header: "Supplier", cell: ({ row }) => <div className="min-w-0 space-y-0.5">
      <Link to={supplierPath(row.original.id)} className="break-words font-medium hover:underline">{row.original.name || "Unnamed supplier"}</Link>
      <p className="break-words text-xs text-muted-foreground">{row.original.contactPerson || row.original.email || "No contact"}</p>
    </div> }),
    column.accessor((row) => row.country?.name ?? "—", { id: "location", header: "Location", cell: ({ row }) =>
      <div className="min-w-0 break-words">{row.original.country?.name ?? "—"} · {supplierType(row.original.type)}</div> }),
    column.accessor((row) => row.currency?.symbol ?? row.currency?.name ?? "—", { id: "currency", header: "Currency", size: 110 }),
    column.accessor((row) => supplierStatus(row.status), { id: "status", header: "Status", size: 120 }),
  ]), []);
  return <ServerDataTable label="Suppliers" columns={columns} rows={rows} getRowId={rowId} {...paging}
    loading={loading} refreshing={refreshing} error={error} onRetry={onRetry} onRowOpen={onOpen}
    emptyTitle={search ? "No suppliers match this search" : "No suppliers yet"} emptyDescription={search ? "Try a different name or contact." : undefined} />;
}
