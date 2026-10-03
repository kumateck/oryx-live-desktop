import { useEffect, useMemo, useState } from "react";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { useGetApiV1ProductionScheduleByScheduleIdQuery } from "../api/schedule-api";
import { audit } from "../lib/schedule-access";
import { schedulePhase } from "../lib/schedule-dates";
import { scheduleRowSchema } from "../schemas/schedule-schema";

/** One schedule with its batches. `phase` moves to "ended" by itself when the end time passes while the page is open. */
export function useSchedule(scheduleId: string) {
  const query = useGetApiV1ProductionScheduleByScheduleIdQuery({ ...audit, scheduleId });
  const parsed = useMemo(() => query.data ? scheduleRowSchema.safeParse(query.data) : null, [query.data]);
  const schedule = parsed?.success ? parsed.data : null;
  const [, tick] = useState(0);
  const end = schedule?.scheduledEndTime;
  useEffect(() => {
    const remaining = end ? new Date(end).getTime() - Date.now() : Number.NaN;
    // Timers cannot wait longer than about 24 days; a schedule further off is simply read again on the next visit.
    if (!(remaining > 0) || remaining > 2_000_000_000) return;
    const timer = setTimeout(() => tick((value) => value + 1), remaining + 500);
    return () => clearTimeout(timer);
  }, [end]);

  return {
    schedule,
    phase: schedule ? schedulePhase(schedule.scheduledStartTime, schedule.scheduledEndTime) : null,
    loading: query.isLoading,
    refreshing: query.isFetching && !query.isLoading,
    notFound: Boolean(query.error && "status" in query.error && query.error.status === 404),
    error: query.error ? apiErrorMessage(query.error) : parsed && !parsed.success ? "The server returned a schedule the app could not read." : null,
    retry: () => { void query.refetch(); },
  };
}
export type ScheduleState = ReturnType<typeof useSchedule>;
