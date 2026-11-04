import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { formatQuantityNumber, toLargestUnit } from "@/shared/units/quantity";
import type { RepairRow } from "../../schemas/issued-material-repair";

const amount = (value: number, unit: string) => toLargestUnit(value, unit, "calculated")?.text ?? "Unavailable";
const column = dataTableColumns<RepairRow>();
const columns = column.columns([
  column.accessor("code", { header: "Material", cell: ({ row }) => <div className="min-w-0 break-words"><p className="font-medium">{row.original.code}</p>
    <p className="text-xs text-muted-foreground">{row.original.name}</p></div> }),
  column.accessor("beforeQuantity", { header: "Already issued", size: 145, cell: ({ row }) => amount(row.original.beforeQuantity, row.original.unit) }),
  column.accessor("targetQuantity", { header: "Correct requirement", size: 155, cell: ({ row }) => amount(row.original.targetQuantity, row.original.unit) }),
  column.accessor("adjustment", { header: "Stock adjustment", size: 230, cell: ({ row }) => {
    const item = row.original;
    return <div className="min-w-0 space-y-1 break-words">
      <p className="font-medium">{item.adjustment > 0 ? `Issue ${amount(item.adjustment, item.unit)}` : item.adjustment < 0 ? `Return ${amount(-item.adjustment, item.unit)}` : "No change"}</p>
      {item.adjustment !== 0 && toLargestUnit(Math.abs(item.adjustment), item.unit, "calculated")?.unit !== item.unit
        ? <p className="text-xs text-muted-foreground">{formatQuantityNumber(Math.abs(item.adjustment), "calculated")} {item.unit}</p> : null}
      {item.adjustment > 0 ? <p className="text-xs text-muted-foreground">Eligible stock: {amount(item.availableQuantity, item.unit)}</p> : null}
      {item.lots.map((lot) => <p key={`${lot.materialBatchId}-${lot.shelfId}`} className="text-xs text-muted-foreground">
        {lot.batchNumber} · {amount(Math.abs(lot.adjustment), item.unit)}</p>)}
    </div>;
  } }),
]);

export function IssuedMaterialRepairRows({ rows, loading }: { rows: readonly RepairRow[]; loading: boolean }) {
  return <ListDataTable label="Issued stock repair preview" columns={columns} rows={rows} getRowId={(row) => row.materialId} loading={loading} emptyTitle="No materials to repair" />;
}
