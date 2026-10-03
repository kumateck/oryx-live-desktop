/** Dates that something falls due on: how far off they are and how to say it. */
const day = 86_400_000;
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** Whole days from today to a date: 0 is today, negative is past. Null when the date is missing or unreadable. */
export function daysUntil(value: string | null | undefined, now = new Date()): number | null {
  const time = value ? new Date(value).getTime() : Number.NaN;
  return Number.isNaN(time) ? null : Math.round((startOfDay(new Date(time)) - startOfDay(now)) / day);
}

/** How close a due date counts as "soon", for requalification and certificates alike. */
export const dueSoonDays = 60;
export type DueState = "none" | "ok" | "soon" | "overdue";
export function dueState(days: number | null): DueState {
  return days === null ? "none" : days < 0 ? "overdue" : days <= dueSoonDays ? "soon" : "ok";
}
/** "in 12 days", "today", "3 days overdue". */
export function dueText(days: number): string {
  if (days === 0) return "today";
  const count = Math.abs(days);
  return days < 0 ? `${count} ${count === 1 ? "day" : "days"} overdue` : `in ${count} ${count === 1 ? "day" : "days"}`;
}
