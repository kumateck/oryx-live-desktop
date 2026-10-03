import { useMemo } from "react";
import { ServerDataTable, dataTableColumns } from "@/shared/datatable";
import { toLargestUnit } from "@/shared/units/quantity";
import { freeToIssue } from "../lib/stock";
import type { ApprovedMaterialRow } from "../schemas/approved-material-schema";

const column = dataTableColumns<ApprovedMaterialRow>();
const quantity = (value: number, unit: string | null) => toLargestUnit(value, unit, "calculated")?.text ?? String(value);

export function ApprovedMaterialsTable({ rows, search, paging, loading, refreshing, error, onRetry, onOpen }: {
  rows: readonly ApprovedMaterialRow[]; search: string;
  paging: { page: number; pageSize: number; totalRows: number; onPageChange: (page: number) => void; onPageSizeChange: (pageSize: number) => void };
  loading: boolean; refreshing: boolean; error: string | null; onRetry: () => void; onOpen: (row: ApprovedMaterialRow) => void;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor("name", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.name}</div>
      <div className="text-xs text-muted-foreground">{row.original.code ?? "No code"}</div></div> }),
    column.accessor((row) => freeToIssue(row), { id: "free", header: "Free to issue", size: 170, cell: ({ row }) => { const free = freeToIssue(row.original);
      return <span className={free === 0 ? "font-medium text-destructive" : "font-medium"}>{quantity(free, row.original.unit)}</span>; } }),
    column.accessor("reserved", { header: "Reserved for production", size: 200, cell: ({ row }) => quantity(row.original.reserved, row.original.unit) }),
    column.accessor("available", { header: "Total approved", size: 170, cell: ({ row }) => quantity(row.original.available, row.original.unit) }),
  ]), []);
  return <ServerDataTable label="Approved materials" columns={columns} rows={rows} getRowId={(row) => row.id} {...paging} loading={loading} refreshing={refreshing}
    error={error} onRetry={onRetry} onRowOpen={onOpen}
    emptyTitle={search.trim() ? "No materials match this search" : "No approved stock"}
    emptyDescription={search.trim() ? "Check the spelling, or search by material code." : "Stock appears here once Quality Control has approved a received batch."} />;
}
