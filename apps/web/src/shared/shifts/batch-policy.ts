import { z } from "zod";
import type { Schedule } from "./contracts";
const policySchema = z.object({
  id: z.uuid(),
  maxHoursPerDay: z.number().positive().max(24),
  maxHoursPerWeek: z.number().positive().max(168),
  minDailyRestHours: z.number().nonnegative().max(24),
  minWeeklyRestHours: z.number().nonnegative().max(168),
  effectiveFrom: z.string().refine((value) => Number.isFinite(Date.parse(value)), "Invalid policy date."),
  effectiveTo: z.string().refine((value) => Number.isFinite(Date.parse(value)), "Invalid policy end date.").nullish(),
});
export const policiesSchema = z.array(policySchema);
export type ShiftPolicy = z.infer<typeof policySchema>;
function minutes(clock: string): number | null {
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(clock);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  return h < 24 && m < 60 ? h * 60 + m : null;
}
export function batchPolicyProblem(schedule: Schedule, shiftId: string, policies: ShiftPolicy[]): string | null {
  const shift = schedule.shiftType.find((s) => s.id === shiftId);
  if (!shift) return "Choose a shift type belonging to this schedule.";
  const start = minutes(shift.startTime);
  const end = minutes(shift.endTime);
  if (start === null || end === null || start === end) return "The shift hours could not be verified.";
  const duration = ((end - start + 1440) % 1440) / 60;
  const days: { day: number; duration: number; policy: ShiftPolicy | null }[] = [];
  for (let d = Date.parse(schedule.startDate.slice(0, 10) + "T00:00:00Z"); d <= Date.parse(schedule.endDate.slice(0, 10) + "T00:00:00Z"); d += 86400000) {
    if (days.length >= 366) return "Assign schedules of at most 366 days at a time.";
    const date = new Date(d).toISOString().slice(0, 10);
    const policy =
      policies
        .filter((p) => p.effectiveFrom.slice(0, 10) <= date && (!p.effectiveTo || p.effectiveTo.slice(0, 10) > date))
        .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0] ?? null;
    if (policy && (duration > policy.maxHoursPerDay || (days.length > 0 && 24 - duration < policy.minDailyRestHours)))
      return "The proposed daily assignments breach the working-hours or daily-rest policy.";
    days.push({ day: d, duration, policy });
  }
  const weeks = new Map<number, typeof days>();
  for (const d of days) {
    const date = new Date(d.day);
    const monday = d.day - ((date.getUTCDay() + 6) % 7) * 86400000;
    const rows = weeks.get(monday) ?? [];
    rows.push(d);
    weeks.set(monday, rows);
  }
  for (const [monday, rows] of weeks) {
    const total = rows.reduce((sum, d) => sum + d.duration, 0);
    for (const row of rows) {
      if (!row.policy) continue;
      if (total > row.policy.maxHoursPerWeek)
        return "The proposed batch exceeds the weekly working-hours limit. The server assigns every calendar day; use a shorter schedule.";
      const intervals = rows.map((d) => ({ from: (d.day - monday) / 3600000 + start / 60, to: (d.day - monday) / 3600000 + start / 60 + duration }));
      let cursor = 0;
      let gap = 0;
      for (const interval of intervals) {
        gap = Math.max(gap, interval.from - cursor);
        cursor = Math.max(cursor, interval.to);
      }
      gap = Math.max(gap, 168 - cursor);
      if (gap < row.policy.minWeeklyRestHours)
        return "The proposed batch does not leave the policy's continuous weekly rest period. Shorten the schedule before assigning.";
    }
  }
  return null;
}
