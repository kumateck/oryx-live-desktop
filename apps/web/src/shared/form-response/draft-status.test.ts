import { describe, expect, it } from "vitest";
import { QuestionType } from "@/shared/questions/question-types";
import { answerComplete, formulaAnswerComplete } from "./answer-completeness";
import { draftStatus } from "./draft-status";
import { fieldSchema } from "./form-model";

const field = fieldSchema.parse({ id: "answer", question: { label: "Result", type: QuestionType.ShortAnswer } });
const stored = new Map([[field.id, { value: "Complies", responseId: "response" }]]);

it("requires the current answer to match a saved draft and rejects clearing a previously saved answer", () => {
  expect(draftStatus(field, "New result", true, stored, new Map())).toBe("unsaved");
  expect(draftStatus(field, null, true, stored, new Map())).toBe("incomplete");
  expect(draftStatus(field, " ", true, stored, new Map())).toBe("incomplete");
  expect(draftStatus(field, "Complies", true, stored, new Map())).toBe("saved");
  expect(draftStatus(field, "New result", true, stored, new Map([[field.id, "New result"]]))).toBe("saved");
});

it("requires other analysts' saved answers, including optional test fields", () => {
  expect(draftStatus(field, "Complies", false, new Map(), new Map())).toBe("incomplete");
  expect(draftStatus(field, undefined, false, stored, new Map())).toBe("saved");
  expect(draftStatus(field, undefined, false, new Map([[field.id, { value: null, responseId: "response" }]]), new Map())).toBe("incomplete");
});

describe("formula draft completeness", () => {
  const config = JSON.stringify({ type: 3, expression: ":sample1Avg / :standardAvg * :factor", numberOfSamples: 1, numberOfReadings: 2,
    standardInTable: true, standardInputs: [{ key: "wt" }], sampleInputs: [[{ key: "wt" }]], manualVarLabels: { factor: "Factor" } });
  const answer = { standardInputs: { wt: "0.321" }, sampleInputs: [{ wt: "0.2" }], tableData: [["1", "2"], ["3", "4"]], manualVars: { factor: { raw: "100", evaluated: 100, label: "" } } };
  const complete = (value: object) => formulaAnswerComplete(JSON.stringify(value), config);

  it("rejects null, empty, malformed and missing data", () => {
    for (const value of ["null", "{}", "[]", "broken"]) expect(formulaAnswerComplete(value, config)).toBe(false);
    expect(complete({ ...answer, standardInputs: {} })).toBe(false);
    expect(complete({ ...answer, standardInputs: { wt: null } })).toBe(false);
    expect(complete({ ...answer, sampleInputs: [] })).toBe(false);
    expect(complete({ ...answer, tableData: [["1", "2"], ["3", ""]] })).toBe(false);
    expect(complete({ ...answer, tableData: [["1", "2"]] })).toBe(false);
    expect(complete({ ...answer, manualVars: { factor: { raw: "bad", evaluated: null } } })).toBe(false);
    expect(complete({ ...answer, manualVars: {} })).toBe(false);
    expect(complete(answer)).toBe(true);
  });

  it("accepts zero as an entered number and ignores optional label metadata", () => {
    expect(complete({ ...answer, standardInputs: { wt: "0" }, tableData: [["0", "0"], ["0", "0"]] })).toBe(true);
    expect(complete({ ...answer, manualVars: { ...answer.manualVars, unused: { raw: "", evaluated: null } } })).toBe(true);
  });

  it("checks simple formula variables and permits configured constants", () => {
    const simple = JSON.stringify({ type: 0, expression: ":a + :b + :constant", constants: { constant: 2 } });
    expect(formulaAnswerComplete('{"a":0,"b":null}', simple)).toBe(false);
    expect(formulaAnswerComplete('{"a":0}', simple)).toBe(false);
    expect(formulaAnswerComplete('{"a":0,"b":2}', simple)).toBe(true);
  });

  it("checks uniformity inputs without requiring results for an unused mode", () => {
    const uniformity = JSON.stringify({ type: 2, mode: "tablet", sampleCount: 2 });
    expect(formulaAnswerComplete(JSON.stringify({ inputs: { bulkTotal: "4", indWts: ["2", ""] } }), uniformity)).toBe(false);
    expect(formulaAnswerComplete(JSON.stringify({ inputs: { bulkTotal: "4", indWts: ["2", "2"] }, results: { totalContent: null } }), uniformity)).toBe(true);
  });
});

it("requires every configured editable table cell", () => {
  const table = fieldSchema.parse({ id: "table", question: { type: QuestionType.Table, options: [{ name: JSON.stringify({ rows: 1, cols: 2, cellConfigs: { "0-0": { type: "input" }, "0-1": { type: "select" } } }) }] } });
  expect(answerComplete(table, '{"0-0":"0","0-1":""}')).toBe(false);
  expect(answerComplete(table, '{"0-0":"0","0-1":"Complies"}')).toBe(true);
});
