import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { z } from "zod";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { scheduleApi } from "../api/schedule-api";
import { audit } from "../lib/schedule-access";
import { buildMonthlyPlan, planScheduleSchema, type PlanSchedule } from "../lib/monthly-plan";

const pageSize = 250;
const schedulesSchema = z.array(planScheduleSchema);

/**
 * The month's production plan. The server cannot filter schedules by date, so every page of schedules is
 * read once and the month is chosen here; moving between months does not ask the server again.
 */
export function useMonthlyPlan(month: Date) {
  const dispatch = useDispatch<ThunkDispatch<unknown, unknown, UnknownAction>>();
  const [schedules, setSchedules] = useState<PlanSchedule[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError(null);
    setSchedules(null);
    // A page already being read is shared rather than asked for twice; a retry asks again.
    const page = (number: number) => dispatch(scheduleApi.endpoints.getApiV1ProductionSchedule.initiate({ ...audit, page: number, pageSize },
      { subscribe: false, forceRefetch: attempt > 0 })).unwrap();
    const read = async () => {
      const first = await page(1);
      const rest = await Promise.all(Array.from({ length: Math.max((first.pageCount ?? 1) - 1, 0) }, (_, index) => page(index + 2)));
      const parsed = schedulesSchema.safeParse([first, ...rest].flatMap((result) => result.data ?? []));
      if (!parsed.success) throw new Error("The server returned schedules the app could not read.");
      return parsed.data;
    };
    read().then((data) => { if (active) setSchedules(data); }, (reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : apiErrorMessage(reason as Parameters<typeof apiErrorMessage>[0]));
    });
    return () => { active = false; };
  }, [dispatch, attempt]);

  const rows = useMemo(() => schedules ? buildMonthlyPlan(schedules, month) : [], [schedules, month]);
  return { rows, loading: schedules === null && error === null, error, retry: () => setAttempt((value) => value + 1) };
}
