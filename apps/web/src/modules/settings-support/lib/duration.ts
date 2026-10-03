export interface DelayValues { days: number; hours: number; minutes: number; seconds: string }
const maximumTicks = 9223372036854775807n;

/** Preserve TimeSpan seconds and fractional ticks instead of dropping them on edit. */
export function readDelay(value: string): DelayValues | null {
  const match = /^(?:(\d+)\.)?(\d{1,2}):(\d{2}):(\d{2}(?:\.\d{1,7})?)$/.exec(value);
  if (!match) return null;
  const values = { days: Number(match[1] ?? 0), hours: Number(match[2]), minutes: Number(match[3]), seconds: match[4] ?? "0" };
  return validDelay(values) ? values : null;
}

export function validDelay(value: DelayValues): boolean {
  if (!Number.isSafeInteger(value.days) || value.days < 0 || value.days > 10675199
    || !Number.isInteger(value.hours) || value.hours < 0 || value.hours > 23
    || !Number.isInteger(value.minutes) || value.minutes < 0 || value.minutes > 59
    || !/^\d{1,2}(?:\.\d{1,7})?$/.test(value.seconds) || Number(value.seconds) >= 60) return false;
  const [seconds = "0", fraction = ""] = value.seconds.split(".");
  const ticks = BigInt(value.days * 86400 + value.hours * 3600 + value.minutes * 60 + Number(seconds)) * 10000000n + BigInt(fraction.padEnd(7, "0"));
  return ticks <= maximumTicks;
}

export function writeDelay(value: DelayValues): string {
  if (!validDelay(value)) throw new Error("Enter a valid delay");
  const [seconds = "0", fraction] = value.seconds.split(".");
  return `${value.days ? `${value.days}.` : ""}${String(value.hours).padStart(2, "0")}:${String(value.minutes).padStart(2, "0")}:${seconds.padStart(2, "0")}${fraction ? `.${fraction}` : ""}`;
}

export function delayLabel(value: string): string {
  const delay = readDelay(value);
  if (!delay) return value;
  const parts = [delay.days ? `${delay.days}d` : "", delay.hours ? `${delay.hours}h` : "", delay.minutes ? `${delay.minutes}m` : "", Number(delay.seconds) ? `${delay.seconds}s` : ""].filter(Boolean);
  return parts.join(" ") || "Immediately";
}
