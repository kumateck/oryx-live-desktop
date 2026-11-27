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
    expect(complete({ ...answer, tableData: [["1", ""], ["3", ""]] })).toBe(false);
    expect(complete({ ...answer, tableData: [["1", "2"], ["3", "x"]] })).toBe(false);
    expect(complete({ ...answer, tableData: [["1", "2"]] })).toBe(false);
    expect(complete({ ...answer, manualVars: { factor: { raw: "bad", evaluated: null } } })).toBe(false);
    expect(complete({ ...answer, manualVars: {} })).toBe(false);
    expect(complete(answer)).toBe(true);
  });

  it("accepts reading columns shorter than the table, as long as each has a reading", () => {
    // Gel assay (ATR 01a21294): five standard injections, two per sample.
    const gel = JSON.stringify({ type: 3, expression: "((:sampleAvg * :standardWeight * :Fillweight) / (:standardAvg * :sampleWeight * :Claim) * :purity) * 100",
      numberOfReadings: 5, numberOfSamples: 2, standardInTable: true, headers: ["Standard", "Sample 1", "Sample 2"],
      standardInputs: [{ key: "weight" }], sampleInputs: [[{ key: "weight" }], [{ key: "weight" }]],
      manualVarLabels: { Fillweight: "Fill Weight", Claim: "Claim", purity: "Purity" } });
    const entered = { standardInputs: { weight: "0.0514" }, sampleInputs: [{ weight: "5.1669" }, { weight: "5.0255" }],
      manualVars: { Fillweight: { raw: "30.0", evaluated: 30 }, Claim: { raw: "0.300", evaluated: 0.3 }, purity: { raw: "0.992", evaluated: 0.992 } },
      tableData: [["795.1", "820.1", "813.5"], ["795.1", "820.3", "813.9"], ["795.1", "", ""], ["794.7", "", ""], ["794.0", "", ""]] };
    expect(formulaAnswerComplete(JSON.stringify(entered), gel)).toBe(true);
    const emptySample = entered.tableData.map(([standard, first]) => [standard ?? "", first ?? "", ""]);
    expect(formulaAnswerComplete(JSON.stringify({ ...entered, tableData: emptySample }), gel)).toBe(false);
    // Each column needs at least two readings before its average is taken.
    const oneReading = entered.tableData.map(([standard, first, second], row) => [standard ?? "", first ?? "", row === 0 ? second ?? "" : ""]);
    expect(formulaAnswerComplete(JSON.stringify({ ...entered, tableData: oneReading }), gel)).toBe(false);
    const oneRowTable = JSON.stringify({ ...JSON.parse(gel), numberOfReadings: 1 });
    expect(formulaAnswerComplete(JSON.stringify({ ...entered, tableData: [["795.1", "820.1", "813.5"]] }), oneRowTable)).toBe(true);
    // Calculated table columns evaluate every cell, so those worksheets still need every reading.
    const calculated = JSON.stringify({ ...JSON.parse(gel), formulaInTable: true });
    expect(formulaAnswerComplete(JSON.stringify(entered), calculated)).toBe(false);
  });

  it("accepts zero as an entered number and ignores optional label metadata", () => {
    expect(complete({ ...answer, standardInputs: { wt: "0" }, tableData: [["0", "0"], ["0", "0"]] })).toBe(true);
    expect(complete({ ...answer, manualVars: { ...answer.manualVars, unused: { raw: "", evaluated: null } } })).toBe(true);
  });

  it("needs no readings table when the formula has no sample or standard columns, as for a pH reading", () => {
    const manualOnly = JSON.stringify({ type: 3, expression: ":ph", numberOfReadings: 3, numberOfSamples: 0, manualVarLabels: { ph: "pH" } });
    expect(formulaAnswerComplete(JSON.stringify({ manualVars: { ph: { raw: "6.8", evaluated: 6.8 } }, tableData: [] }), manualOnly)).toBe(true);
    expect(formulaAnswerComplete(JSON.stringify({ manualVars: { ph: { raw: "", evaluated: null } }, tableData: [] }), manualOnly)).toBe(false);
  });

  it("does not require standard inputs the worksheet hides, as for Assay: Paracetamol", () => {
    // The approved revision keeps a standard Weight input in its settings, but standard inputs are switched off.
    const paracetamol = JSON.stringify({ type: 3, expression: "(:sampleAvg/:A)*(:dil/:sampleWeight)*:wt*5*(1000/:Claim)*:purity",
      constants: { Claim: 120, A: 715, dil: 200 }, headers: ["Sample 1", "Sample 2"], numberOfReadings: 2, numberOfSamples: 2,
      standardInput: false, standardInTable: false, standardInputs: [{ key: "weight" }], sampleInput: true, sampleInTable: true,
      sampleInputs: [[{ key: "weight" }], [{ key: "weight" }]], manualVarLabels: { wt: "", purity: "" } });
    const entered = { standardInputs: {}, sampleInputs: [{ weight: "5.6613" }, { weight: "5.6822" }], tableData: [["0.4468", "0.4474"], ["0.4465", "0.4470"]],
      manualVars: { wt: { raw: "1.13", evaluated: 1.13 }, purity: { raw: "100", evaluated: 100 } } };
    expect(formulaAnswerComplete(JSON.stringify(entered), paracetamol)).toBe(true);
    expect(formulaAnswerComplete(JSON.stringify({ ...entered, sampleInputs: [{ weight: "5.6613" }, {}] }), paracetamol)).toBe(false);
    const shownStandard = JSON.stringify({ ...JSON.parse(paracetamol), standardInput: true, standardInTable: true, headers: ["Standard", "Sample 1", "Sample 2"] });
    expect(formulaAnswerComplete(JSON.stringify({ ...entered, tableData: [["1", "0.4468", "0.4474"], ["1", "0.4465", "0.4470"]] }), shownStandard)).toBe(false);
  });

  it("reads a Simple formula stored with its builder settings inside the expression", () => {
    // pH of sample as the question editor stores it (ATR 01a1cb57): the expression is the builder's settings JSON.
    const wrapped = JSON.stringify({ type: 0, expression: JSON.stringify({ expression: "(:ph1+:ph2)/2", decimalPlaces: 2, percent: false, type: 0,
      variables: { ph1: { value: "", label: "pH reading 1" }, ph2: { value: "", label: "pH reading 2" } }, constants: {} }) });
    expect(formulaAnswerComplete('{"ph1":5.1232,"ph2":5.1126}', wrapped)).toBe(true);
    expect(formulaAnswerComplete('{"ph1":5.1232}', wrapped)).toBe(false);
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
