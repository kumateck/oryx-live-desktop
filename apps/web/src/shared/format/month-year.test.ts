import { expect, it } from "vitest";
import { monthEnd, monthStart } from "../../modules/receiving-area/lib/checklist-request";
import { batchDateBounds, batchDatesIssue } from "../batch-dates/batch-dates";
import { formatMonthYear } from "./dates";

it("shows manufacturing and expiry dates as a month and a year", () => {
  const shown = new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(new Date(2028, 5, 1));
  // The month is the one written in the value, whatever the time zone.
  expect([formatMonthYear("2028-06-30T00:00:00Z"), formatMonthYear("2028-06-01T00:00:00"), formatMonthYear("2028-06")]).toEqual([shown, shown, shown]);
  expect([formatMonthYear("0001-01-01T00:00:00"), formatMonthYear(null), formatMonthYear("not a date")]).toEqual([null, null, null]);
});

it("stores a month as its first day when made and its last day when it expires", () => {
  expect([monthStart("2026-06"), monthEnd("2028-06"), monthEnd("2028-02"), monthEnd("2027-12")]).toEqual(["2026-06-01T00:00:00.000Z", "2028-06-30T00:00:00.000Z", "2028-02-29T00:00:00.000Z", "2027-12-31T00:00:00.000Z"]);
});

it("keeps a manufacturing month before its expiry month, and offers only months that agree", () => {
  const today = new Date(2026, 9, 2);
  expect([batchDatesIssue("2026-06", "2028-06", today), batchDatesIssue("2026-06", null, today), batchDatesIssue(null, "2028-06", today)]).toEqual([null, null, null]);
  expect(batchDatesIssue("2026-06", "2026-05", today)).toEqual({ field: "expires", message: "The expiry date must be after the manufacturing date" });
  expect(batchDatesIssue("2026-06", "2026-06", today)?.field).toBe("expires");
  expect(batchDatesIssue("2026-11", "2028-06", today)).toEqual({ field: "made", message: "The manufacturing date cannot be in the future" });
  expect(batchDateBounds(null, null, today)).toEqual({ made: { maxMonth: "2026-10" }, expires: {} });
  expect(batchDateBounds("2025-12", null, today)).toEqual({ made: { maxMonth: "2026-10" }, expires: { minMonth: "2026-01" } });
  expect(batchDateBounds(null, "2026-01", today).made).toEqual({ maxMonth: "2025-12" });
});
