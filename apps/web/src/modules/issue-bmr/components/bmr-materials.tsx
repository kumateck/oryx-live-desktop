import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { StockAvailabilityDialog, type StockMaterial } from "@/shared/stock/stock-availability-dialog";
import { toLargestUnit } from "@/shared/units/quantity";
import { issueBmrAudit } from "../lib/issue-bmr";
import type { BmrMaterial } from "../schemas/bmr-schema";

const column = dataTableColumns<BmrMaterial>();
const shown = (value: number, unit: string | null) => toLargestUnit(value, unit, "calculated")?.text ?? String(value);

/** What the batch needs of each material against warehouse stock; "other stock" opens where the rest of it is. */
export function BmrMaterials({ title, rows, loading, error, onRetry }: { title: string; rows: readonly BmrMaterial[]; loading: boolean; error: string | null; onRetry: () => void }) {
  const [viewing, setViewing] = useState<StockMaterial | null>(null);
  const columns = column.columns([
    column.accessor("name", { header: "Material", cell: ({ row }) => <div className="min-w-0"><div className="break-words font-medium">{row.original.name}</div><div className="text-xs text-muted-foreground">{row.original.code ?? "No code"}</div></div> }),
    column.accessor("needed", { header: "Needed", size: 120, cell: ({ row }) => shown(row.original.needed, row.original.unit) }),
    column.accessor("onHand", { header: "Warehouse stock", size: 140, cell: ({ row }) => shown(row.original.onHand, row.original.unit) }),
    column.accessor("elsewhere", { header: "Other stock", size: 130, cell: ({ row }) => { const item = row.original; const text = shown(item.elsewhere, item.unit);
      return item.materialId ? <Button type="button" variant="link" className="h-auto p-0" aria-label={`Stock of ${item.name} in every store`}
        onClick={() => setViewing({ id: item.materialId ?? "", name: item.name, code: item.code, unit: item.unit })}>{text}</Button> : text; } }),
  ]);
  return <section className="min-w-0 space-y-2">
    <h2 className="text-sm font-semibold">{title} <span className="font-normal text-muted-foreground">({rows.length})</span></h2>
    <ListDataTable label={title} columns={columns} rows={rows} getRowId={(row) => row.id} loading={loading} error={error} onRetry={onRetry} emptyTitle={`No ${title.toLowerCase()}`} />
    {viewing ? <StockAvailabilityDialog key={viewing.id} material={viewing} audit={issueBmrAudit} onClose={() => setViewing(null)} /> : null}
  </section>;
}
