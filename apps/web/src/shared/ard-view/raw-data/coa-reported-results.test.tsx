// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { FormResponseDto, FormSectionDto } from "@/shared/ard-view/dto";
import { QuestionType } from "@/shared/ard-view/legacy";
import { CertificatePreview } from "../certificate-preview";
import { renderSpecificationResult } from "../templates/render";
import { buildCoaCompliancePayload } from "./coa-compliance";
import { CoaReportingSpecification } from "./coa-reported-results";
import { ArdResultsTable } from "@/modules/pending-approvals/components/details/ard-results-table";
import { answersByField } from "@/modules/pending-approvals/lib/ard-results";
import { ardAnswersSchema, ardFormSchema } from "@/modules/pending-approvals/schemas/ard-result-schema";

afterEach(cleanup);
const field = { id: "field-a", question: { type: QuestionType.Formula, options: [{ name: '{"type":0,"expression":":assay","decimalPlaces":2}' }] } };
const section: FormSectionDto = { id: "section-a", name: "Assay", description: "(2.32 to 2.52)% w/v", fields: [field] };
const response: FormResponseDto = { formField: field, value: '{"assay":101.39}', coaReportedResults: [{ key: "average", label: "Average content", sourceValue: 101.39,
  value: 2.43336, displayValue: "2.4334", unit: "% w/v", minimum: 2.32, maximum: 2.52, complies: true, nominalConcentration: 2.4, definitionHash: "hash", converted: true, decimalPlaces: 4 }] };

it("renders the recorded conversion and uses its server verdict rather than comparing the source percentage", () => {
  render(renderSpecificationResult(response, field));
  expect(screen.getByText(/2.4334 % w\/v/)).toBeTruthy();
  expect(screen.queryByText(/101.39/)).toBeNull();
  expect(buildCoaCompliancePayload([section], [response])).toMatchObject([{ formSectionId: "section-a", complies: true, requiresReview: false }]);
});
it("keeps unconverted assays and independent outputs on their existing basis", () => {
  render(renderSpecificationResult({ ...response, coaReportedResults: null }, field));
  expect(screen.getByText("101.39")).toBeTruthy();
  const other = { ...section, id: "section-b", description: "98–102%", fields: [{ ...field, id: "field-b" }] };
  const answer = { ...response, formField: { ...field, id: "field-b" }, coaReportedResults: null };
  expect(buildCoaCompliancePayload([section, other], [response, answer])).toMatchObject([{ complies: true }, { complies: true }]);
});
it("honours the unrounded verdict even when display rounding lands on the upper limit", () => {
  const values = response.coaReportedResults?.map(result => ({ ...result, value: 2.52001, displayValue: "2.52", complies: false }));
  expect(buildCoaCompliancePayload([section], [{ ...response, coaReportedResults: values ?? [] }])).toMatchObject([{ complies: false, requiresReview: false }]);
});
it("shows missing conversion evidence as unresolved and prints the captured per-output limits", () => {
  render(renderSpecificationResult({ ...response, coaReportedResults: [], coaReportingError: "Approve the reporting settings first." }, field));
  expect(screen.getByRole("alert").textContent).toMatch(/Approve/);
  expect(buildCoaCompliancePayload([section], [{ ...response, coaReportingError: "Missing result" }])).toMatchObject([{ complies: false, requiresReview: true }]);
  cleanup();
  render(<CoaReportingSpecification fields={[field]} responses={new Map([["field-a", response]])} original="98–102%" />);
  expect(screen.getByText(/2.32–2.52 % w\/v/)).toBeTruthy();
  expect(screen.queryByText("98–102%")).toBeNull();
});

