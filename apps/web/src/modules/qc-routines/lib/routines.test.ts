import { describe, expect, it } from "vitest";
import { calendarPeriod, certificateRows, environmentalReady, executionSchema } from "./routines";

describe("routines", () => {
  it("records the calendar month or quarter containing the routine date", () => {
    expect(calendarPeriod(new Date(Date.UTC(2026, 4, 17)), 3)).toEqual({ periodStart: "2026-04-01T00:00:00.000Z", periodEnd: "2026-07-01T00:00:00.000Z" });
    expect(calendarPeriod(new Date(Date.UTC(2026, 11, 3)), 1)).toEqual({ periodStart: "2026-12-01T00:00:00.000Z", periodEnd: "2027-01-01T00:00:00.000Z" });
  });
  it("reads routine and commercial certificate rows alike, and refuses an unreadable snapshot", () => {
    expect(certificateRows('[{"analysisType":1,"trackId":"t","formFieldId":"f","displayLabel":"TVC","specificationText":"< 100","unit":"cfu/ml","result":"12"}]')?.[0])
      .toMatchObject({ analysisType: 1, label: "TVC", specification: "< 100", unit: "cfu/ml", result: "12" });
    expect(certificateRows('[{"AnalysisType":0,"FormFieldId":"f","DisplayLabel":"pH","SpecificationText":"5-7","result":"6.1"}]')?.[0]).toMatchObject({ label: "pH", result: "6.1" });
    expect(certificateRows("not json")).toBeNull();
  });
  it("certifies an environmental routine only when every area's single track is approved", () => {
    const run = (tracks: { approved: boolean }[][]) => executionSchema.parse({ id: "r", type: 1, origin: 0, status: 1,
      samples: tracks.map((list, index) => ({ id: `s${String(index)}`, tracks: list.map((track, at) => ({ id: `t${String(at)}`, analysisType: 1, routineArdId: "a", formId: "f", approved: track.approved })) })) });
    expect(environmentalReady(run([[{ approved: true }], [{ approved: true }]]))).toBe(true);
    expect(environmentalReady(run([[{ approved: true }], [{ approved: false }]]))).toBe(false);
    expect(environmentalReady(run([]))).toBe(false);
  });
});
