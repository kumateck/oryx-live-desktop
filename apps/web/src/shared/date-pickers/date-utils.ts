export interface DateLimits {
  minDate?: Date | undefined;
  maxDate?: Date | undefined;
  fromYear?: number | undefined;
  toYear?: number | undefined;
}

function dayKey(date: Date): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

export function isSameCalendarDay(first: Date, second: Date): boolean {
  return dayKey(first) === dayKey(second);
}

export function isDateAllowed(date: Date, { minDate, maxDate, fromYear, toYear }: DateLimits): boolean {
  if (Number.isNaN(date.getTime())) return false;
  const key = dayKey(date);
  return (minDate === undefined || key >= dayKey(minDate))
    && (maxDate === undefined || key <= dayKey(maxDate))
    && (fromYear === undefined || date.getFullYear() >= fromYear)
    && (toYear === undefined || date.getFullYear() <= toYear);
}

export function calendarMonths({ minDate, maxDate, fromYear, toYear }: DateLimits): { startMonth?: Date; endMonth?: Date } {
  const first = new Date(fromYear ?? 1900, 0, 1);
  const last = new Date(toYear ?? new Date().getFullYear() + 30, 11, 1);
  return {
    startMonth: minDate && minDate > first ? minDate : first,
    endMonth: maxDate && maxDate < last ? maxDate : last,
  };
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export interface MonthYear { year: number; month: number }

export function parseMonthYear(value: string | null | undefined): MonthYear | null {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5));
  return year >= 1 && month >= 1 && month <= 12 ? { year, month } : null;
}

export function monthYearValue(year: number, month: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
}

export function formatMonthYear(value: string): string {
  const parsed = parseMonthYear(value);
  return parsed ? new Date(parsed.year, parsed.month - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : value;
}

export function isMonthAllowed(value: string, minMonth?: string, maxMonth?: string): boolean {
  return parseMonthYear(value) !== null && (!minMonth || value >= minMonth) && (!maxMonth || value <= maxMonth);
}
