import { useMemo } from "react";
import { ServerDataTable, dataTableColumns } from "@/shared/datatable";
import { toLargestUnit } from "@/shared/units/quantity";
import { stockLevel } from "../lib/stock-level";
import type { MaterialStockRow } from "../schemas/material-location-schema";
import { StockLevelBadge } from "./stock-level-badge";

const column = dataTableColumns<MaterialStockRow>();
const quantity = (value: number, unit: string | null) => toLargestUnit(value, unit, "calculated")?.text ?? String(value);
const level = (value: number, unit: string | null) => value > 0 ? quantity(value, unit) : <span className="text-muted-foreground">Not set</span>;

export function MaterialStockTable({ rows, search, paging, loading, refreshing, error, onRetry, onOpen }: {
  rows: readonly MaterialStockRow[]; search: string;
  paging: { page: number; pageSize: number; totalRows: number; onPageChange: (page: number) => void; onPageSizeChange: (pageSize: number) => void };
  loading: boolean; refreshing: boolean; error: string | null; onRetry: () => void; onOpen: (row: MaterialStockRow) => void;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor("name", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.name}</div>
      <div className="text-xs text-muted-foreground">{row.original.code ?? "No code"}</div></div> }),
    column.accessor("stock", { header: "In warehouse", size: 160, cell: ({ row }) => <div><div className="font-medium">{quantity(row.original.stock, row.original.unit)}</div>
      {row.original.expired > 0 ? <div className="text-xs text-destructive">{quantity(row.original.expired, row.original.unit)} expired</div> : null}</div> }),
    column.display({ id: "status", header: "Status", size: 140, cell: ({ row }) => <StockLevelBadge level={stockLevel(row.original)} /> }),
    column.accessor("minimum", { header: "Minimum", size: 130, cell: ({ row }) => level(row.original.minimum, row.original.unit) }),
    column.accessor("reorder", { header: "Reorder at", size: 130, cell: ({ row }) => level(row.original.reorder, row.original.unit) }),
    column.accessor("maximum", { header: "Maximum", size: 130, cell: ({ row }) => level(row.original.maximum, row.original.unit) }),
  ]), []);
  return <ServerDataTable label="Material locations" columns={columns} rows={rows} getRowId={(row) => row.id} {...paging} loading={loading} refreshing={refreshing}
    error={error} onRetry={onRetry} onRowOpen={onOpen}
    emptyTitle={search.trim() ? "No materials match this search" : "No materials"}
    emptyDescription={search.trim() ? "Check the spelling, or search by material code." : "Materials appear here once they are set up for your department."} />;
}
