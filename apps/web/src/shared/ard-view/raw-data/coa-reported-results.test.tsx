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
import TestSpecification from "../templates/specification";
import { WorksheetTests } from "../worksheet/worksheet-tests";

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

it("shows only the average value and range in the worksheet summary, certificate and approval", () => {
  const average = response.coaReportedResults?.[0];
  if (!average) throw new Error("Expected the fixture's average");
  const sample = { ...average, key: "sample1", label: "Sample 1", displayValue: "103.9180", converted: false, unit: "%" };
  const mixed = { ...response, coaReportedResults: [sample, { ...sample, key: "sample2", label: "Sample 2", displayValue: "103.6517" }, average] };
  const { unmount } = render(renderSpecificationResult(mixed, field));
  expect(screen.getByText("2.4334 % w/v")).toBeTruthy();
  expect(screen.queryByText(/Sample [12]|Average|103\.9180|103\.6517/)).toBeNull();
  expect(buildCoaCompliancePayload([section], [{ ...mixed, complies: false }])).toMatchObject([{ complies: true, reportingLocked: true }]);
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

it("shows the average alone when present and retains results with no aggregate", () => {
  const average = response.coaReportedResults?.[0];
  if (!average) throw new Error("Expected the fixture's average");
  const independent = { ...average, key: "sample1", label: "Sample 1", displayValue: "2.44" };
  const { rerender } = render(renderSpecificationResult({ ...response, coaReportedResults: [independent, average] }, field, { certificate: true }));
  expect(screen.queryByText("Sample 1:")).toBeNull();
  expect(screen.queryByText("2.44 % w/v")).toBeNull();
  expect(screen.getByText("2.4334 % w/v")).toBeTruthy();
  expect(screen.queryByText(/Average/)).toBeNull();
  rerender(renderSpecificationResult({ ...response, coaReportedResults: [{ ...independent, converted: false }] }, field, { certificate: true }));
  expect(screen.getByText("Sample 1:")).toBeTruthy();
});

it("uses the average verdict for specification remarks and prints no sample outputs or average label", () => {
  const average = response.coaReportedResults?.[0];
  if (!average) throw new Error("Expected average");
  const mixed = { ...response, complies: true, coaReportedResults: [
    { ...average, key: "sample1", label: "Sample 1", converted: false, displayValue: "103.9180", unit: "%" },
    { ...average, value: 2.59, displayValue: "2.59", complies: false },
  ] };
  const { rerender } = render(<TestSpecification sections={[section]} responses={[mixed]} />);
  expect(screen.getByText("The sample does not comply with the specification.")).toBeTruthy();
  expect(screen.queryByText(/Sample 1|Average|103\.9180/)).toBeNull();
  const passing = { ...mixed, coaReportedResults: [average] };
  rerender(<TestSpecification sections={[section]} responses={[passing]} />);
  expect(screen.getByText("The sample complies with the specification.")).toBeTruthy();
});

it("leaves the worksheet on its own formula result and specification; COA reporting does not reach it", () => {
  const { container } = render(<WorksheetTests sections={[section]} responses={[response]} />);
  expect(container.textContent).toContain("101.39");
  expect(container.textContent).toContain("(2.32 to 2.52)% w/v");
  expect(container.textContent).not.toContain("2.4334");
  expect(container.textContent).not.toContain("2.32–2.52 % w/v");
});
