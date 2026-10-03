import { expect, it } from "vitest";
import { readDelay, validDelay, writeDelay } from "./duration";
it("preserves TimeSpan days, seconds, and all fractional ticks", () => {
  const delay = readDelay("3.23:59:58.1234567");
  expect(delay).toEqual({ days: 3, hours: 23, minutes: 59, seconds: "58.1234567" });
  if (!delay) throw new Error("Missing duration");
  expect(writeDelay(delay)).toBe("3.23:59:58.1234567");
});
it("accepts the maximum .NET TimeSpan and rejects overflow or invalid clock values", () => {
  expect(readDelay("10675199.02:48:05.4775807")).not.toBeNull();
  for (const invalid of ["10675199.02:48:05.4775808", "24:00:00", "00:60:00", "-01:00:00", "00:00:60", "1.00:00:00.12345678"]) expect(readDelay(invalid)).toBeNull();
  expect(validDelay({ days: NaN, hours: 0, minutes: 0, seconds: "0" })).toBe(false);
});
