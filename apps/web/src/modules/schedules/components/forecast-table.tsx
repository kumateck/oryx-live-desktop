import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { toLargestUnit } from "@/shared/units/quantity";
import { CornerDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { freeStock, isCovered, lineCovered, shortfall, substitutesOf, usableStock } from "../lib/forecast";
import type { ForecastMaterial } from "../schemas/forecast-schema";

const column = dataTableColumns<ForecastMaterial>();
// Every figure here is worked out by the system, so each is capped at four decimals.
const quantity = (value: number, unit: string | null) => toLargestUnit(value, unit, "calculated")?.text ?? String(value);

export function ForecastTable({ title, materials, loading, error, onRetry }: {
  title: string; materials: readonly ForecastMaterial[]; loading: boolean; error: string | null; onRetry: () => void;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor((item) => item.name, { id: "material", header: "Material", cell: ({ row }) => { const item = row.original; const sub = item.substituteFor;
      const hasSubstitutes = !sub && substitutesOf(item, materials).length > 0;
      return <div className={cn("min-w-0", sub && "flex gap-1.5 pl-3")}>
        {sub ? <CornerDownRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> : null}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5"><span className={cn("break-words", sub ? "font-normal" : "font-medium")}>{item.name}</span>
            {hasSubstitutes ? <Badge variant="secondary" className="text-[0.7rem]">Main</Badge> : null}
            {sub ? <Badge variant="outline" className="border-amber-500/70 text-[0.7rem] text-amber-700 dark:text-amber-300">Substitute</Badge> : null}</div>
          <div className="text-xs text-muted-foreground">{item.code || "No code"}{sub ? ` · may replace ${sub.name}` : ""}</div>
        </div></div>; } }),
    column.accessor((item) => quantity(item.needed, item.unit), { id: "needed", header: "Needed", size: 120 }),
    column.accessor((item) => freeStock(item), { id: "stock", header: "Free stock", size: 190, cell: ({ row }) => { const item = row.original; return <div className="min-w-0 space-y-0.5">
      <div>{quantity(freeStock(item), item.unit)} <span className="text-xs text-muted-foreground">free</span></div>
      {item.reserved > 0 ? <div className="text-xs text-muted-foreground">{quantity(usableStock(item), item.unit)} usable, less {quantity(item.reserved, item.unit)} reserved for other batches</div> : null}
      {item.expired > 0 ? <div className="text-xs text-destructive">{quantity(item.expired, item.unit)} expired</div> : null}
      {item.unavailable > 0 ? <div className="text-xs text-destructive">{quantity(item.unavailable, item.unit)} not released for use</div> : null}
    </div>; } }),
    column.accessor((item) => isCovered(item) ? "Enough" : "Short", { id: "status", header: "Status", size: 150, cell: ({ row }) => { const item = row.original;
      if (isCovered(item)) return <Badge variant="secondary">Enough</Badge>;
      // A short main material whose substitute has enough does not stop the batch: say so.
      const coveredBySubstitute = !item.substituteFor && lineCovered(item, materials);
      return <div className="space-y-0.5"><Badge variant={coveredBySubstitute || item.substituteFor ? "outline" : "destructive"} className={coveredBySubstitute || item.substituteFor ? "border-amber-500/70 text-amber-700 dark:text-amber-300" : undefined}>Short</Badge>
        <div className={cn("text-xs", coveredBySubstitute || item.substituteFor ? "text-muted-foreground" : "text-destructive")}>
          {shortfall(item) > 0 ? `by ${quantity(shortfall(item), item.unit)}` : "nothing to spare"}{coveredBySubstitute ? " · a substitute has enough" : ""}</div></div>; } }),
  ]), [materials]);
  return <section className="min-w-0 space-y-2">
    <h3 className="text-sm font-semibold">{title} <span className="font-normal text-muted-foreground">({materials.filter((item) => !item.substituteFor).length})</span></h3>
    <ListDataTable label={title} columns={columns} rows={materials} getRowId={(item) => item.id} loading={loading} error={error} onRetry={onRetry}
      emptyTitle={`No ${title.toLowerCase()} needed`} />
  </section>;
}
