import { describe, expect, it } from "vitest";
import { joinMoment, splitMoment } from "./microbial-answer-field";

describe("incubation moments", () => {
  it("split into a calendar day and a time, and join back to the same instant", () => {
    const iso = new Date(2026, 10, 20, 8, 30).toISOString();
    const parts = splitMoment(iso);
    expect(parts.time).toBe("08:30");
    expect(joinMoment(parts.day, parts.time)).toBe(iso);
    expect(joinMoment(null, "08:30")).toBeNull();
    expect(splitMoment(null)).toEqual({ day: null, time: "" });
  });
});
