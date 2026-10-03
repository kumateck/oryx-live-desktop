import { useMemo } from "react";
import { Link } from "react-router";
import { ServerDataTable, dataTableColumns } from "@/shared/datatable";
import { formatDate } from "@/shared/format/dates";
import { manufacturerPath } from "../lib/manufacturer-access";
import type { ManufacturerRow } from "../schemas/manufacturer-list-schema";

const column = dataTableColumns<ManufacturerRow>();
const rowId = (row: ManufacturerRow) => row.id;
export function ManufacturersTable({ rows, search, paging, loading, refreshing, error, onRetry, onOpen }: {
  rows: readonly ManufacturerRow[]; search: string; paging: { page: number; pageSize: number; totalRows: number; onPageChange: (page: number) => void; onPageSizeChange: (size: number) => void };
  loading: boolean; refreshing: boolean; error: string | null; onRetry: () => void; onOpen: (row: ManufacturerRow) => void;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor("name", { header: "Manufacturer", cell: ({ row }) => <Link to={manufacturerPath(row.original.id)} className="break-words font-medium hover:underline">{row.original.name || "Unnamed manufacturer"}</Link> }),
    column.accessor((row) => row.country?.name ?? "—", { id: "country", header: "Country", cell: ({ row }) => <span className="break-words">{row.original.country?.name ?? "—"}</span> }),
    column.accessor((row) => formatDate(row.validityDate) ?? "—", { id: "validity", header: "Valid until", size: 130 }),
    column.accessor((row) => row.approvedAt ? "Approved" : "Pending", { id: "approval", header: "Approval", size: 120 }),
  ]), []);
  return <ServerDataTable label="Manufacturers" columns={columns} rows={rows} getRowId={rowId} {...paging}
    loading={loading} refreshing={refreshing} error={error} onRetry={onRetry} onRowOpen={onOpen}
    emptyTitle={search ? "No manufacturers match this search" : "No manufacturers yet"} emptyDescription={search ? "Try a different name or country." : undefined} />;
}
