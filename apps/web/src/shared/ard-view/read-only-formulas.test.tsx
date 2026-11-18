// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import ArdTemplateBody from "./templates/body";
import { CertificatePreview } from "./certificate-preview";
import { getCompactFormulaEvaluations } from "./raw-data/print/formula-evaluation";
import { assaySection, wrappedAssayAnswer } from "./__fixtures__/assay";
import { normalizeFormulaResponse } from "./raw-data/print/normalize-formula-response";

afterEach(cleanup);
const facts = { batchNumber: "B-1", made: null, expires: null, arNumber: "AR-1", sampled: null, analysed: null, subject: "Synthetic material" };

it("renders the Next summary and full worksheet from wrapped legacy Assay readings", async () => {
  const { container } = render(<ArdTemplateBody sections={[assaySection]} responses={[wrappedAssayAnswer]} showRemarks={false} />);
  expect(await screen.findAllByText("10.04%")).toHaveLength(2);
  expect(screen.getAllByText("7.17%")).toHaveLength(2);
  expect(screen.getByText("Test & Observations")).toBeTruthy();
  expect(screen.getByText(/Weight \(g\): 0\.02/)).toBeTruthy();
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
  expect(await screen.findAllByText("Result unavailable")).toHaveLength(3);
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
  expect(screen.getByRole("region", { name: "Recorded formula inputs" })).toBeTruthy();
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