it("retains saved per-test references through the approval certificate schema and renderer", () => {
  const form = ardFormSchema.parse({ sections: [{ id: "section-a", name: "Assay", value: "0", fields: [field] }] });
  const sections = (form.sections ?? []).map(section => ({ ...section, fields: section.fields ?? [] }));
  const recorded = answersByField(ardAnswersSchema.parse([response]));
  render(<ArdResultsTable sections={sections} recorded={recorded} certificate />);
  expect(screen.getByRole("cell", { name: "BP" })).toBeTruthy();
});

it("uses the latest passing converted verdict on a pending COA even when its stored percentage verdict failed", () => {
  const form = ardFormSchema.parse({ sections: [section] });
  const sections = (form.sections ?? []).map(section => ({ ...section, fields: section.fields ?? [] }));
  const recorded = answersByField(ardAnswersSchema.parse([{ ...response, complies: false }]));
  render(<ArdResultsTable sections={sections} recorded={recorded} certificate />);
  expect(screen.getByRole("cell", { name: "Complies" })).toBeTruthy();
  expect(screen.queryByRole("cell", { name: "Does not comply" })).toBeNull();
});

it("shows the current conversion while clearly requiring specification approval before it can be signed", () => {
  render(renderSpecificationResult({ ...response, coaReportingError: "Approve the product specification before approving this COA." }, field));
  expect(screen.getByText(/2.4334 % w\/v/)).toBeTruthy();
  expect(screen.getByRole("alert").textContent).toContain("Approve the product specification");
});

it("shows the final assay and its matching range on the certificate, while keeping sample readings in the worksheet", () => {
  const average = response.coaReportedResults?.[0];
  if (!average) throw new Error("Expected the fixture's average");
  const sample = { ...average, key: "sample1", label: "Sample 1", displayValue: "103.9180", converted: false, unit: "%" };
  const mixed = { ...response, coaReportedResults: [sample, { ...sample, key: "sample2", label: "Sample 2", displayValue: "103.6517" }, average] };
  const { unmount } = render(renderSpecificationResult(mixed, field));
  expect(screen.getByText("Sample 1:")).toBeTruthy();
  expect(screen.getByText("Average content:")).toBeTruthy();
  unmount();

  const form = ardFormSchema.parse({ sections: [section] });
  const sections = (form.sections ?? []).map(item => ({ ...item, fields: item.fields ?? [] }));
  const recorded = answersByField(ardAnswersSchema.parse([mixed]));
  const approval = render(<ArdResultsTable sections={sections} recorded={recorded} certificate />);
  const verifyAssayRow = () => {
    expect(screen.getByRole("cell", { name: "2.4334 % w/v" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "2.32–2.52 % w/v" })).toBeTruthy();
    expect(screen.queryByText(/Sample [12]|Average|103\.9180|103\.6517|2\.32 to 2\.52/)).toBeNull();
  };
  verifyAssayRow();
  approval.unmount();

  render(<CertificatePreview kind="Product" facts={{ subject: "Paracetamol syrup", batchNumber: "L001K074",
    made: null, expires: null, arNumber: null, sampled: null, analysed: null }}
    sections={[section]} responses={[mixed]} compliance={buildCoaCompliancePayload([section], [mixed])} onCompliance={() => {}} />);
  verifyAssayRow();
});

it("preserves independently configured results and results with no aggregate", () => {
  const average = response.coaReportedResults?.[0];
  if (!average) throw new Error("Expected the fixture's average");
  const independent = { ...average, key: "sample1", label: "Sample 1", displayValue: "2.44" };
  const { rerender } = render(renderSpecificationResult({ ...response, coaReportedResults: [independent, average] }, field, { certificate: true }));
  expect(screen.getByText("Sample 1:")).toBeTruthy();
  expect(screen.getByText("2.44 % w/v")).toBeTruthy();
  expect(screen.queryByText(/Average/)).toBeNull();
  rerender(renderSpecificationResult({ ...response, coaReportedResults: [{ ...independent, converted: false }] }, field, { certificate: true }));
  expect(screen.getByText("Sample 1:")).toBeTruthy();
});
