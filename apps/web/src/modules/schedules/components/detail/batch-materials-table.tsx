import { useMemo, useState, type ReactNode } from "react";
import { Boxes, CornerDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { StockAvailabilityDialog, type StockMaterial } from "@/shared/stock/stock-availability-dialog";
import { toLargestUnit } from "@/shared/units/quantity";
import { audit, schedulePermissions } from "../../lib/schedule-access";
import { chosenFor, freeStock, materialShortfall, materialSource, substitutesOf } from "../../lib/batch-materials";
import type { BatchMaterial } from "../../schemas/batch-schema";

const column = dataTableColumns<BatchMaterial>();
// Worked out by the system, so capped at four decimals.
const quantity = (value: number, unit: string | null) => toLargestUnit(value, unit, "calculated")?.text ?? String(value);

/**
 * `choice` makes lines with substitutes selectable before the batch starts: main is chosen by default, and the chosen
 * material is what is reserved, requested and issued. Without it (a started batch) the labels are shown only.
 */
export function BatchMaterialsTable({ title, rows, loading, error, onRetry, action, choice }: { title: string; rows: readonly BatchMaterial[]; loading: boolean; error: string | null; onRetry: () => void; action?: ReactNode;
  choice?: { choices: ReadonlyMap<string, string>; onChoose: (mainId: string, useId: string) => void } | undefined }) {
  const [viewing, setViewing] = useState<StockMaterial | null>(null);
  const columns = useMemo(() => column.columns([
    column.accessor((item) => item.name, { id: "material", header: "Material", cell: ({ row }) => { const item = row.original; const sub = item.substituteFor;
      const main = sub ? rows.find((other) => other.materialId === sub.id && !other.substituteFor) ?? null : substitutesOf(item, rows).length > 0 ? item : null;
      const selected = main?.materialId && choice ? chosenFor(main, rows, choice.choices).materialId === item.materialId : false;
      return <div className={cn("flex min-w-0 items-start gap-2", sub && "pl-3")}>
        {sub ? <CornerDownRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> : null}
        {main?.materialId && item.materialId && choice ? <input type="radio" className="mt-1 size-4 shrink-0 accent-primary" name={`use-${main.materialId}`} checked={selected}
          aria-label={`Use ${item.name} for this batch`} onChange={() => { if (main.materialId && item.materialId) choice.onChoose(main.materialId, item.materialId); }} /> : null}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5"><span className={cn("break-words", sub ? "font-normal" : "font-medium")}>{item.name}</span>
            {main && !sub ? <Badge variant="secondary" className="text-[0.7rem]">Main</Badge> : null}
            {sub ? <Badge variant="outline" className="border-amber-500/70 text-[0.7rem] text-amber-700 dark:text-amber-300">Substitute</Badge> : null}
            {selected ? <Badge className="text-[0.7rem]">Used for this batch</Badge> : null}</div>
          <div className="text-xs text-muted-foreground">{item.code || "No code"}{sub ? ` · may replace ${sub.name}` : ""}</div>
        </div></div>; } }),
    column.accessor((item) => quantity(item.needed, item.unit), { id: "needed", header: "Needed", size: 120 }),
    column.accessor((item) => quantity(item.reserved, item.unit), { id: "reserved", header: "Reserved for batch", size: 150 }),
    column.accessor((item) => quantity(freeStock(item), item.unit), { id: "free", header: "Free in warehouse", size: 150 }),
    // Opens where that stock is, store by store, and what is on its way in.
    column.accessor((item) => quantity(item.elsewhere, item.unit), { id: "elsewhere", header: "All other stock", size: 140, cell: ({ row, getValue }) => {
      const item = row.original;
      const materialId = item.materialId;
      return materialId ? <Button type="button" variant="link" className="h-auto p-0" aria-label={`Stock of ${item.name} in every store`}
        onClick={() => setViewing({ id: materialId, name: item.name, code: item.code || null, unit: item.unit })}>{getValue()}</Button> : getValue();
    } }),
    column.accessor((item) => materialSource(item).label, { id: "source", header: "Source", size: 190, cell: ({ row }) => { const source = materialSource(row.original); const short = materialShortfall(row.original);
      return <div className="space-y-0.5"><Badge variant={source.covered ? "secondary" : "destructive"}>{source.label}</Badge>
        {short > 0 ? <div className="text-xs text-destructive">short by {quantity(short, row.original.unit)}</div> : null}</div>; } }),
    column.display({ id: "actions", size: 56, enableHiding: false, header: () => <TableMenuHeader />, cell: ({ row }) => {
      const item = row.original;
      const materialId = item.materialId;
      return <TableMenu label={`Actions for ${item.name}`} items={materialId ? [
        { id: "stock", label: "Stock availability", icon: Boxes, require: schedulePermissions.view,
          onSelect: () => setViewing({ id: materialId, name: item.name, code: item.code || null, unit: item.unit }) },
      ] : []} />;
    } }),
  ]), [rows, choice]);
  return <section className="min-w-0 space-y-2">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">{title} <span className="font-normal text-muted-foreground">({rows.filter((item) => !item.substituteFor).length})</span></h3>{action}</div>
    {choice && rows.some((item) => item.substituteFor) ? <p className="text-xs text-muted-foreground">Lines marked Main have a substitute. The main material is used unless you choose its substitute; the chosen one is reserved, requested and issued.</p> : null}
    <ListDataTable label={title} columns={columns} rows={rows} getRowId={(item) => item.id} loading={loading} error={error} onRetry={onRetry} emptyTitle={`No ${title.toLowerCase()}`} />
    {viewing ? <StockAvailabilityDialog key={viewing.id} material={viewing} audit={audit} onClose={() => setViewing(null)} /> : null}
  </section>;
}
