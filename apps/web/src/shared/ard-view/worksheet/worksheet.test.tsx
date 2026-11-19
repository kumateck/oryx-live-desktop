// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { FormResponseDto, FormSectionDto } from "@/shared/ard-view/dto";
import { QuestionType } from "@/shared/questions/question-types";
import { answerLabel, answerLayout } from "./answer-layout";
import { attachStoredResults, calculatedText, formulaView, resultLabel } from "./formula-model";
import { WorksheetTests } from "./worksheet-tests";

afterEach(cleanup);

const density = { type: 0, expression: "(:C-:A)/(:B-:A)", decimalPlaces: 2,
  manualVarLabels: { C: "Pycnometer and sample", A: "Empty pycnometer", B: "Pycnometer and water" } };
const densityField = { id: "f-density", question: { type: QuestionType.Formula, label: "Weight per ml", options: [{ name: JSON.stringify(density) }] } };
const densityAnswer: FormResponseDto = { formField: { id: "f-density" }, value: JSON.stringify({ C: "61.0224", A: "29.7506", B: "57.3314", settings: density }) };

const assay = { type: 3, expression: "(:sampleAvg/:A)*(:dil/:sampleWeight)*:wt", constants: { A: 715, dil: 200 }, headers: ["Sample 1", "Sample 2"],
  rowHeaders: [{ id: "r1", label: "Reading 1" }, { id: "r2", label: "Reading 2" }], sampleInput: true, standardInput: false, calculateAvgInTable: true,
  manualVarLabels: { wt: "Weight per ml" }, sampleInputs: [[{ key: "weight", label: "Weight (g)", value: "" }], [{ key: "weight", label: "Weight (g)", value: "" }]],
  decimalPlaces: 2, averageAllResults: true };
const assayField = { id: "f-assay", question: { type: QuestionType.Formula, label: "Assay: Paracetamol", options: [{ name: JSON.stringify(assay) }] } };
const assayValue = JSON.stringify({ settings: assay, tableData: [["0.416", "0.419"], ["0.420", "0.423"]], sampleInputs: [{ weight: "2.000" }, { weight: "2.010" }], manualVars: { wt: { raw: "1", evaluated: 1 } } });
const governed = (results: { key: string; value: string; unit?: string }[]) =>
  ({ formulaGoverned: true, formulaResultFinalized: true, formulaDisplayResultsJson: JSON.stringify(results) });

describe("formula worksheet model", () => {
  it("labels stored result keys for people and keeps calculated statistics to four decimals", () => {
    expect(resultLabel("sample1")).toBe("Sample 1");
    expect(resultLabel("average")).toBe("Average");
    expect(calculatedText(0.4180000001)).toBe("0.418");
    expect(calculatedText(null)).toBe("");
  });

  it("attaches governed results to their samples and lists the average as the primary result", () => {
    const calculations = [{ label: "Sample 1", substituted: "1", result: null, unavailable: false }, { label: "Sample 2", substituted: "2", result: null, unavailable: false }];
    const { calculations: attached, results } = attachStoredResults(calculations, [
      { key: "sample1", value: "2.42", unit: null }, { key: "sample2", value: "2.43", unit: null }, { key: "average", value: "2.43", unit: "%" }]);
    expect(attached.map((entry) => entry.result)).toEqual(["2.42", "2.43"]);
    expect(results).toEqual([{ label: "Average", value: "2.43 %", primary: true }]);
  });

  it("gives a lone simple calculation its lone stored result", () => {
    const view = formulaView(densityField, { ...densityAnswer, ...governed([{ key: "sample1", value: "1.13" }]) }, false);
    if (view.kind !== "worksheet") throw new Error(view.kind);
    expect(view.variables.map((entry) => [entry.label, entry.value])).toEqual([["Pycnometer and sample", "61.0224"], ["Empty pycnometer", "29.7506"], ["Pycnometer and water", "57.3314"]]);
    expect(view.calculations).toEqual([{ label: "Calculation", substituted: "(61.0224-29.7506)/(57.3314-29.7506)", result: "1.13", unavailable: false }]);
    expect(view.results).toEqual([]);
  });

  it("calculates older, ungoverned answers with their substituted values, readings average and overall average", () => {
    const view = formulaView(assayField, { formField: { id: "f-assay" }, value: assayValue }, false);
    if (view.kind !== "worksheet") throw new Error(view.kind);
    expect(view.table?.rows.map((row) => [row.label, ...row.cells])).toEqual([["Reading 1", "0.416", "0.419"], ["Reading 2", "0.420", "0.423"], ["Average", "0.418", "0.421"]]);
    expect(view.samples.map((sample) => sample.entries[0]?.value)).toEqual(["2.000", "2.010"]);
    expect(view.calculations[0]?.substituted).toBe("(0.418/715)*(200/2)*1");
    expect(view.calculations.every((entry) => entry.result !== null)).toBe(true);
    expect(view.results[0]).toMatchObject({ label: "Average", primary: true });
  });

  it("builds the blank worksheet from the template alone, with a calculation line per sample and no values", () => {
    const view = formulaView(assayField, undefined, true);
    if (view.kind !== "worksheet") throw new Error(view.kind);
    expect(view.calculations.map((entry) => [entry.label, entry.substituted, entry.result])).toEqual([["Sample 1", "", null], ["Sample 2", "", null]]);
    expect(view.table?.rows.flatMap((row) => row.cells).every((value) => value === "")).toBe(true);
    expect(view.variables).toEqual([{ key: "wt", label: "Weight per ml", value: "" }]);
  });

  it("says why a governed answer has no result instead of inventing one", () => {
    const view = formulaView(densityField, { ...densityAnswer, formulaGoverned: true, formulaRepairPending: true }, false);
    if (view.kind !== "worksheet") throw new Error(view.kind);
    expect(view.calculations[0]?.result).toBeNull();
    expect(view.notice).toMatch(/Formula repaired/);
  });
});

