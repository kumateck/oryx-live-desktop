import { describe, expect, it } from "vitest";
import { dateToDay, dayToDate } from "./stp-content-editor";

describe("STP header dates", () => {
  it("keep the chosen calendar day", () => {
    expect(dateToDay(dayToDate("2026-11-27")!)).toBe("2026-11-27");
    expect(dayToDate("")).toBeNull();
    expect(dayToDate("27/11/2026")).toBeNull();
  });
});
