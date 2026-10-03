import { useMemo, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { toLargestUnit } from "@/shared/units/quantity";
import { freeStock, materialShortfall, materialSource } from "../../lib/batch-materials";
import type { BatchMaterial } from "../../schemas/batch-schema";

const column = dataTableColumns<BatchMaterial>();
// Worked out by the system, so capped at four decimals.
const quantity = (value: number, unit: string | null) => toLargestUnit(value, unit, "calculated")?.text ?? String(value);

export function BatchMaterialsTable({ title, rows, loading, error, onRetry, action }: { title: string; rows: readonly BatchMaterial[]; loading: boolean; error: string | null; onRetry: () => void; action?: ReactNode }) {
  const columns = useMemo(() => column.columns([
    column.accessor((item) => item.name, { id: "material", header: "Material", cell: ({ row }) => <div className="min-w-0">
      <div className="break-words font-medium">{row.original.name}</div><div className="text-xs text-muted-foreground">{row.original.code || "No code"}</div></div> }),
    column.accessor((item) => quantity(item.needed, item.unit), { id: "needed", header: "Needed", size: 120 }),
    column.accessor((item) => quantity(item.reserved, item.unit), { id: "reserved", header: "Reserved for batch", size: 150 }),
    column.accessor((item) => quantity(freeStock(item), item.unit), { id: "free", header: "Free in warehouse", size: 150 }),
    column.accessor((item) => quantity(item.elsewhere, item.unit), { id: "elsewhere", header: "All other stock", size: 140 }),
    column.accessor((item) => materialSource(item).label, { id: "source", header: "Source", size: 190, cell: ({ row }) => { const source = materialSource(row.original); const short = materialShortfall(row.original);
      return <div className="space-y-0.5"><Badge variant={source.covered ? "secondary" : "destructive"}>{source.label}</Badge>
        {short > 0 ? <div className="text-xs text-destructive">short by {quantity(short, row.original.unit)}</div> : null}</div>; } }),
  ]), []);
  return <section className="min-w-0 space-y-2">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">{title} <span className="font-normal text-muted-foreground">({rows.length})</span></h3>{action}</div>
    <ListDataTable label={title} columns={columns} rows={rows} getRowId={(item) => item.id} loading={loading} error={error} onRetry={onRetry} emptyTitle={`No ${title.toLowerCase()}`} />
  </section>;
}
