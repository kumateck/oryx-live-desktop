const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

function parse(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  // The backend sends 0001-01-01 for a date that was never set.
  return Number.isNaN(date.getTime()) || date.getFullYear() < 1900 ? null : date;
}

/** "2 Oct 2026", or null when the value is missing or not a real date. */
export function formatDate(value: string | null | undefined): string | null {
  const date = parse(value);
  return date ? dateFormatter.format(date) : null;
}

/** "2 Oct 2026, 14:05", or null when the value is missing or not a real date. */
export function formatDateTime(value: string | null | undefined): string | null {
  const date = parse(value);
  return date ? dateTimeFormatter.format(date) : null;
}

const monthYearFormatter = new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" });

/**
 * "Oct 2026", or null when the value is missing or not a real date. Manufacturing and expiry dates are month and
 * year, never a day. The month is read as it is written in the value, so a time zone cannot move it to a neighbour.
 */
export function formatMonthYear(value: string | null | undefined): string | null {
  const written = /^(\d{4})-(\d{2})/.exec(value ?? "");
  if (written) {
    const year = Number(written[1]);
    const month = Number(written[2]);
    return year >= 1900 && month >= 1 && month <= 12 ? monthYearFormatter.format(new Date(year, month - 1, 1)) : null;
  }
  const date = parse(value);
  return date ? monthYearFormatter.format(date) : null;
}
