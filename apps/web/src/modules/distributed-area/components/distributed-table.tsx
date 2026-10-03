import { useMemo } from "react";
import { MapPin } from "lucide-react";
import { ExpiryCell } from "@/modules/approved-materials/components/expiry-cell";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ServerDataTable, dataTableColumns } from "@/shared/datatable";
import { formatDate } from "@/shared/format/dates";
import { toLargestUnit } from "@/shared/units/quantity";
import type { DistributedStock } from "../schemas/distributed-schema";

const column = dataTableColumns<DistributedStock>();
const dash = <span className="text-muted-foreground">–</span>;

export function DistributedTable({ rows, search, shelvePermission, paging, loading, refreshing, error, onRetry, onShelve }: {
  rows: readonly DistributedStock[]; search: string; shelvePermission: string;
  paging: { page: number; pageSize: number; totalRows: number; onPageChange: (page: number) => void; onPageSizeChange: (pageSize: number) => void };
  loading: boolean; refreshing: boolean; error: string | null; onRetry: () => void; onShelve: (row: DistributedStock) => void;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor("materialName", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.materialName}</div>
      <div className="text-xs text-muted-foreground">{row.original.materialCode ?? "No code"}</div></div> }),
    column.accessor((row) => row.batchNumber ?? "", { id: "batch", header: "Batch", size: 170, cell: ({ row }) => row.original.batchNumber ?? dash }),
    column.accessor("quantity", { header: "To shelve", size: 150, cell: ({ row }) => <span className="font-medium">{toLargestUnit(row.original.quantity, row.original.unit, "calculated")?.text ?? String(row.original.quantity)}</span> }),
    column.accessor((row) => row.receivedAt ?? "", { id: "received", header: "Received", size: 190, cell: ({ row }) => <div><div>{formatDate(row.original.receivedAt) ?? "–"}</div>
      <div className="break-words text-xs text-muted-foreground">{row.original.store ?? "Store not recorded"}</div></div> }),
    column.accessor((row) => row.expiryDate ?? "", { id: "expiry", header: "Expiry", size: 190, cell: ({ row }) => <ExpiryCell date={row.original.expiryDate} /> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.materialName}, batch ${row.original.batchNumber ?? "without a number"}`}
      items={[{ id: "shelve", label: "Put on shelves", icon: MapPin, require: shelvePermission, onSelect: () => onShelve(row.original),
        ...(row.original.batchId ? {} : { disabled: true, disabledReason: "This delivery has no batch record" }) }]} /> }),
  ]), [shelvePermission, onShelve]);
  return <ServerDataTable label="Received stock to shelve" columns={columns} rows={rows} getRowId={(row) => row.id} {...paging} loading={loading} refreshing={refreshing} error={error} onRetry={onRetry}
    emptyTitle={search.trim() ? "Nothing matches this search" : "Nothing waiting to be shelved"} emptyDescription={search.trim() ? "Search by material or batch number." : "Stock appears here when it is distributed to your department's store."} />;
}
