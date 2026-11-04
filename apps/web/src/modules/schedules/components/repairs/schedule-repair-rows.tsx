import { Badge } from "@/components/ui/badge";
import { ClientDataTable, dataTableColumns } from "@/shared/datatable";
import { toLargestUnit } from "@/shared/units/quantity";
import type { ScheduleRepairBatch } from "../../schemas/schedule-repair";

const amount = (value: number, unit: string) => toLargestUnit(value, unit, "calculated")?.text ?? "Unavailable";
const column = dataTableColumns<ScheduleRepairBatch>();
const labels = { ready: "Ready", unchanged: "Already matches", skipped: "Skipped", blocked: "Blocked" } as const;
const columns = column.columns([
  column.accessor("batchNumber", { header: "Batch", size: 170, cell: ({ row }) => <div className="min-w-0 break-words">
    <p className="font-medium">{row.original.batchNumber || "Unnumbered batch"}</p><p className="text-xs text-muted-foreground">{row.original.batchId.slice(0, 8)}</p>
  </div> }),
  column.accessor("status", { header: "Outcome", size: 145, cell: ({ row }) => <Badge variant={row.original.status === "blocked" ? "destructive" : "secondary"}>{labels[row.original.status]}</Badge> }),
  column.display({ id: "details", header: "Review", cell: ({ row }) => {
    const item = row.original;
    return <div className="min-w-0 space-y-2 break-words text-sm">
      {item.message ? <p>{item.message}</p> : null}
      {item.materials ? <>
        {item.materials.approvalRequired ? <p>Fresh requisition approval required</p> : null}
        <details><summary className="cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-ring">Review {item.materials.lines.length} material {item.materials.lines.length === 1 ? "requirement" : "requirements"}</summary>
          <ul className="space-y-3 pt-2">{item.materials.lines.map((line) => <li key={line.materialId} className="space-y-1">
            <p className="font-medium">{line.name}</p>
            <p>Requirement: {amount(line.before, line.unit)} → {amount(line.after, line.unit)}</p>
            <p className="text-xs text-muted-foreground">Reserved: {amount(line.reservedBefore, line.unit)} → {amount(line.reservedAfter, line.unit)}</p>
            {line.shortage > 0 ? <p className="text-destructive">Shortage: {amount(line.shortage, line.unit)}</p> : null}
          </li>)}</ul>
        </details>
      </> : null}
      {item.procedure ? <>
        <p>{item.procedure.stepsUpdated} steps updated · {item.procedure.stepsAdded} added · {item.procedure.stepsRemoved} removed</p>
        {item.procedure.stepsKept.length ? <p>Started steps retained: {item.procedure.stepsKept.join(", ")}</p> : null}
      </> : null}
    </div>;
  } }),
]);

export function ScheduleRepairRows({ rows }: { rows: readonly ScheduleRepairBatch[] }) {
  return <ClientDataTable label="Schedule product repair preview" columns={columns} rows={rows} getRowId={(row) => row.batchId} fill={false}
    emptyTitle="No matching batches" emptyDescription="Choose a product in this schedule and reload its preview." />;
}
