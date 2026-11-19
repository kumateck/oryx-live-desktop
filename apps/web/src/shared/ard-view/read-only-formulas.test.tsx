// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { RecordedFormulaInputs } from "./raw-data/print/recorded-formula-inputs";
import ArdTemplateBody from "./templates/body";
import { CertificatePreview } from "./certificate-preview";
import { getCompactFormulaEvaluations } from "./raw-data/print/formula-evaluation";
import { assaySection, wrappedAssayAnswer } from "./__fixtures__/assay";
import { normalizeFormulaResponse } from "./raw-data/print/normalize-formula-response";

afterEach(cleanup);
const facts = { batchNumber: "B-1", made: null, expires: null, arNumber: "AR-1", sampled: null, analysed: null, subject: "Synthetic material" };

it("renders the Next summary and full worksheet from wrapped legacy Assay readings", async () => {
  const { container } = render(<ArdTemplateBody sections={[assaySection]} responses={[wrappedAssayAnswer]} showRemarks={false} />);
  // The specification summary, the test's result and the sample's calculation.
  expect(await screen.findAllByText("10.04%")).toHaveLength(3);
  expect(screen.getAllByText("7.17%")).toHaveLength(3);
  const test = screen.getByRole("region", { name: "Test 1" });
  expect(within(test).getByText("99.0–101.0% (Dried substance)")).toBeTruthy();
  const standard = within(test).getByText("Standard inputs").parentElement;
  expect(standard?.textContent).toContain("Weight (g)");
  expect(standard?.textContent).toContain("0.02");
  expect(container.textContent).not.toContain('"tabledata"');
  expect(container.querySelector("input")).toBeNull();
});

it("renders the material/product COA result summary using the same Assay response", () => {
  render(<CertificatePreview kind="Material" facts={facts} sections={[assaySection]} responses={[wrappedAssayAnswer]} compliance={[]} onCompliance={() => {}} />);
  expect(screen.getByText("10.04%")).toBeTruthy();
  expect(screen.getByText("7.17%")).toBeTruthy();
  expect(screen.queryByText("0.00%")).toBeNull();
});

it("renders only authoritative results on the COA and on the worksheet for governed answers", () => {
  const answer = { ...wrappedAssayAnswer, value: null, formulaGoverned: true, formulaResultFinalized: true,
    formulaDisplayResultsJson: JSON.stringify([{ key: "Assay", value: "99.87", unit: "%" }]) };
  render(<CertificatePreview kind="Product" facts={facts} sections={[assaySection]} responses={[answer]} compliance={[]} onCompliance={() => {}} />);
  expect(screen.getByText("99.87 %")).toBeTruthy();
  expect(screen.queryByText("10.04%")).toBeNull();
});

it("does not invent an average of zero for missing, invalid or input-only results", () => {
  for (const response of ["{}", '{"result":""}', '{"average":null}', '{"average":"bad"}', '{"W1":12,"W2":10}']) {
    expect(getCompactFormulaEvaluations(response).average).toBeNull();
    expect(getCompactFormulaEvaluations(response).entries.filter((entry) => entry.result !== null)).toEqual([]);
  }
  expect(getCompactFormulaEvaluations('{"result":0}').entries[0]?.result).toBe(0);
});

it("normalizes all nested response wrappers and lowercase input keys without losing precision", () => {
  const normalized = normalizeFormulaResponse(wrappedAssayAnswer.value ?? "");
  expect(JSON.parse(normalized)).toMatchObject({ standardInputs: { wt: "0.02" }, tableData: [["0.1", "0.35", "0.35"]] });
});

it("shows the screenshot's unresolved sample-weight reading without substituting a different field", async () => {
  const option = assaySection.fields?.[0]?.question?.options?.[0]?.name ?? "";
  const original = option.replaceAll(":spl.wt", ":spltwt");
  const section = { ...assaySection, fields: [{ id: "f-assay", question: { type: 10 as const, label: "Assay – Titration", options: [{ name: original }] } }] };
  render(<ArdTemplateBody sections={[section]} responses={[wrappedAssayAnswer]} showRemarks={false} />);
  // The specification summary, the test's result, and each sample's calculation.
  expect(await screen.findAllByText("Result unavailable")).toHaveLength(4);
  expect(screen.queryByText("10.04%")).toBeNull();
  expect(screen.queryByText("0.00%")).toBeNull();
});

it("uses only the authoritative average in the specification summary and preserves all inputs/results in the worksheet", () => {
  const answer = { ...wrappedAssayAnswer, formulaGoverned: true, formulaResultFinalized: true,
    formulaDisplayResultsJson: JSON.stringify([{ key: "sample1", value: "103.92", unit: "%" }, { key: "sample2", value: "103.65", unit: "%" }, { key: "average", value: "103.78", unit: "%" }]) };
  const { container } = render(<ArdTemplateBody sections={[assaySection]} responses={[answer]} showRemarks={false} />);
  const tables = container.querySelectorAll("table");
  expect(tables[0]?.textContent).toContain("103.78 %");
  expect(tables[0]?.textContent).not.toContain("103.92");
  const calculations = screen.getByRole("table", { name: "Calculations" });
  if (!(calculations instanceof HTMLTableElement)) throw new Error("Calculations is not a table");
  expect(calculations.rows[0]?.textContent).toContain("103.92 %");
  expect(calculations.rows[1]?.textContent).toContain("103.65 %");
  expect(container.textContent).toContain("0.02");
  expect(container.textContent).toContain("0.35");
  expect(container.textContent).toContain("103.92 %");
  expect(container.querySelector("input, textarea")).toBeNull();
});

