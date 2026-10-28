import type {
  DomainEntitiesFormsRequestCreateFormFieldRequest, DomainEntitiesFormsRequestCreateFormRequest, DomainEntitiesFormsRequestCreateFormSectionRequest,
  DomainEntitiesFormsRequestUpdateFormSectionRequest,
} from "@/shared/api/generated/forms";
import type { QuestionType } from "@/shared/questions/question-types";

/** A question placed in a test of the template. `fieldId` is set once the field exists on the server. */
export interface TemplateQuestion { key: string; fieldId: string | null; questionId: string; label: string; type: QuestionType; options: string[]; required: boolean; description: string }
/** A test of the template. `sectionId` is set once the section exists on the server; `instrumentId` is kept as loaded. */
export interface TemplateSection { key: string; sectionId: string | null; name: string; description: string; groupName: string; instrumentId: string | null; analysisType: 0 | 1 | null; questions: TemplateQuestion[] }
export type FormType = 0 | 1;

/** The template as it was loaded: what the edit is compared with. */
export interface LoadedTemplate {
  id: string; name: string; type: FormType;
  sections: { id: string; name: string; description: string; groupName: string; instrumentId: string | null; analysisType: 0 | 1 | null; order: number;
    fields: { id: string; questionId: string; required: boolean; description: string; rank: number }[] }[];
}

let counter = 0;
export const localKey = (prefix: string) => `${prefix}-${String(++counter)}`;
export const emptySection = (): TemplateSection => ({ key: localKey("section"), sectionId: null, name: "", description: "", groupName: "", instrumentId: null, analysisType: null, questions: [] });
/** A rich-text name with nothing in it, as the editor leaves an untouched field. */
export const blankHtml = (value: string) => !value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();

const sectionBody = (section: TemplateSection, order: number) => ({ name: section.name, description: section.description || null, order, instrumentId: section.instrumentId,
  groupName: section.groupName.trim() || null, ...(section.analysisType === null ? {} : { analysisType: section.analysisType }) });
const fieldBody = (question: TemplateQuestion, rank: number): DomainEntitiesFormsRequestCreateFormFieldRequest => ({ questionId: question.questionId, required: question.required, description: question.description || null, rank });

export function createRequest(name: string, type: FormType, sections: readonly TemplateSection[]): DomainEntitiesFormsRequestCreateFormRequest {
  return { name: name.trim(), type, sections: sections.map((section, order): DomainEntitiesFormsRequestCreateFormSectionRequest => ({ ...sectionBody(section, order), fields: section.questions.map(fieldBody) })) };
}

/** One write of an edit. Deletions come first so a moved field never collides with the one it replaces; then sections and fields in order. */
export type TemplateWrite =
  | { kind: "metadata"; body: { name: string; type: FormType } }
  | { kind: "delete-section"; sectionId: string }
  | { kind: "create-section"; body: DomainEntitiesFormsRequestCreateFormSectionRequest }
  | { kind: "update-section"; sectionId: string; body: DomainEntitiesFormsRequestUpdateFormSectionRequest }
  | { kind: "delete-field"; fieldId: string }
  | { kind: "create-field"; sectionId: string; body: DomainEntitiesFormsRequestCreateFormFieldRequest }
  | { kind: "update-field"; fieldId: string; body: DomainEntitiesFormsRequestCreateFormFieldRequest };

const same = (left: string | null | undefined, right: string | null | undefined) => (left ?? "").trim() === (right ?? "").trim();

/** The writes that turn the loaded template into the edited one. Unchanged sections and fields are left alone. */
export function editPlan(loaded: LoadedTemplate, name: string, type: FormType, sections: readonly TemplateSection[]): TemplateWrite[] {
  const writes: TemplateWrite[] = [];
  if (!same(loaded.name, name) || loaded.type !== type) writes.push({ kind: "metadata", body: { name: name.trim(), type } });
  const kept = new Set(sections.flatMap((section) => section.sectionId ? [section.sectionId] : []));
  for (const section of loaded.sections) if (!kept.has(section.id)) writes.push({ kind: "delete-section", sectionId: section.id });
  const byId = new Map(loaded.sections.map((section) => [section.id, section]));
  sections.forEach((section, order) => {
    const original = section.sectionId ? byId.get(section.sectionId) : undefined;
    if (!section.sectionId || !original) { writes.push({ kind: "create-section", body: { ...sectionBody(section, order), fields: section.questions.map(fieldBody) } }); return; }
    const body = sectionBody(section, order);
    if (!same(original.name, body.name) || !same(original.description, body.description) || !same(original.groupName, body.groupName) || (original.instrumentId ?? null) !== (body.instrumentId ?? null)
      || original.order !== order || original.analysisType !== section.analysisType) writes.push({ kind: "update-section", sectionId: original.id, body });
    const keptFields = new Set(section.questions.flatMap((question) => question.fieldId ? [question.fieldId] : []));
    for (const field of original.fields) if (!keptFields.has(field.id)) writes.push({ kind: "delete-field", fieldId: field.id });
    const fields = new Map(original.fields.map((field) => [field.id, field]));
    section.questions.forEach((question, rank) => {
      const field = question.fieldId ? fields.get(question.fieldId) : undefined;
      const next = fieldBody(question, rank);
      if (!question.fieldId || !field) writes.push({ kind: "create-field", sectionId: original.id, body: next });
      else if (field.questionId !== question.questionId || field.required !== question.required || !same(field.description, question.description) || field.rank !== rank) writes.push({ kind: "update-field", fieldId: field.id, body: next });
    });
  });
  const order: Record<TemplateWrite["kind"], number> = { metadata: 0, "delete-field": 1, "delete-section": 2, "create-section": 3, "update-section": 3, "create-field": 4, "update-field": 4 };
  return writes.map((write, index) => ({ write, index })).sort((a, b) => order[a.write.kind] - order[b.write.kind] || a.index - b.index).map((entry) => entry.write);
}
