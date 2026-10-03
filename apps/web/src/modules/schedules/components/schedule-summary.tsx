import type { ReactNode } from "react";
import { formatDate } from "@/shared/format/dates";
import { RichTextView } from "@/shared/rich-text/rich-text-view";
import { groupBatches } from "../lib/schedule-batches";
import type { SchedulePhase } from "../lib/schedule-dates";
import type { ScheduleRow } from "../schemas/schedule-schema";
import { SchedulePhaseBadge } from "./schedule-phase-badge";

const day = 86_400_000;
function duration(start: string | null | undefined, end: string | null | undefined): string | null {
  const days = start && end ? Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / day) : Number.NaN;
  return Number.isFinite(days) && days >= 0 ? `${days} ${days === 1 ? "day" : "days"}` : null;
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="min-w-0 break-words text-sm font-medium">{children}</dd></div>;
}

/** A schedule at a glance: when it runs, where it stands, and what is on it. */
export function ScheduleSummary({ schedule, phase, showProducts = true }: { schedule: ScheduleRow; phase: SchedulePhase; showProducts?: boolean }) {
  const groups = groupBatches(schedule.products);
  const length = duration(schedule.scheduledStartTime, schedule.scheduledEndTime);
  return <section className="min-w-0 space-y-3 rounded-lg border bg-card p-4">
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-5">
      <Fact label="Schedule code">{schedule.code ?? "–"}</Fact>
      <Fact label="Status"><SchedulePhaseBadge phase={phase} /></Fact>
      <Fact label="Start">{formatDate(schedule.scheduledStartTime) ?? "–"}</Fact>
      <Fact label="End">{formatDate(schedule.scheduledEndTime) ?? "–"}{length ? <span className="font-normal text-muted-foreground"> · {length}</span> : null}</Fact>
      <Fact label="Batches">{schedule.products.length}</Fact>
    </dl>
    {schedule.remarks ? <div className="min-w-0 border-t pt-3"><p className="text-xs text-muted-foreground">Remarks</p><RichTextView html={schedule.remarks} className="text-sm" /></div> : null}
    {showProducts ? <div className="min-w-0 border-t pt-3">
      <p className="mb-1 text-xs text-muted-foreground">Already on this schedule</p>
      {groups.length === 0 ? <p className="text-sm text-muted-foreground">No products yet.</p>
        : <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">{groups.map((group) => <li key={group.key} className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-medium">{group.name}</span><span className="text-xs text-muted-foreground">{group.detail}</span>
          <span className="text-xs">×{group.batches.length}</span></li>)}</ul>}
    </div> : null}
  </section>;
}
