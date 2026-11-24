// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { testVariableLabel } from "./variable-labels";
import { WorksheetInputs } from "../ui/types/expression/universal/authorized-evaluate/worksheet-inputs";
import { RecordedFormulaInputs } from "@/shared/ard-view/raw-data/print/recorded-formula-inputs";
import { formulaView } from "@/shared/ard-view/worksheet/formula-model";
import { QuestionType } from "@/shared/questions/question-types";

afterEach(cleanup);

const context = { concentrationUnit: "mg/mL", standardInputs: [{ key: "wt", label: "Weight (g)" }], sampleInputs: [[{ key: "wt", label: "Weight (g)" }]] };
const settings = { type: 3, expression: ":sampleAbsorbance+:standardPeakAreas+:sample2TitreValue",
  standardInput: false, sampleInput: false, headers: ["Sample 1"], noOfReadings: 1,
  ...context, standardInputs: [], sampleInputs: [] };
const manualVars = { sampleAbsorbance: { raw: "0.005001", evaluated: 0.005001, label: "" },
  standardPeakAreas: { raw: "12345", evaluated: 12345, label: "" },
  sample2TitreValue: { raw: "2.45", evaluated: 2.45, label: "" } };

describe("reserved test-variable descriptions", () => {
  it.each([
    ["standardWeight", "Standard Weight (g)"], ["sampleWeight", "Sample Weight (g)"],
    ["standardConc", "Standard Concentration (mg/mL)"], ["sampleConc", "Sample Concentration (mg/mL)"],
    ["standardAbsorbance", "Standard Absorbance"], ["sampleAbsorbance", "Sample Absorbance"],
    ["standardPeakAreas", "Standard Peak Areas"], ["samplePeakAreas", "Sample Peak Areas"],
    ["standardTitreValue", "Standard Titre Value"], ["sample2TitreValue", "Sample 2 Titre Value"],
  ])("describes %s consistently", (key, expected) => {
    expect(testVariableLabel(key, "", context)).toBe(expected);
  });

  it("preserves custom labels and unrelated manual-variable names", () => {
    expect(testVariableLabel("sampleAbsorbance", "Corrected blank absorbance", context)).toBe("Corrected blank absorbance");
    expect(testVariableLabel("purity", "Reference potency", context)).toBe("Reference potency");
    expect(testVariableLabel("customInput", "", context)).toBe("customInput");
    expect(testVariableLabel("sampleConc", "", { concentrationUnit: "%" })).toBe("Sample Concentration (%)");
  });

  it("shows the defaults next to editable test values without changing their keys or digits", () => {
    render(<WorksheetInputs parsed={settings} headers={settings.headers} standardInputs={[]} sampleInputs={[]}
      manualVars={manualVars} manualVarKeys={Object.keys(manualVars)} onManualVarChange={vi.fn()}
      onSampleInputChange={vi.fn()} onStandardInputChange={vi.fn()} />);
    expect(screen.getByRole("textbox", { name: "Sample Absorbance (sampleAbsorbance)" }).getAttribute("value")).toBe("0.005001");
    expect(screen.getByRole("textbox", { name: "Standard Peak Areas (standardPeakAreas)" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Sample 2 Titre Value (sample2TitreValue)" })).toBeTruthy();
  });

  it("keeps each shared value and its authored alias label through viewing and printing", () => {
    const weight = { key: "wt", label: "Weight (g)", value: "" };
    const settings = {
      type: 3, variableKeyFormat: 1, measurementAliases: ["absorbance", "peakAreas", "titreValue"],
      expression: ":standardAbsorbance+:samplePeakAreas+:sample2TitreValue", headers: ["Standard", "Sample 1", "Sample 2"],
      standardInTable: true, standardInput: true, sampleInput: true,
      standardInputs: [weight], sampleInputs: [[weight], [weight]],
    };
    const definition = JSON.stringify(settings);
    const value = JSON.stringify({ settings, standardInputs: { wt: "0.8" }, sampleInputs: [{ wt: "0.4" }, { wt: "0.2" }] });
    const field = { id: "shared-inputs", question: { type: QuestionType.Formula, options: [{ name: definition }] } };
    const view = formulaView(field, { value }, false);
    if (view.kind !== "worksheet") throw new Error(view.kind);
    expect(view.variables).toEqual([]);
    expect(view.standardInputs).toEqual([{ key: "wt", label: "Standard Absorbance", value: "0.8" }]);
    expect(view.samples.map(sample => sample.entries)).toEqual([
      [{ key: "wt", label: "Peak Areas", value: "0.4" }],
      [{ key: "wt", label: "Peak Areas / Titre Value", value: "0.2" }],
    ]);
    render(<RecordedFormulaInputs value={value} option={{ name: definition }} />);
    expect(screen.getByText("Standard Absorbance: 0.8")).toBeTruthy();
    expect(screen.getByText(/Peak Areas: 0.4/)).toBeTruthy();
    expect(screen.getByText(/Peak Areas \/ Titre Value: 0.2/)).toBeTruthy();
  });

  it("uses the same defaults for saved-test viewing and printing without rewriting recorded data", async () => {
    const value = JSON.stringify({ settings, manualVars });
    const field = { id: "assay-labels", question: { type: QuestionType.Formula, options: [{ name: JSON.stringify(settings) }] } };
    const view = formulaView(field, { value }, false);
    if (view.kind !== "worksheet") throw new Error(view.kind);
    expect(view.variables.map(entry => [entry.key, entry.label, entry.value])).toEqual([
      ["sampleAbsorbance", "Sample Absorbance", "0.005001"],
      ["standardPeakAreas", "Standard Peak Areas", "12345"],
      ["sample2TitreValue", "Sample 2 Titre Value", "2.45"],
    ]);
    render(<RecordedFormulaInputs value={value} option={{ name: JSON.stringify(settings) }} />);
    expect(await screen.findByText("Sample Absorbance: 0.005001")).toBeTruthy();
    expect(screen.getByText("Standard Peak Areas: 12345")).toBeTruthy();
    expect(screen.getByText("Sample 2 Titre Value: 2.45")).toBeTruthy();
    expect(JSON.parse(value).manualVars).toEqual(manualVars);
  });
});
