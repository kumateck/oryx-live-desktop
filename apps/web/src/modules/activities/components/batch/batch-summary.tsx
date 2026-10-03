import { Link } from "react-router";
import { scheduleDetailPath } from "@/modules/schedules/lib/schedule-access";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { formatDateTime } from "@/shared/format/dates";
import { toLargestUnit } from "@/shared/units/quantity";
import { duration } from "../../lib/activity-progress";
import type { Activity } from "../../schemas/activity-schema";

/** The batch a run belongs to, and how long the run has taken. */
export function BatchSummary({ activity, finished }: { activity: Activity; finished: boolean }) {
  const batch = activity.batch;
  const size = toLargestUnit(batch.quantity, batch.unit, "calculated")?.text;
  return <KeyFacts>
    <KeyFact label="Batch number" value={batch.batchNumber ?? "Not assigned"} note={batch.productCode ?? undefined} />
    <KeyFact label="Batch size" value={size ?? "–"} note={`${batch.half ? "Half" : "Full"} batch${batch.packing ? ` · ${batch.packing}` : ""}`} />
    <KeyFact label="Schedule" value={batch.scheduleId && batch.id ? <Link className="text-primary underline-offset-2 hover:underline" to={`${scheduleDetailPath(batch.scheduleId)}?batch=${batch.id}`}>{batch.scheduleCode ?? "Open"}</Link> : batch.scheduleCode ?? "–"}
      note={batch.market ? `Market: ${batch.market}` : undefined} />
    <KeyFact label="Started" value={formatDateTime(activity.startedAt) ?? "–"} />
    <KeyFact label={finished ? "Took" : "Running for"} value={duration(activity.startedAt, finished ? activity.completedAt ?? new Date() : new Date()) ?? "–"}
      note={finished && activity.completedAt ? `Finished ${formatDateTime(activity.completedAt) ?? ""}` : undefined} />
  </KeyFacts>;
}
