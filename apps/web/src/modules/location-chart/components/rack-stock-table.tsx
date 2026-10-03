import { useMemo } from "react";
import { ArrowRightLeft } from "lucide-react";
import { ExpiryCell } from "@/modules/approved-materials/components/expiry-cell";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { formatMonthYear } from "@/shared/format/dates";
import { toLargestUnit } from "@/shared/units/quantity";
import type { RackStockRow } from "../lib/rack-stock";

const column = dataTableColumns<RackStockRow>();
const dash = <span className="text-muted-foreground">–</span>;

/** What is on the shelves of one rack: one row per batch per shelf. */
export function RackStockTable({ rows, search, movePermission, loading, refreshing, error, onRetry, onMove }: {
  rows: readonly RackStockRow[]; search: string; movePermission: string; loading: boolean; refreshing: boolean; error: string | null; onRetry: () => void; onMove: (row: RackStockRow) => void;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor("shelf", { header: "Shelf", size: 130, cell: ({ row }) => <span className="font-medium">{row.original.shelf}</span> }),
    column.accessor("materialName", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.materialName}</div>
      <div className="text-xs text-muted-foreground">{row.original.materialCode ?? "No code"}</div></div> }),
    column.accessor((row) => row.batchNumber ?? "", { id: "batch", header: "Batch", size: 170, cell: ({ row }) => row.original.batchNumber ?? dash }),
    column.accessor("quantity", { header: "Quantity", size: 150, cell: ({ row }) => toLargestUnit(row.original.quantity, row.original.unit, "calculated")?.text ?? String(row.original.quantity) }),
    column.accessor((row) => row.manufacturingDate ?? "", { id: "made", header: "Manufactured", size: 150, cell: ({ row }) => formatMonthYear(row.original.manufacturingDate) ?? dash }),
    column.accessor((row) => row.expiryDate ?? "", { id: "expiry", header: "Expiry", size: 190, cell: ({ row }) => <ExpiryCell date={row.original.expiryDate} /> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for batch ${row.original.batchNumber ?? "without a number"} on shelf ${row.original.shelf}`}
      items={[{ id: "move", label: "Move to another shelf", icon: ArrowRightLeft, require: movePermission, onSelect: () => onMove(row.original),
        ...(row.original.shelfBatchId ? {} : { disabled: true, disabledReason: "This record has no identifier to move" }) }]} /> }),
  ]), [movePermission, onMove]);
  return <ClientDataTable label="Stock on this rack" columns={columns} rows={rows} getRowId={(row) => row.id} initialPageSize={50} loading={loading} refreshing={refreshing} error={error} onRetry={onRetry}
    emptyTitle={search.trim() ? "Nothing on this rack matches the search" : "This rack is empty"}
    emptyDescription={search.trim() ? "Search by shelf, material, code or batch number." : "Stock appears here once it is assigned to one of the rack's shelves."} />;
}
