import { z } from "zod";
import { api } from "@/shared/api/base-api";
import { settingsApi } from "@/shared/api/generated/settings";
import { parseClockValue } from "@/shared/forms/time-value";

export const workingDayPermissions = { view: "CanViewWorkingDays", save: "CanCreateWorkingDays", reset: "CanResetWorkingDays" } as const;
export const workingDayAudit = { module: "Settings", subModule: "Working Days" } as const;
/** In the server's numbering: 0 is Sunday. */
export const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

const list = { type: "WorkingDays" as const, id: "all" };
export interface WorkingDayBody { day: number; isWorkingDay: boolean; startTime: string; endTime: string }
/** Saving is not in the server's published contract, so it is declared here. It replaces the whole week. */
const saveApi = api.injectEndpoints({ endpoints: (build) => ({
  saveWorkingDays: build.mutation<unknown, WorkingDayBody[]>({ query: (body) => ({ url: "/api/v1/working-days", method: "POST", body, headers: { Module: workingDayAudit.module, SubModule: workingDayAudit.subModule } }), invalidatesTags: (_result, error) => error ? [] : [list] }),
}) });
export const { useSaveWorkingDaysMutation } = saveApi;
export const workingDayApi = settingsApi.enhanceEndpoints({ endpoints: { getApiV1WorkingDays: { providesTags: [list] } } });

const text = z.string().nullish().transform((value) => value ?? "");
export const workingDaysSchema = z.object({ data: z.array(z.object({ day: z.number().nullish(), isWorkingDay: z.boolean().nullish(), startTime: text, endTime: text })).nullish() })
  .transform((page) => (page.data ?? []).flatMap((row) => row.day !== null && row.day !== undefined && row.day >= 0 && row.day <= 6 ? [{ day: row.day, isWorkingDay: row.isWorkingDay ?? true, startTime: row.startTime, endTime: row.endTime }] : []));
export type WorkingDay = z.infer<typeof workingDaysSchema>[number];

export interface WeekValues { days: { day: number; on: boolean; isWorkingDay: boolean; startTime: string; endTime: string }[] }
/** All seven days for the form, each switched on when the server has it. */
export const weekOf = (saved: readonly WorkingDay[]): WeekValues => ({ days: daysOfWeek.map((_, day) => { const found = saved.find((item) => item.day === day);
  return { day, on: Boolean(found), isWorkingDay: found?.isWorkingDay ?? true, startTime: found?.startTime ?? "", endTime: found?.endTime ?? "" }; }) });

const minutes = (value: string) => { const clock = parseClockValue(value); return clock ? clock.hour * 60 + clock.minute : null; };
/** What stops the week being saved, per day (keyed by day number), or as a whole under "week". */
export function weekProblems(values: WeekValues): Record<string, string> {
  const problems: Record<string, string> = {};
  const chosen = values.days.filter((day) => day.on);
  if (chosen.length === 0) problems.week = "Choose at least one working day.";
  for (const day of chosen) {
    const start = minutes(day.startTime), end = minutes(day.endTime);
    if (start === null || end === null) problems[day.day] = "Set the start and end time.";
    else if (end <= start) problems[day.day] = "The end time must be after the start time.";
  }
  return problems;
}
export const weekBody = (values: WeekValues): WorkingDayBody[] => values.days.filter((day) => day.on).map(({ day, isWorkingDay, startTime, endTime }) => ({ day, isWorkingDay, startTime, endTime }));
