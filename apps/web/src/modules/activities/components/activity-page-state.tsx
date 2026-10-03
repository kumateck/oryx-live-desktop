import type { ReactNode } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/shared/skeleton/page-skeletons";
import type { ActivityState } from "../hooks/use-activity";
import { activitiesPath } from "../lib/activity-access";
import type { Activity } from "../schemas/activity-schema";

/** Loading, missing, and failed states of a production run page, then the page itself. */
export function ActivityPageState({ state, children }: { state: ActivityState; children: (activity: Activity, progress: NonNullable<ActivityState["progress"]>) => ReactNode }) {
  if (state.loading) return <PageSkeleton label="Loading production run" />;
  if (!state.activity || !state.progress) return <div role="alert" className="flex flex-wrap items-center gap-2 text-sm">
    {state.notFound ? "This production run does not exist." : state.error ?? "The production run could not be loaded."}
    {state.notFound ? <Button asChild size="sm" variant="outline"><Link to={activitiesPath}>Back to the board</Link></Button> : <Button type="button" size="sm" variant="outline" onClick={state.retry}>Retry</Button>}
  </div>;
  return children(state.activity, state.progress);
}

/** Shown above a cancelled batch's run, in place of any action. */
export function CancelledNotice({ activity }: { activity: Activity }) {
  if (!activity.batch.cancelled) return null;
  return <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm">
    Production of this batch was cancelled. {activity.batch.cancellationReason ? `Reason: ${activity.batch.cancellationReason}` : "No reason was recorded."}</p>;
}
