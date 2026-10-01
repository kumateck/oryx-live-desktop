import { expect, it } from "vitest";
import { calendarMonths, formatMonthYear, isDateAllowed, isMonthAllowed, monthYearValue, parseMonthYear } from "./date-utils";

it("keeps date boundaries inclusive and local to the calendar day", () => {
  const limits = { minDate: new Date(2026, 3, 1), maxDate: new Date(2026, 3, 30), fromYear: 2026, toYear: 2026 };
  expect(isDateAllowed(new Date(2026, 3, 1), limits)).toBe(true);
  expect(isDateAllowed(new Date(2026, 3, 30), limits)).toBe(true);
  expect(isDateAllowed(new Date(2026, 2, 31), limits)).toBe(false);
  expect(isDateAllowed(new Date(2026, 4, 1), limits)).toBe(false);
  expect(calendarMonths(limits).startMonth?.getMonth()).toBe(3);
  expect(calendarMonths(limits).endMonth?.getMonth()).toBe(3);
  expect(calendarMonths({}).endMonth?.getFullYear()).toBe(new Date().getFullYear() + 30);
});

it("stores manufacturing and expiry values as year-month without a day", () => {
  expect(monthYearValue(2027, 2)).toBe("2027-02");
  expect(parseMonthYear("2027-02")).toEqual({ year: 2027, month: 2 });
  expect(parseMonthYear("2027-13")).toBeNull();
  expect(parseMonthYear("2027-02-01")).toBeNull();
  expect(formatMonthYear("2027-02")).toMatch(/2027/);
  expect(isMonthAllowed("2027-02", "2027-02", "2027-08")).toBe(true);
  expect(isMonthAllowed("2027-01", "2027-02", "2027-08")).toBe(false);
});
