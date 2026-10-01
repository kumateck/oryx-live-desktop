function parse(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  // The backend sends 0001-01-01 for a date that was never set.
  return Number.isNaN(date.getTime()) || date.getFullYear() < 1900 ? null : date;
}

/** "2 Oct 2026", or null when the value is missing or not a real date. */
export function formatDate(value: string | null | undefined): string | null {
  const date = parse(value);
  return date ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date) : null;
}

/** "2 Oct 2026, 14:05", or null when the value is missing or not a real date. */
export function formatDateTime(value: string | null | undefined): string | null {
  const date = parse(value);
  return date ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date) : null;
}
