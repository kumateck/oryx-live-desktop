import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { batchLabel, batchState, groupBatches } from "../../lib/schedule-batches";
import type { SchedulePhase } from "../../lib/schedule-dates";
import type { ScheduleRow } from "../../schemas/schedule-schema";
import { ScheduleSummary } from "../schedule-summary";
import { BatchNav } from "./batch-nav";
import { BatchPanel } from "./batch-panel";

/** A schedule and its batches. The open batch is kept in the address as ?batch= so it survives reload and can be linked. */
export function ScheduleDetail({ schedule, phase }: { schedule: ScheduleRow; phase: SchedulePhase }) {
  const groups = useMemo(() => groupBatches(schedule.products), [schedule.products]);
  const [params, setParams] = useSearchParams();
  const batches = useMemo(() => groups.flatMap((group) => group.batches.flatMap((batch, index) => batch.id ? [{ id: batch.id, batch, label: batchLabel(batch, index) }] : [])), [groups]);
  const requested = params.get("batch");
  const open = batches.find((item) => item.id === requested) ?? batches[0] ?? null;
  const select = (id: string) => setParams((current) => { const next = new URLSearchParams(current); next.set("batch", id); return next; }, { replace: true });

  return <div className="min-w-0 space-y-4">
    <ScheduleSummary schedule={schedule} phase={phase} showProducts={false} />
    {open ? <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[20rem_minmax(0,1fr)]">
      <BatchNav groups={groups} scheduleEnd={schedule.scheduledEndTime} active={open.id} onSelect={select} />
      {/* Keyed by batch so one batch's messages and dialogs never carry over to another. */}
      <BatchPanel key={open.id} batch={open.batch} batchId={open.id} label={open.label} state={batchState(open.batch, schedule.scheduledEndTime)} />
    </div> : <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">This schedule has no products yet.</p>}
  </div>;
}
