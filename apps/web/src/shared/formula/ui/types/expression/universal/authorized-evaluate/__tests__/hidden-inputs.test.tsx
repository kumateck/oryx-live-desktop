// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { AuthorizedUniversalEvaluate } from "../evaluate";

afterEach(cleanup);

// Assay: Paracetamol as approved: the standard Weight input stays in the settings, but standard inputs are switched off.
const paracetamol = { type: 3, expression: "(:sampleAvg/:A)*(:dil/:sampleWeight)*:wt*5*(1000/:Claim)*:purity",
  constants: { Claim: 120, A: 715, dil: 200 }, headers: ["Sample 1", "Sample 2"], numberOfReadings: 2, numberOfSamples: 2,
  standardInput: false, standardInTable: false, standardInputs: [{ key: "weight", label: "Weight (g)", value: "" }],
  sampleInput: true, sampleInTable: true, sampleInputs: [[{ key: "weight", label: "Weight (g)", value: "" }], [{ key: "weight", label: "Weight (g)", value: "" }]],
  manualVarLabels: { wt: "", purity: "" } };

it("shows only the inputs the formula switches on, as the question editor and submission check do", () => {
  render(<AuthorizedUniversalEvaluate settings={JSON.stringify(paracetamol)} value="" onChange={() => {}} />);
  expect(screen.queryByText(/Standard\s+Inputs/i)).toBeNull();
  expect(screen.getAllByText(/Sample 1 Weight \(g\)/).length).toBeGreaterThan(0);
});

it("still shows standard inputs when they are switched on and in the table", () => {
  const shown = { ...paracetamol, standardInput: true, standardInTable: true, headers: ["Standard", "Sample 1", "Sample 2"] };
  render(<AuthorizedUniversalEvaluate settings={JSON.stringify(shown)} value="" onChange={() => {}} />);
  expect(screen.getAllByText(/Standard\s+Inputs/i).length).toBeGreaterThan(0);
});
