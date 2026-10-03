import { useMemo } from "react";
import { ArrowLeftRight, Boxes } from "lucide-react";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ServerDataTable, dataTableColumns, type DataTableSelection } from "@/shared/datatable";
import { toLargestUnit } from "@/shared/units/quantity";
import type { PickRow } from "../schemas/requisition-schema";

const column = dataTableColumns<PickRow>();
const quantity = (value: number, unit: string | null) => toLargestUnit(value, unit, "calculated")?.text ?? String(value);
const level = (value: number, unit: string | null) => value > 0 ? quantity(value, unit) : "not set";

/** The department's materials with their stock position, to tick the ones that need ordering. */
export function MaterialPickerTable({ rows, search, filtered, selection, transferPermission, onShowStock, onTransfer, paging, loading, refreshing, error, onRetry }: {
  rows: readonly PickRow[]; search: string; filtered: boolean; selection: DataTableSelection<PickRow> | undefined;
  transferPermission: string; onShowStock: (row: PickRow) => void; onTransfer: (row: PickRow) => void;
  paging: { page: number; pageSize: number; totalRows: number; onPageChange: (page: number) => void; onPageSizeChange: (pageSize: number) => void };
  loading: boolean; refreshing: boolean; error: string | null; onRetry: () => void;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor("name", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.name}</div>
      <div className="break-words text-xs text-muted-foreground">{[row.original.code ?? "No code", row.original.category].filter(Boolean).join(" · ")}</div></div> }),
    column.accessor("stock", { header: "In warehouse", size: 170, cell: ({ row }) => { const low = row.original.reorder > 0 && row.original.stock <= row.original.reorder;
      return <div><div className={low ? "font-medium text-destructive" : "font-medium"}>{quantity(row.original.stock, row.original.unit)}</div>
        {low ? <div className="text-xs text-destructive">At or under reorder level</div> : null}</div>; } }),
    column.accessor("elsewhere", { header: "Other departments", size: 170, cell: ({ row }) => row.original.elsewhere > 0 ? quantity(row.original.elsewhere, row.original.unit) : <span className="text-muted-foreground">None</span> }),
    column.accessor("reorder", { header: "Levels", size: 230, cell: ({ row }) => <div className="text-sm"><div>Reorder at {level(row.original.reorder, row.original.unit)}</div>
      <div className="text-xs text-muted-foreground">Min {level(row.original.minimum, row.original.unit)} · Max {level(row.original.maximum, row.original.unit)}</div></div> }),
    column.accessor("expired", { header: "Expired", size: 130, cell: ({ row }) => row.original.expired > 0 ? <span className="text-destructive">{quantity(row.original.expired, row.original.unit)}</span> : <span className="text-muted-foreground">None</span> }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.name}`} items={[
      { id: "stock", label: "Stock availability", icon: Boxes, onSelect: () => onShowStock(row.original) },
      { id: "transfer", label: "Request stock transfer", icon: ArrowLeftRight, require: transferPermission, onSelect: () => onTransfer(row.original),
        ...(row.original.elsewhere > 0 ? {} : { disabled: true, disabledReason: "No other department holds this material" }) }]} /> }),
  ]), [transferPermission, onShowStock, onTransfer]);
  return <ServerDataTable label="Materials" columns={columns} rows={rows} getRowId={(row) => row.id} {...paging} loading={loading} refreshing={refreshing} error={error} onRetry={onRetry} selection={selection}
    emptyTitle={search.trim() || filtered ? "No materials match" : "No materials"}
    emptyDescription={search.trim() || filtered ? "Change the search or the category." : "Materials appear here once they are set up for your department."} />;
}