it("keeps matching saved short answers visible after a question changes to dropdown, including commas", () => {
  const section = { id: "s-description", name: "Description", fields: [{ id: "f-description", question: { type: 5 as const, label: "Description",
    options: [{ name: "Clear pink syrup, sweet flavour" }, { name: "Cloudy syrup" }] } }] };
  render(<CertificatePreview kind="Product" facts={facts} sections={[section]}
    responses={[{ formField: { id: "f-description" }, value: "Clear pink syrup, sweet flavour" }]} compliance={[]} onCompliance={() => {}} />);
  expect(screen.getByText("Clear pink syrup, sweet flavour")).toBeTruthy();
  expect(screen.queryByText("Cloudy syrup")).toBeNull();
});

it("shows the recorded analyst, certificate generator and approver in the certificate footer", () => {
  render(<CertificatePreview kind="Product" facts={facts} sections={[]} responses={[]} compliance={[]} onCompliance={() => {}}
    signatories={{ analysts: ["Ama Analyst", "Kojo Analyst"], releasedBy: "Esi QC", approvedBy: "Kofi QA" }} />);
  const footer = screen.getByRole("region", { name: "Certificate signatories" });
  expect(footer.textContent).toContain("Analysed byAma Analyst, Kojo Analyst");
  expect(footer.textContent).toContain("Released byEsi QC");
  expect(footer.textContent).toContain("Approved byKofi QA");
});


it("renders saved universal worksheet inputs in the entry layout without configuration JSON or editable controls", async () => {
  const settings = { type: 3, expression: "(:sampleAvg/:A)*(:dil/:sampleWeight)*:wt*5*(1000/:Claim)*:purity",
    constants: { Claim: 120, A: 715, dil: 200 }, headers: ["Sample 1", "Sample 2"],
    rowHeaders: [{ id: "r1", label: "Reading 1" }, { id: "r2", label: "Reading 2" }],
    sampleInput: true, standardInput: false, sampleTable: true, calculateAvgInTable: true,
    manualVarLabels: { wt: "Weight per ml", purity: "% purity" },
    sampleInputs: [[{ key: "weight", label: "Weight (g)", value: "" }], [{ key: "weight", label: "Weight (g)", value: "" }]],
    standardInputs: [{ key: "unused", label: "Hidden standard", value: "" }],
    decimalPlaces: 2, averageAllResults: true };
  const section = { ...assaySection, fields: [{ id: "f-assay", question: { type: 10 as const, label: "Assay: Paracetamol", options: [{ name: JSON.stringify(settings) }] } }] };
  const value = { settings, tableData: [["0.4468", "0.4474"], ["0.4465", "0.4470"]],
    sampleInputs: [{ weight: "5.6613" }, { weight: "5.6822" }], manualVars: { wt: { raw: "1.13", evaluated: 1.13 }, purity: { raw: "100.0", evaluated: 100 } } };
  const answer = { ...wrappedAssayAnswer, value: JSON.stringify(value), formulaGoverned: true, formulaResultFinalized: true,
    formulaDisplayResultsJson: JSON.stringify([{ key: "average", value: "103.78", unit: "%" }]) };
  const { container } = render(<ArdTemplateBody sections={[section]} responses={[answer]} showRemarks={false} />);
  const row = (group: string, name: string) => within(screen.getByText(group).parentElement ?? document.body).getByRole("rowheader", { name: new RegExp(name.replace(/[()%]/g, "\\$&")) }).closest("tr")?.textContent;
  expect(row("Recorded variables", "Weight per ml")).toContain("1.13");
  expect(row("Recorded variables", "% purity")).toContain("100.0");
  expect(row("Sample 1 inputs", "Weight (g)")).toContain("5.6613");
  expect(row("Sample 2 inputs", "Weight (g)")).toContain("5.6822");
  expect(row("Constants", "Claim")).toContain("120");
  expect(screen.getByText("0.4470")).toBeTruthy();
  // Governed: the stored average is the result, and no bare "=" is left without a number.
  expect(within(screen.getByLabelText("Results")).getByText("103.78 %")).toBeTruthy();
  expect(screen.getByRole("table", { name: "Calculations" }).textContent).not.toMatch(/=\s*$/);
  expect(screen.queryByText(/Hidden standard/)).toBeNull();
  expect(container.textContent).not.toContain('"averageAllResults"');
  expect(container.querySelector("input, textarea, select, button")).toBeNull();
  expect(container.textContent).toContain("103.78 %");
});


it("renders labelled simple formula readings without leaking saved settings", () => {
  const settings = { type: 0, expression: "(:C-:A)/(:B-:A)", manualVarLabels: { C: "Weight of pycnometer and sample", A: "Empty pycnometer", B: "Pycnometer and water" } };
  const { container } = render(<RecordedFormulaInputs option={{ name: JSON.stringify(settings) }} value={JSON.stringify({ C: "61.0224", A: "29.7506", B: "57.3314", settings })} />);
  expect(screen.getByText("Weight of pycnometer and sample")).toBeTruthy();
  expect(screen.getByText("61.0224")).toBeTruthy();
  expect(container.textContent).not.toContain('"manualVarLabels"');
  expect(container.querySelector("input, textarea, select")).toBeNull();
});
