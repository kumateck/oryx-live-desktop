import { describe, expect, it } from "vitest";
import { QuestionType } from "@/shared/ard-view/legacy";
import {
  FormResponseDto,
  FormSectionDto,
} from "@/shared/ard-view/dto";
import { buildCoaCompliancePayload, inferCompliance } from "./coa-compliance";

const section = {
  id: "section-1",
  description: "2 to 4",
  fields: [{ id: "field-1" }],
} as FormSectionDto;

const response = (displayResults?: string) =>
  ({
    id: "response-field-1",
    responseId: "response-1",
    value: JSON.stringify({ result: 100 }),
    formField: {
      id: "field-1",
      question: { type: QuestionType.Formula },
    },
    formulaGoverned: true,
    formulaResultFinalized: true,
    formulaDisplayResultsJson: displayResults,
  }) as FormResponseDto;

describe("governed COA compliance", () => {
  it("uses the stored server result instead of recalculating the response", () => {
    const result = buildCoaCompliancePayload(
      [section],
      [response('[{"key":"result","value":"3.00","unit":null}]')],
    );

    expect(result[0]).toMatchObject({ complies: true, requiresReview: false });
  });

  it("fails closed when a governed result is unavailable", () => {
    const result = buildCoaCompliancePayload([section], [response()]);

    expect(result[0]).toMatchObject({ complies: false, requiresReview: true });
  });

  it("checks every sample against a one-sided limit, as for the Amoximed assays", () => {
    const assay = (description: string) => ({ ...section, description }) as FormSectionDto;
    const results = (...values: string[]) => response(JSON.stringify(values.map((value, index) => ({ key: `sample${index + 1}`, value, unit: null }))));
    const nmt = '<p><span style="color: black; font-size: 12pt;">NMT 120.0% of the label claim</span></p>';
    const nlt = '<p><span style="color: black; font-size: 12pt;">NLT 85% of the label claim</span></p>';

    expect(buildCoaCompliancePayload([assay(nmt)], [results("99.96", "99.97")])[0]).toMatchObject({ complies: true, requiresReview: false });
    expect(buildCoaCompliancePayload([assay(nlt)], [results("91.68", "90.15")])[0]).toMatchObject({ complies: true, requiresReview: false });
    // One failing sample fails the test.
    expect(buildCoaCompliancePayload([assay(nlt)], [results("91.68", "84.9")])[0]).toMatchObject({ complies: false, requiresReview: false });
    expect(buildCoaCompliancePayload([assay(nmt)], [results("99.96", "120.5")])[0]).toMatchObject({ complies: false, requiresReview: false });
  });
});

describe("specification limits", () => {
  it.each([
    ["NMT 120.0% of the label claim", "120", true],
    ["Not more than 2.0%", "2.1", false],
    ["NLT 85% of the label claim", "85", true],
    ["Not less than 90.0%", "89.99", false],
    ["NLT 90.0% and NMT 110.0%", "105", true],
    ["NLT 90.0% and NMT 110.0%", "111", false],
    ["4.0 to 7.0", "5.12", true],
  ])("%s with %s", (specification, result, complies) => {
    expect(inferCompliance(specification, result)).toEqual({ complies, isCertain: true });
  });

  it("still asks for review when the specification states no number", () => {
    expect(inferCompliance("Free flowing light pink powder", "12")).toMatchObject({ isCertain: false });
  });

  it("reads a hyphen between two numbers as a range, as for Weight per ml (1.00-1.300) g/ml", () => {
    expect(inferCompliance("(1.00-1.300) g/ml", "1.13")).toEqual({ complies: true, isCertain: true });
    expect(inferCompliance("(1.00-1.300) g/ml", "1.31")).toEqual({ complies: false, isCertain: true });
    expect(inferCompliance("2 - 4", "3")).toEqual({ complies: true, isCertain: true });
    // A real negative limit is still read as negative.
    expect(inferCompliance("-5 to 5", "-4")).toEqual({ complies: true, isCertain: true });
  });
});
