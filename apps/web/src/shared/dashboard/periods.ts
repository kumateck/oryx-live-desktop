/** The periods a dashboard can be narrowed to. The numbers are the server's own date filter. */
export type Period = "today" | "week" | "month" | "all";
export const periodLabels: Record<Period, string> = { today: "Today", week: "This week", month: "This month", all: "All time" };
export const periodFilter: Record<Period, 0 | 1 | 2 | 3> = { today: 0, week: 1, month: 2, all: 3 };
export const periodOptions = (periods: readonly Period[] = ["today", "week", "month", "all"]) => periods.map((value) => ({ value, label: periodLabels[value] }));

/** The dates a period covers, from its first moment until the end of today. The week starts on Monday. */
export function periodRange(period: Period, now: Date = new Date()): { startDate?: string; endDate?: string } {
  if (period === "all") return {};
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const start = period === "today" ? new Date(now.getFullYear(), now.getMonth(), now.getDate()) : period === "month" ? new Date(now.getFullYear(), now.getMonth(), 1)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

/** How long ago a report was last read, for the line under a dashboard's title. */
export function updatedAgo(timestamp: number | undefined, now: number = Date.now()): string {
  if (!timestamp) return "Waiting for the first figures";
  const seconds = Math.max(0, Math.round((now - timestamp) / 1000));
  if (seconds < 10) return "Updated just now";
  if (seconds < 60) return `Updated ${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  return minutes < 60 ? `Updated ${minutes} ${minutes === 1 ? "minute" : "minutes"} ago` : `Updated ${Math.floor(minutes / 60)} ${Math.floor(minutes / 60) === 1 ? "hour" : "hours"} ago`;
}

/** True when a report came back with nothing in it: every count zero, every list empty. */
export function hasResults(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.some(hasResults);
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "boolean") return value;
  return typeof value === "object" && Object.values(value).some(hasResults);
}
