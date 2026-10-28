import { monthYearValue, parseMonthYear } from "@/shared/date-pickers/date-utils";

/**
 * The rules every form that takes a batch's manufacturing and expiry months shares. Both are "YYYY-MM".
 * A batch is not made in the future, and it expires in a later month than the one it was made in.
 */
export const currentMonth = (today: Date = new Date()) => monthYearValue(today.getFullYear(), today.getMonth() + 1);

function shift(month: string, by: number): string | undefined {
  const parsed = parseMonthYear(month);
  if (!parsed) return undefined;
  const moved = new Date(parsed.year, parsed.month - 1 + by, 1);
  return monthYearValue(moved.getFullYear(), moved.getMonth() + 1);
}

export type BatchDateField = "made" | "expires";
/** What is wrong with a batch's two months, and on which field, or null when they agree. */
export function batchDatesIssue(made: string | null | undefined, expires: string | null | undefined, today: Date = new Date()): { field: BatchDateField; message: string } | null {
  if (made && made > currentMonth(today)) return { field: "made", message: "The manufacturing date cannot be in the future" };
  if (made && expires && expires <= made) return { field: "expires", message: "The expiry date must be after the manufacturing date" };
  return null;
}

/** What each picker may offer given the other month, so a wrong pair cannot be chosen in the first place. */
export function batchDateBounds(made: string | null | undefined, expires: string | null | undefined, today: Date = new Date()): { made: { maxMonth: string }; expires: { minMonth?: string } } {
  const now = currentMonth(today);
  const before = expires ? shift(expires, -1) : undefined;
  const after = made ? shift(made, 1) : undefined;
  return { made: { maxMonth: before && before < now ? before : now }, expires: after ? { minMonth: after } : {} };
}

/** A batch is made from the first day of its month and can be used until the last day of the month it expires in; the server stores full dates. */
export const monthStartIso = (month: string) => `${month}-01T00:00:00.000Z`;
export const monthEndIso = (month: string) => new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).toISOString();
/** The "YYYY-MM" of a stored date, read in UTC so a last-day-of-month expiry is not moved by the time zone. */
export const monthOfIso = (value: string | null | undefined) => value && /^\d{4}-\d{2}/.test(value) && Number(value.slice(0, 4)) >= 1900 ? value.slice(0, 7) : null;