describe("answer layout", () => {
  it("places short answers on a row, long ones as a block, and IDs in the header", () => {
    expect(answerLayout(QuestionType.ShortAnswer)).toBe("row");
    expect(answerLayout(QuestionType.SingleChoice)).toBe("row");
    expect(answerLayout(QuestionType.Table)).toBe("block");
    expect(answerLayout(QuestionType.Formula)).toBe("formula");
    expect(answerLayout(QuestionType.Instrument)).toBe("header");
  });

  it("calls a question that repeats its test's name the observation", () => {
    expect(answerLabel("Description", "<p>Description</p>")).toBe("Observation");
    expect(answerLabel("pH", "pH of Solution")).toBe("pH of Solution");
  });
});

const sections: FormSectionDto[] = [
  { id: "s1", name: "Description", description: "A clear pink syrup", fields: [{ id: "f1", question: { type: QuestionType.SingleChoice, label: "Description", options: [{ name: "Complies" }, { name: "Does not comply" }] } }] },
  { id: "s2", name: "pH", description: "4.5 – 6.5", fields: [{ id: "f2", question: { type: QuestionType.ShortAnswer, label: "pH of Solution" } }, { id: "i2", question: { type: QuestionType.Instrument, label: "pH meter" } }] },
  { id: "s3", name: "Weight per ml", description: "1.10 – 1.20 g/ml", fields: [densityField] },
];
const responses: FormResponseDto[] = [
  { formField: { id: "f1" }, value: "Complies" }, { formField: { id: "f2" }, value: "5.8" }, { formField: { id: "i2" }, value: "PH-01" },
  { ...densityAnswer, ...governed([{ key: "sample1", value: "1.13", unit: "g/ml" }]) },
];

describe("worksheet tests", () => {
  it("numbers each test with its specification, aligns simple answers and shows a calculated test's result", () => {
    render(<WorksheetTests sections={sections} responses={responses} />);
    const description = screen.getByRole("region", { name: "Test 1" });
    expect(description.textContent).toContain("A clear pink syrup");
    expect(description.textContent).toContain("ObservationComplies");
    expect(description.textContent).not.toContain("Does not comply");
    const ph = screen.getByRole("region", { name: "Test 2" });
    expect(ph.textContent).toContain("pH of Solution5.8");
    expect(ph.textContent).toContain("PH-01");
    const density = screen.getByRole("region", { name: "Test 3" });
    expect(within(density).getByText("Result").nextElementSibling?.textContent).toContain("1.13 g/ml");
    const calculation = within(density).getByRole("table", { name: "Calculations" });
    expect(calculation.textContent).toContain("=1.13 g/ml");
    expect(density.textContent).not.toContain("Recorded inputs");
  });

  it("prints the same layout blank: empty answer lines, option boxes and no recorded values", () => {
    const { container } = render(<WorksheetTests sections={sections} responses={responses} blank />);
    expect(container.textContent).not.toMatch(/5\.8|61\.0224|1\.13|PH-01/);
    expect(screen.getByRole("region", { name: "Test 1" }).textContent).toContain("○Does not comply");
    expect(within(screen.getByRole("region", { name: "Test 3" })).getByLabelText("Results").textContent).toBe("Result");
    expect(container.querySelector("input, textarea, select")).toBeNull();
  });

  it("lets the specification span the test unless a calculated result sits beside it", () => {
    render(<WorksheetTests sections={sections} responses={responses} />);
    const columns = (test: string) => within(screen.getByRole("region", { name: test })).getByText("Specification").closest("dl")?.className ?? "";
    expect(columns("Test 1")).not.toContain("grid-cols-2");
    expect(columns("Test 2")).not.toContain("grid-cols-2");
    expect(columns("Test 3")).toContain("grid-cols-2");
  });
});
