import { expect, it } from "vitest";
import { compareFormulaSettings } from "./formula-settings-comparison";

// Assay: Paracetamol: the test's old formula had standard inputs on; the approved revision switches them off.
const base = { type: 3, expression: "(:sampleAvg/:A)*(:dil/:sampleWeight)*:wt*5*(1000/:Claim)*:purity", constants: { Claim: 120, A: 715, dil: 200 },
  headers: ["Sample 1", "Sample 2"], numberOfReadings: 2, numberOfSamples: 2, standardInTable: true, sampleInput: true,
  standardInputs: [{ key: "weight", label: "Weight (g)" }], sampleInputs: [[{ key: "weight", label: "Weight (g)" }], [{ key: "weight", label: "Weight (g)" }]],
  manualVarLabels: { wt: "", purity: "" }, decimalPlaces: 2 };
const current = JSON.stringify({ ...base, standardInput: true });
const approved = JSON.stringify({ ...base, standardInput: false, standardInTable: false });

it("lists every setting of both formulas and marks what the repair changes", () => {
  const rows = compareFormulaSettings(current, approved);
  const row = (label: string) => rows.find((item) => item.label === label);
  expect(row("Standard inputs")).toMatchObject({ current: "Enabled", approved: "Disabled", changed: true });
  expect(row("Standard column in table")).toMatchObject({ current: "Yes", approved: "No", changed: true });
  expect(row("Constants")).toMatchObject({ current: ":Claim = 120; :A = 715; :dil = 200", changed: false });
  expect(row("Sample input fields")?.current).toBe("Sample 1: Weight (g) (weight); Sample 2: Weight (g) (weight)");
  expect(row("Formula type")?.current).toBe("Universal");
  expect(rows.filter((item) => item.changed).map((item) => item.label)).toEqual(["Standard inputs", "Standard column in table"]);
});

it("reads the settings the question editor nests inside the expression, and lists only current settings without an approved revision", () => {
  const nested = JSON.stringify({ type: 3, expression: JSON.stringify({ ...base, standardInput: false }) });
  const rows = compareFormulaSettings(nested, null);
  expect(rows.find((item) => item.label === "Standard inputs")).toMatchObject({ current: "Disabled", approved: null, changed: false });
});
