/** Date-only controls represent local calendar dates; serialize stable UTC boundaries for the server. */
export function utcBoundary(date: Date, endOfDay = false): string {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(),
    endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0)).toISOString();
}

export function formDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const calendar = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (calendar) {
    const year = Number(calendar[1]);
    const month = Number(calendar[2]);
    const day = Number(calendar[3]);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
