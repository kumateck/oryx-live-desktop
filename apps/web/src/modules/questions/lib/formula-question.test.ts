import { describe, expect, it } from "vitest";
import type { FormulaRevision } from "@/shared/formula/governance-api";
import { QuestionType } from "@/shared/questions/question-types";
import { buildFormulaOptionValue, currentRevision, savedValidationFor, toFormulaValues } from "./formula-question";

const revision = (overrides: Partial<FormulaRevision> = {}): FormulaRevision => ({
  id: "r1", formulaDefinitionId: "d1", questionId: "q1", revision: 1, definitionHash: "a".repeat(64), formulaLanguageVersion: "oryx-formula-v1", numericPolicyVersion: "v1",
  presentationPreset: "Universal", authoringPayload: null, status: 0, statusName: "Draft", testCases: [], createdById: null, reviewedById: null, reviewedAt: null,
  approvedById: null, approvedAt: null, effectiveAt: null, ...overrides,
});

describe("formula questions", () => {
  it("loads the revision's authoring payload in preference to the stored option", () => {
    const question = { id: "q1", label: "Assay", type: QuestionType.Formula, isMultiSelect: false, reference: null, description: null, options: [JSON.stringify({ type: 0, expression: ":legacy+1" })] };
    expect(toFormulaValues(question, JSON.stringify({ type: 0, expression: ":corrected+1", variableScopes: { "spl.wt": 1 } }))).toMatchObject({ expression: ":corrected+1", variableScopes: { "spl.wt": { value: "1" } } });
  });
  it("stores form-scoped variables by their decoded key", () => {
    expect(JSON.parse(buildFormulaOptionValue(":a*2", 0, "", { [encodeURIComponent("spl.wt")]: { value: "1", label: "Form" } }))).toEqual({ type: 0, expression: ":a*2", variableScopes: { "spl.wt": 1 } });
  });
  it("prefers the just-saved draft over a stale revision list and ties validation to the definition", () => {
    const saved = { questionId: "q1", revision: revision({ definitionHash: "b".repeat(64) }), validation: null };
    expect(currentRevision(revision(), saved)).toBe(saved.revision);
    expect(currentRevision(revision({ revision: 2 }), saved)?.revision).toBe(2);
    expect(savedValidationFor(revision(), saved)).toBeNull();
  });
});
