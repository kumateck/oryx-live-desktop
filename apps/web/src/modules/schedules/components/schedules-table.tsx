import { useMemo } from "react";
import { TableMenu, TableMenuHeader } from "@/shared/actions";
import { ServerDataTable, dataTableColumns } from "@/shared/datatable";
import { formatDate } from "@/shared/format/dates";
import { scheduleActions } from "../lib/schedule-actions";
import { schedulePhase } from "../lib/schedule-dates";
import { summarizeBatches } from "../lib/schedule-products";
import type { ScheduleRow } from "../schemas/schedule-schema";
import { SchedulePhaseBadge } from "./schedule-phase-badge";

const column = dataTableColumns<ScheduleRow>();
const dash = "–";
const shown = 3;
function Batches({ schedule }: { schedule: ScheduleRow }) {
  const lines = summarizeBatches(schedule.products);
  if (lines.length === 0) return <span className="text-muted-foreground">No products</span>;
  const rest = lines.length - shown;
  return <ul className="min-w-0 space-y-0.5" title={rest > 0 ? lines.join("\n") : undefined}>
    {lines.slice(0, shown).map((line) => <li key={line} className="break-words">{line}</li>)}
    {rest > 0 ? <li className="text-xs text-muted-foreground">and {rest} more</li> : null}
  </ul>;
}

export function SchedulesTable({ rows, search, paging, loading, refreshing, error, onRetry, onOpen }: {
  rows: readonly ScheduleRow[];
  search: string;
  paging: { page: number; pageSize: number; totalRows: number; onPageChange: (page: number) => void; onPageSizeChange: (pageSize: number) => void };
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  onRetry: () => void;
  onOpen: (schedule: ScheduleRow) => void;
}) {
  const columns = useMemo(() => column.columns([
    column.accessor((schedule) => schedule.code ?? dash, { id: "code", header: "Code", size: 160 }),
    column.display({ id: "products", header: "Products", cell: ({ row }) => <Batches schedule={row.original} /> }),
    column.accessor((schedule) => formatDate(schedule.scheduledStartTime) ?? dash, { id: "start", header: "Start", size: 130 }),
    column.accessor((schedule) => formatDate(schedule.scheduledEndTime) ?? dash, { id: "end", header: "End", size: 130 }),
    column.display({ id: "status", header: "Status", size: 120, cell: ({ row }) => <SchedulePhaseBadge phase={schedulePhase(row.original.scheduledStartTime, row.original.scheduledEndTime)} /> }),
    column.display({ id: "actions", header: TableMenuHeader, size: 56, enableHiding: false, cell: ({ row }) => <TableMenu label={`Actions for ${row.original.code ?? "schedule"}`}
      items={scheduleActions(row.original.id, schedulePhase(row.original.scheduledStartTime, row.original.scheduledEndTime) === "ended", true)} /> }),
  ]), []);

  return <ServerDataTable label="Production schedules" columns={columns} rows={rows} getRowId={(schedule) => schedule.id} {...paging} loading={loading}
    refreshing={refreshing} error={error} onRetry={onRetry} onRowOpen={onOpen}
    emptyTitle={search.trim() ? "No schedules match this search" : "No production schedules yet"}
    emptyDescription={search.trim() ? "Check the spelling, or search by schedule code." : undefined} />;
}
