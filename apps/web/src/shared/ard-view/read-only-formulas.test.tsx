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
