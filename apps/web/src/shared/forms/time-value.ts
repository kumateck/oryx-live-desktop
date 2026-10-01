export interface ClockValue {
  days: number;
  hour: number;
  minute: number;
}

export interface DurationValue {
  hours: number;
  minutes: number;
}

export function parseClockValue(value: string | null | undefined): ClockValue | null {
  const match = /^(?:(\d+)d )?(\d{1,2}):(\d{2}) (AM|PM)$/i.exec(value ?? "");
  if (!match) return null;
  const hour12 = Number(match[2]);
  const minute = Number(match[3]);
  const days = Number(match[1] ?? 0);
  if (hour12 > 12 || minute > 59 || !Number.isSafeInteger(days)) return null;
  const hour = (hour12 % 12) + (match[4]?.toUpperCase() === "PM" ? 12 : 0);
  return { days, hour, minute };
}

export function formatClockValue(value: ClockValue): string {
  const hour12 = value.hour % 12 || 12;
  const period = value.hour >= 12 ? "PM" : "AM";
  const time = `${String(hour12).padStart(2, "0")}:${String(value.minute).padStart(2, "0")} ${period}`;
  return value.days > 0 ? `${value.days}d ${time}` : time;
}

export function toTimeInput(value: string | null | undefined): string {
  const parsed = parseClockValue(value);
  return parsed ? `${String(parsed.hour).padStart(2, "0")}:${String(parsed.minute).padStart(2, "0")}` : "";
}

export function fromTimeInput(value: string, days = 0): string | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59 || !Number.isSafeInteger(days) || days < 0) return null;
  return formatClockValue({ days, hour, minute });
}

export function parseDurationValue(value: string | null | undefined): DurationValue | null {
  const match = /^(?:(\d+) hours?)?(?:\s*(\d+) minutes?)?$/i.exec(value ?? "");
  if (!match || (!match[1] && !match[2])) return null;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  return Number.isSafeInteger(hours) && minutes <= 59 ? { hours, minutes } : null;
}

export function formatDurationValue({ hours, minutes }: DurationValue): string {
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
  return parts.join(" ");
}
