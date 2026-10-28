import { describe, expect, it } from "vitest";
import { QuestionType } from "@/shared/ard-view/legacy";
import {
  FormResponseDto,
  FormSectionDto,
} from "@/shared/ard-view/dto";
import { buildCoaCompliancePayload } from "./coa-compliance";

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
});
