import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { toLargestUnit } from "@/shared/units/quantity";
import { isCovered, shortfall, usableStock } from "../lib/forecast";
import type { ForecastMaterial } from "../schemas/forecast-schema";

const column = dataTableColumns<ForecastMaterial>();
// Every figure here is worked out by the system, so each is capped at four decimals.
const quantity = (value: number, unit: string | null) => toLargestUnit(value, unit, "calculated")?.text ?? String(value);

export function ForecastTable({ title, materials, loading, error, onRetry }: {
  title: string; materials: readonly ForecastMaterial[]; loading: boolean; error: string | null; onRetry: () => void;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor((item) => item.name, { id: "material", header: "Material", cell: ({ row }) => <div className="min-w-0">
      <div className="break-words font-medium">{row.original.name}</div>
      <div className="text-xs text-muted-foreground">{row.original.code || "No code"}</div></div> }),
    column.accessor((item) => quantity(item.needed, item.unit), { id: "needed", header: "Needed", size: 120 }),
    column.accessor((item) => usableStock(item), { id: "stock", header: "Warehouse stock", size: 190, cell: ({ row }) => { const item = row.original; return <div className="min-w-0 space-y-0.5">
      <div>{quantity(usableStock(item), item.unit)} <span className="text-xs text-muted-foreground">usable</span></div>
      {item.expired > 0 ? <div className="text-xs text-destructive">{quantity(item.expired, item.unit)} expired</div> : null}
      {item.reserved > 0 ? <div className="text-xs text-muted-foreground">{quantity(item.reserved, item.unit)} reserved for other batches</div> : null}
    </div>; } }),
    column.accessor((item) => isCovered(item) ? "Enough" : "Short", { id: "status", header: "Status", size: 130, cell: ({ row }) => isCovered(row.original)
      ? <Badge variant="secondary">Enough</Badge>
      : <div className="space-y-0.5"><Badge variant="destructive">Short</Badge>
        <div className="text-xs text-destructive">{shortfall(row.original) > 0 ? `by ${quantity(shortfall(row.original), row.original.unit)}` : "nothing to spare"}</div></div> }),
  ]), []);
  return <section className="min-w-0 space-y-2">
    <h3 className="text-sm font-semibold">{title} <span className="font-normal text-muted-foreground">({materials.length})</span></h3>
    <ListDataTable label={title} columns={columns} rows={materials} getRowId={(item) => item.id} loading={loading} error={error} onRetry={onRetry}
      emptyTitle={`No ${title.toLowerCase()} needed`} />
  </section>;
}
