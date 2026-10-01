import { expect, it } from "vitest";
import { formatClockValue, formatDurationValue, fromTimeInput, parseClockValue, parseDurationValue, toTimeInput } from "./time-value";

it("round trips 12-hour clock values and optional day counts", () => {
  expect(parseClockValue("2d 11:45 PM")).toEqual({ days: 2, hour: 23, minute: 45 });
  expect(formatClockValue({ days: 2, hour: 0, minute: 5 })).toBe("2d 12:05 AM");
  expect(toTimeInput("2d 11:45 PM")).toBe("23:45");
  expect(fromTimeInput("23:45", 2)).toBe("2d 11:45 PM");
  expect(fromTimeInput("24:00")).toBeNull();
});

it("preserves the legacy duration wording", () => {
  expect(parseDurationValue("2 hours 15 minutes")).toEqual({ hours: 2, minutes: 15 });
  expect(formatDurationValue({ hours: 1, minutes: 1 })).toBe("1 hour 1 minute");
  expect(parseDurationValue("2 hours 70 minutes")).toBeNull();
});
