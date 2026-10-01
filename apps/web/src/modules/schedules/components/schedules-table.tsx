import { useMemo } from "react";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ServerDataTable, dataTableColumns } from "@/shared/datatable";
import { formatDate } from "@/shared/format/dates";
import { scheduleEditPath, schedulePermissions } from "../lib/schedule-access";
import { schedulePhase, type SchedulePhase } from "../lib/schedule-dates";
import { summarizeBatches } from "../lib/schedule-products";
import type { ScheduleRow } from "../schemas/schedule-schema";

const column = dataTableColumns<ScheduleRow>();
const dash = "–";
const shown = 3;
const phases: Record<SchedulePhase, { label: string; variant: "default" | "secondary" | "outline" }> = {
  upcoming: { label: "Upcoming", variant: "outline" }, running: { label: "In progress", variant: "default" }, ended: { label: "Ended", variant: "secondary" },
};

function Batches({ schedule }: { schedule: ScheduleRow }) {
  const lines = summarizeBatches(schedule.products);
  if (lines.length === 0) return <span className="text-muted-foreground">No products</span>;
  const rest = lines.length - shown;
  return <ul className="min-w-0 space-y-0.5" title={rest > 0 ? lines.join("\n") : undefined}>
    {lines.slice(0, shown).map((line) => <li key={line} className="break-words">{line}</li>)}
    {rest > 0 ? <li className="text-xs text-muted-foreground">and {rest} more</li> : null}
  </ul>;
}

export function SchedulesTable({ rows, search, paging, loading, refreshing, error, onRetry }: {
  rows: readonly ScheduleRow[];
  search: string;
  paging: { page: number; pageSize: number; totalRows: number; onPageChange: (page: number) => void; onPageSizeChange: (pageSize: number) => void };
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor((schedule) => schedule.code ?? dash, { id: "code", header: "Code", size: 160 }),
    column.display({ id: "products", header: "Products", cell: ({ row }) => <Batches schedule={row.original} /> }),
    column.accessor((schedule) => formatDate(schedule.scheduledStartTime) ?? dash, { id: "start", header: "Start", size: 130 }),
    column.accessor((schedule) => formatDate(schedule.scheduledEndTime) ?? dash, { id: "end", header: "End", size: 130 }),
    column.display({ id: "status", header: "Status", size: 120, cell: ({ row }) => {
      const phase = phases[schedulePhase(row.original.scheduledStartTime, row.original.scheduledEndTime)];
      return <Badge variant={phase.variant}>{phase.label}</Badge>;
    } }),
    column.display({ id: "actions", header: TableMenuHeader, size: 56, enableHiding: false, cell: ({ row }) => {
      const ended = schedulePhase(row.original.scheduledStartTime, row.original.scheduledEndTime) === "ended";
      return <TableMenu label={`Actions for ${row.original.code ?? "schedule"}`} items={[
        { id: "edit", label: "Edit dates and remarks", icon: Pencil, require: schedulePermissions.edit, to: scheduleEditPath(row.original.id),
          ...(ended ? { disabled: true, disabledReason: "This schedule has ended" } : {}) },
      ]} />;
    } }),
  ]), []);

  return <ServerDataTable label="Production schedules" columns={columns} rows={rows} getRowId={(schedule) => schedule.id} {...paging} loading={loading}
    refreshing={refreshing} error={error} onRetry={onRetry}
    emptyTitle={search.trim() ? "No schedules match this search" : "No production schedules yet"}
    emptyDescription={search.trim() ? "Check the spelling, or search by schedule code." : undefined} />;
}
