import type { ReactNode } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/shared/skeleton/page-skeletons";
import type { ScheduleState } from "../hooks/use-schedule";
import { scheduleDetailPath, schedulesPath } from "../lib/schedule-access";
import type { SchedulePhase } from "../lib/schedule-dates";
import type { ScheduleRow } from "../schemas/schedule-schema";

/**
 * Loading, missing, and failed states of a schedule page, then the page itself. With `changing`,
 * an ended schedule shows why it can no longer be changed in place of the page.
 */
export function SchedulePageState({ state, changing, children }: {
  state: ScheduleState;
  /** What the page would change, e.g. "Products cannot be added". Leave out for a page that only shows. */
  changing?: string;
  children: (schedule: ScheduleRow, phase: SchedulePhase) => ReactNode;
}) {
  if (state.loading) return <PageSkeleton label="Loading schedule" />;
  if (!state.schedule || !state.phase) return <div role="alert" className="flex flex-wrap items-center gap-2 text-sm">
    {state.notFound ? "This schedule does not exist or was removed." : state.error ?? "The schedule could not be loaded."}
    {state.notFound ? <Button asChild size="sm" variant="outline"><Link to={schedulesPath}>Back to schedules</Link></Button>
      : <Button type="button" size="sm" variant="outline" onClick={state.retry}>Retry</Button>}
  </div>;
  if (changing && state.phase === "ended") return <div role="alert" className="space-y-3 rounded-lg border bg-card p-4 text-sm">
    <p>{state.schedule.code ?? "This schedule"} has ended. {changing}.</p>
    <Button asChild variant="outline" size="sm"><Link to={scheduleDetailPath(state.schedule.id)}>View the schedule</Link></Button>
  </div>;
  return children(state.schedule, state.phase);
}
