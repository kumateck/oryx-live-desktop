import { describe, expect, it } from "vitest";
import { answerGrid, applyCellConfig, linkSourceColumns, parseTableAnswer, parseTableConfig, removeLine, resizeTable, serializeTableConfig, withLinkedValues, type TableConfig } from "./table-question";

const base: TableConfig = { rows: 3, cols: 3, cellConfigs: {} };

describe("table questions", () => {
  it("reads only well-formed tables and answers", () => {
    expect(parseTableConfig("not json")).toBeNull();
    expect(parseTableConfig(JSON.stringify({ rows: 2, cols: 2, cellConfigs: { "0-0": { type: "label", label: "Weight" } } }))?.cellConfigs["0-0"]).toEqual({ type: "label", label: "Weight" });
    expect(parseTableAnswer(JSON.stringify({ "0-1": "4.2", "bad": "x", "1-1": 3 }))).toEqual({ "0-1": "4.2", "1-1": "3" });
    expect(resizeTable(21, 2)).toBeNull();
  });
  it("merges a single cell and applies bulk scopes without spans", () => {
    const merged = applyCellConfig(base, "0-0", { type: "label", label: "Head", colspan: 2 }, "single");
    expect(merged.cellConfigs["0-1"]).toEqual({ type: "empty", isMerged: true });
    const column = applyCellConfig(base, "1-2", { type: "input", colspan: 3 }, "column");
    expect([0, 1, 2].map((row) => column.cellConfigs[`${row}-2`]?.colspan)).toEqual([1, 1, 1]);
    const range = applyCellConfig(base, "0-1", { type: "input" }, "range", { start: 3, end: 2 });
    expect(Object.keys(range.cellConfigs).sort()).toEqual(["1-1", "2-1"]);
  });
  it("removes a row, shifting cells and answers and shrinking spans across it", () => {
    const config = applyCellConfig(base, "0-0", { type: "label", rowspan: 3 }, "single");
    const result = removeLine(config, { "2-1": "x", "1-1": "gone" }, { kind: "row", index: 1 });
    expect(result?.config.rows).toBe(2);
    expect(result?.config.cellConfigs["0-0"]?.rowspan).toBe(2);
    expect(result?.answer).toEqual({ "1-1": "x" });
    expect(removeLine({ rows: 1, cols: 1, cellConfigs: {} }, {}, { kind: "row", index: 0 })).toBeNull();
  });
  it("reads an answer back as headed rows of the input columns", () => {
    const config = parseTableConfig(serializeTableConfig({ rows: 3, cols: 2, cellConfigs: { "0-0": { type: "label", label: "Reading" }, "0-1": { type: "label", label: "Value" }, "1-1": { type: "input" }, "2-1": { type: "input" } } }));
    expect(answerGrid(config, { "1-1": "4.1", "2-1": " " })).toEqual({ headers: ["Value"], rows: [["4.1"]] });
  });
});

describe("linked cells", () => {
  // Reagents used: column 0 picks a reagent from the record list, column 1 shows its code, column 2 its name.
  const config: TableConfig = { rows: 3, cols: 3, cellConfigs: {
    "0-0": { type: "label", label: "Reagent" }, "0-1": { type: "label", label: "Code" },
    ...Object.fromEntries([1, 2].flatMap((row) => [
      [`${String(row)}-0`, { type: "select", dataSource: "async", asyncSource: "reagents" }],
      [`${String(row)}-1`, { type: "linked", linkSource: 0, linkProperty: "code" }],
      [`${String(row)}-2`, { type: "linked", linkSource: 0, linkProperty: "name" }],
    ])),
  } };
  const agar = { name: "Soyabean-Casein Digest Agar", code: "QCD/RGT/SCDA-013" };

  it("round-trips a linked cell's source and property", () => {
    expect(parseTableConfig(serializeTableConfig(config))?.cellConfigs["1-1"]).toEqual({ type: "linked", linkSource: 0, linkProperty: "code" });
  });
  it("fills the linked cells of the same row from the chosen record, and clears them when the choice is cleared", () => {
    const filled = withLinkedValues(config, { "2-1": "QCD/RGT/OTHER" }, "1-0", "id-1", agar);
    expect(filled).toEqual({ "1-0": "id-1", "1-1": "QCD/RGT/SCDA-013", "1-2": "Soyabean-Casein Digest Agar", "2-1": "QCD/RGT/OTHER" });
    expect(withLinkedValues(config, filled, "1-0", "", null)).toMatchObject({ "1-1": "", "1-2": "" });
  });
  it("offers only record-list cells of the same row as sources, and reads linked columns back", () => {
    expect(linkSourceColumns(config, "1-1")).toEqual([0]);
    expect(linkSourceColumns(config, "0-1")).toEqual([]);
    expect(answerGrid(config, withLinkedValues(config, {}, "1-0", "id-1", agar)).rows).toEqual([["id-1", "QCD/RGT/SCDA-013", "Soyabean-Casein Digest Agar"]]);
  });
});
