const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export const today = (now = new Date()) => startOfDay(now);
export const tomorrow = (now = new Date()) => addDays(now, 1);
/** Schedules are planned at most a year ahead. */
export const latestScheduleDate = (now = new Date()) => new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

/** A schedule whose end has passed can no longer be changed. A missing or unreadable end is treated as not ended. */
export function isScheduleEnded(end: string | null | undefined, now = new Date()): boolean {
  const time = end ? new Date(end).getTime() : Number.NaN;
  return !Number.isNaN(time) && time <= now.getTime();
}

export type SchedulePhase = "upcoming" | "running" | "ended";
export function schedulePhase(start: string | null | undefined, end: string | null | undefined, now = new Date()): SchedulePhase {
  if (isScheduleEnded(end, now)) return "ended";
  const time = start ? new Date(start).getTime() : Number.NaN;
  return !Number.isNaN(time) && time > now.getTime() ? "upcoming" : "running";
}

interface DateIssue { path: "scheduledStartTime" | "scheduledEndTime"; message: string }

/**
 * The backend's date rules for a new schedule, checked before sending: the end is not before the
 * start and has not passed. A date is the start of its day, so an end of today has already passed.
 */
export function newScheduleDateIssues(start: Date, end: Date, now = new Date()): DateIssue[] {
  const issues: DateIssue[] = [];
  if (startOfDay(start) < today(now)) issues.push({ path: "scheduledStartTime", message: "The start date cannot be in the past" });
  if (startOfDay(end) < startOfDay(start)) issues.push({ path: "scheduledEndTime", message: "The end date cannot be before the start date" });
  else if (startOfDay(end) <= today(now)) issues.push({ path: "scheduledEndTime", message: "The end date must be after today" });
  return issues;
}

/** The backend's rules for changing a schedule: the start is still ahead, and the end is after the start. */
export function changedScheduleDateIssues(start: Date, end: Date, now = new Date()): DateIssue[] {
  const issues: DateIssue[] = [];
  if (startOfDay(start) <= today(now)) issues.push({ path: "scheduledStartTime", message: "The start date must be after today" });
  if (startOfDay(end) <= startOfDay(start)) issues.push({ path: "scheduledEndTime", message: "The end date must be after the start date" });
  return issues;
}
