import { describe, expect, it } from "vitest";
import { QuestionType } from "@/shared/questions/question-types";
import { questionFormSchema, questionRequest, type QuestionFormValues } from "./question-schema";

const values = (type: number, cfuUnit: QuestionFormValues["cfuUnit"] = null): QuestionFormValues => ({
  label: "TAMC result", type: { value: String(type), label: "" }, reference: "", description: "", isMultiSelect: false, options: [{ id: "o", name: "Option 1" }], cfuUnit,
});

describe("microbial questions", () => {
  it("a CFU calculation needs its unit, sent as its one option", () => {
    expect(questionFormSchema.safeParse(values(QuestionType.CfuCalculation)).success).toBe(false);
    expect(questionRequest(values(QuestionType.CfuCalculation, { value: "cfu/g", label: "cfu/g" })).options).toEqual([{ name: "cfu/g" }]);
  });
  it("other microbial types send no options", () => {
    expect(questionRequest(values(QuestionType.GrowthObservation)).options).toBeNull();
    expect(questionRequest(values(QuestionType.Organism)).options).toBeNull();
  });
});
