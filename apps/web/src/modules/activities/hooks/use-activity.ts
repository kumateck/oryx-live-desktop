import { useMemo } from "react";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetApiV1ProductionScheduleActivityByProductionActivityIdQuery } from "../api/activity-api";
import { activityAudit, boardRefreshMs } from "../lib/activity-access";
import { activityProgress } from "../lib/activity-progress";
import { activitySchema } from "../schemas/activity-schema";

/**
 * One batch's production run, kept current: it is read again every half minute while the window
 * is in view, and whenever the window regains focus, so another person's progress shows up
 * without a reload. One request carries every step and the log; nothing is asked per step.
 */
export function useActivity(activityId: string) {
  const query = useGetApiV1ProductionScheduleActivityByProductionActivityIdQuery({ ...activityAudit, productionActivityId: activityId },
    { pollingInterval: boardRefreshMs, skipPollingIfUnfocused: true, refetchOnFocus: true });
  const parsed = useMemo(() => query.data ? activitySchema.safeParse(query.data) : null, [query.data]);
  const activity = parsed?.success ? parsed.data : null;
  return {
    activity,
    progress: useMemo(() => activity ? activityProgress(activity) : null, [activity]),
    loading: query.isLoading,
    notFound: Boolean(query.error && "status" in query.error && query.error.status === 404),
    error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned a production run the app could not read." : null,
    retry: () => { void query.refetch(); },
  };
}
export type ActivityState = ReturnType<typeof useActivity>;
