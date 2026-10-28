import { describe, expect, it } from "vitest";
import { buildWorksheetCells, definitionsFor, fieldOptions, worksheetColumns, worksheetFieldSchema, worksheetPermission, type WorksheetField } from "./worksheet-model";
const field = (overrides: Partial<WorksheetField> = {}) => worksheetFieldSchema.parse({ id: "f", fieldKey: "reading", label: "Reading", type: 2, mode: 1, readOnly: false, requiredForSubmission: true, values: [], ...overrides });
describe("governed worksheet coordinates", () => {
  it("never submits constants, calculated or reference results", () => {
    for (const entry of [field({ mode: 0 }), field({ mode: 2 }), field({ type: 24 }), field({ readOnly: true }), field({ type: 9 })]) expect(definitionsFor(entry)).toEqual([]);
  });
  it("retains the exact entered string and table coordinates while excluding fixed/calculated columns", () => {
    const table = field({ type: 8, columnDefinitions: JSON.stringify([
      { key: "sample", fixedValues: ["Tablet 1", "Tablet 2"], rowHeader: true },
      { key: "weight", type: "Number" }, { key: "computed", mode: "Calculated" },
    ]), values: [{ fieldKey: "reading", rowIndex: 1, columnKey: "weight", value: "0.0000001234500" }] });
    const definitions = definitionsFor(table);
    expect(definitions.map((cell) => [cell.rowIndex, cell.columnKey])).toEqual([[0, "weight"], [1, "weight"]]);
    expect(worksheetColumns(table)[2]?.calculated).toBe(true);
    const record = { id: "w", testRequestSubjectId: "subject", worksheetTemplateVersion: 4, analysisType: 0 as const, status: 1, approved: false, sections: [{ id: "s", order: 0, fields: [table] }] };
    expect(buildWorksheetCells(record, definitions).cells[1]?.value).toBe("0.0000001234500");
  });
  it("uses distinct reagent coordinates and rejects malformed table definitions", () => {
    expect(definitionsFor(field({ type: 15 })).map((cell) => cell.columnKey)).toEqual(["reagentId", "batchNo", "expiryDate"]);
    expect(() => definitionsFor(field({ type: 8, columnDefinitions: "broken" }))).toThrow();
  });
  it("keeps independent chemical and microbial permissions", () => {
    expect(worksheetPermission(0, "enter")).toBe("CanEnterChemicalWorksheetResult");
    expect(worksheetPermission(1, "review")).toBe("CanReviewMicrobialWorksheet");
  });
  it("keeps numeric fixed cells template-owned and uses the backend choice vocabulary", () => {
    const table = field({ type: 8, columnDefinitions: JSON.stringify([{ key: "point", fixedValues: [1, 2] }, { key: "growth", type: "GrowthObservation" }]) });
    expect(worksheetColumns(table)[0]?.fixedValues).toEqual(["1", "2"]);
    expect(definitionsFor(table).map((cell) => cell.columnKey)).toEqual(["growth", "growth"]);
    expect(definitionsFor(table)[0]?.options).toEqual(["Growth", "No Growth", "Absent", "Detected", "TNTC"]);
    expect(fieldOptions(5, '[" Pass ","pass","","Fail"]')).toEqual(["Pass", "Fail"]);
  });
});
