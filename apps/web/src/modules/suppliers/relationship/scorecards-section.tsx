import { PermissionGuard } from "@/shared/auth/permission-guard";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListDataTable, dataTableColumns } from "@/shared/datatable";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formatDate } from "@/shared/format/dates";
import { PanelHeading } from "./panel-frame";
import { PerformanceDialog } from "./performance-dialog";
import { useGetPerformanceQuery } from "./relationship-api";
import type { Performance } from "./types";

const column = dataTableColumns<Performance>();
const percent = (value: number) => `${value.toFixed(1)}%`;

export function ScorecardsSection({ supplierId }: { supplierId: string }) {
  const [open, setOpen] = useState(false);
  const records = useGetPerformanceQuery(supplierId);
  // Newest period first.
  const rows = useMemo(() => [...(records.data ?? [])].sort((a, b) => b.periodEnd.localeCompare(a.periodEnd)), [records.data]);
  const columns = useMemo(() => column.columns([
    column.accessor("periodEnd", { header: "Period", cell: ({ row }) => <div className="min-w-0"><div>{formatDate(row.original.periodStart) ?? "–"} to {formatDate(row.original.periodEnd) ?? "–"}</div>
      {row.original.dataQualityWarnings.map((warning) => <div key={warning} className="break-words text-xs text-amber-700 dark:text-amber-400">{warning}</div>)}</div> }),
    column.accessor("score", { header: "Score", size: 90, cell: ({ row }) => <span className="font-semibold">{row.original.score.toFixed(1)}</span> }),
    column.accessor("onTimeDeliveryRate", { header: "On time", size: 150, cell: ({ row }) => <div><div>{percent(row.original.onTimeDeliveryRate)}</div>
      <div className="text-xs text-muted-foreground">{row.original.onTimeDeliveries} of {row.original.evaluatedDeliveries} deliveries</div></div> }),
    column.accessor("qualityRejectRate", { header: "Rejected", size: 150, cell: ({ row }) => <div><div>{percent(row.original.qualityRejectRate)}</div>
      <div className="text-xs text-muted-foreground">{row.original.rejectedBatches} of {row.original.evaluatedBatches} batches</div></div> }),
  ]), []);
  return <section className="min-w-0 space-y-3">
    <PanelHeading title="Scorecards" note="Saved evaluations of delivery and quality, newest first."
      action={<PermissionGuard require="CanViewSupplierPerformance"><Button size="sm" variant="outline" onClick={() => setOpen(true)}><Plus />Evaluate performance</Button></PermissionGuard>} />
    <ListDataTable label="Scorecards" columns={columns} rows={rows} getRowId={(record) => record.id ?? `${record.periodStart}-${record.periodEnd}`} loading={records.isLoading}
      error={records.error ? apiErrorMessage(records.error) : null} onRetry={() => { void records.refetch(); }}
      emptyTitle="No scorecards saved" emptyDescription="Evaluate a period to see on-time delivery and rejection rates, then save it." />
    {open ? <PerformanceDialog supplierId={supplierId} open onOpenChange={setOpen} /> : null}
  </section>;
}
