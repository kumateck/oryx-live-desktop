import { describe, expect, it } from "vitest";
import { createRequest, editPlan, type LoadedTemplate, type TemplateSection } from "./template-model";

const loaded: LoadedTemplate = { id: "f", name: "Paracetamol ARD", type: 0, sections: [
  { id: "s1", name: "<p>Assay</p>", description: "", groupName: "", instrumentId: null, analysisType: null, order: 0, fields: [{ id: "f1", questionId: "q1", required: true, description: "", rank: 0 }, { id: "f2", questionId: "q2", required: false, description: "", rank: 1 }] },
  { id: "s2", name: "<p>pH</p>", description: "", groupName: "", instrumentId: null, analysisType: null, order: 1, fields: [] },
] };
const section = (overrides: Partial<TemplateSection>): TemplateSection => ({ key: "k", sectionId: null, name: "", description: "", groupName: "", instrumentId: null, analysisType: null, questions: [], ...overrides });
const question = (fieldId: string | null, questionId: string, required = false) => ({ key: questionId, fieldId, questionId, label: questionId, type: 0 as const, options: [], required, description: "" });

describe("template edits", () => {
  it("makes no writes when nothing changed", () => {
    expect(editPlan(loaded, "Paracetamol ARD", 0, [section({ sectionId: "s1", name: "<p>Assay</p>", questions: [question("f1", "q1", true), question("f2", "q2")] }), section({ sectionId: "s2", name: "<p>pH</p>" })])).toEqual([]);
  });
  it("deletes before it creates, and moves fields by rank", () => {
    const plan = editPlan(loaded, "Paracetamol ARD v2", 0, [section({ sectionId: "s1", name: "<p>Assay</p>", questions: [question("f2", "q2"), question(null, "q3")] }), section({ name: "<p>New</p>", questions: [question(null, "q4")] })]);
    expect(plan.map((write) => write.kind)).toEqual(["metadata", "delete-field", "delete-section", "create-section", "update-field", "create-field"]);
    expect(plan.find((write) => write.kind === "update-field")).toMatchObject({ fieldId: "f2", body: { rank: 0 } });
  });
  it("creates a template with ordered sections and ranked fields", () => {
    expect(createRequest(" New ", 1, [section({ name: "<p>A</p>", groupName: " G ", questions: [question(null, "q1", true)] })])).toEqual({ name: "New", type: 1,
      sections: [{ name: "<p>A</p>", description: null, order: 0, instrumentId: null, groupName: "G", fields: [{ questionId: "q1", required: true, description: null, rank: 0 }] }] });
  });
});
