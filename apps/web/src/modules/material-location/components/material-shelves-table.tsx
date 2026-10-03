import { useMemo } from "react";
import { ArrowRightLeft } from "lucide-react";
import { ExpiryCell } from "@/modules/approved-materials/components/expiry-cell";
import type { ShelfBatchRow } from "@/modules/approved-materials/schemas/approved-material-schema";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { formatDate, formatMonthYear } from "@/shared/format/dates";
import { toLargestUnit } from "@/shared/units/quantity";

const column = dataTableColumns<ShelfBatchRow>();
const dash = <span className="text-muted-foreground">–</span>;

/** Where one material is: one row per batch per shelf. */
export function MaterialShelvesTable({ rows, movePermission, loading, refreshing, error, onRetry, onMove }: {
  rows: readonly ShelfBatchRow[]; movePermission: string; loading: boolean; refreshing: boolean; error: string | null; onRetry: () => void; onMove: (row: ShelfBatchRow) => void;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor((row) => row.shelf ?? "", { id: "shelf", header: "Shelf", cell: ({ row }) => row.original.shelf ? <div className="min-w-0"><div className="font-medium">{row.original.shelf}</div>
      <div className="break-words text-xs text-muted-foreground">{[row.original.rack, row.original.location, row.original.floor].filter(Boolean).join(" · ")}</div></div> : dash }),
    column.accessor((row) => row.batchNumber ?? "", { id: "batch", header: "Batch", size: 180, cell: ({ row }) => row.original.batchNumber ?? dash }),
    column.accessor("quantity", { header: "Quantity", size: 150, cell: ({ row }) => toLargestUnit(row.original.quantity, row.original.unit, "calculated")?.text ?? String(row.original.quantity) }),
    column.accessor((row) => row.manufacturingDate ?? "", { id: "made", header: "Manufactured", size: 150, cell: ({ row }) => formatMonthYear(row.original.manufacturingDate) ?? dash }),
    column.accessor((row) => row.expiryDate ?? "", { id: "expiry", header: "Expiry", size: 190, cell: ({ row }) => <ExpiryCell date={row.original.expiryDate} /> }),
    column.accessor((row) => row.retestDate ?? "", { id: "retest", header: "Retest", size: 150, cell: ({ row }) => formatDate(row.original.retestDate) ?? dash }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for batch ${row.original.batchNumber ?? "without a number"} on shelf ${row.original.shelf ?? "unknown"}`}
      items={[{ id: "move", label: "Move to another shelf", icon: ArrowRightLeft, require: movePermission, onSelect: () => onMove(row.original),
        ...(row.original.shelfBatchId ? {} : { disabled: true, disabledReason: "This record has no identifier to move" }) }]} /> }),
  ]), [movePermission, onMove]);
  return <ClientDataTable label="Shelves holding this material" columns={columns} rows={rows} getRowId={(row) => row.id} initialPageSize={50} loading={loading} refreshing={refreshing} error={error} onRetry={onRetry}
    fill={false} emptyTitle="Not on any shelf" emptyDescription="This material has no stock on your department's shelves." />;
}
