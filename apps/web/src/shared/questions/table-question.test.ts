import { describe, expect, it } from "vitest";
import { answerGrid, applyCellConfig, parseTableAnswer, parseTableConfig, removeLine, resizeTable, serializeTableConfig, type TableConfig } from "./table-question";

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
