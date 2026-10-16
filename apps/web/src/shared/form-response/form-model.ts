import { z } from "zod";
import { isQuestionType, QuestionType } from "@/shared/questions/question-types";

const text = z.string().nullish().transform((value) => value?.trim() || null);

/** A question as a form uses it. `options` are the option names; a formula or table question keeps its definition in the first one. */
export const questionSchema = z.object({
  id: z.string().nullish(), label: text, type: z.number().nullish(), isMultiSelect: z.boolean().nullish(), reference: text, description: text,
  options: z.array(z.object({ id: z.string().nullish(), name: z.string().nullish() })).nullish(),
}).transform((question) => ({
  id: question.id ?? null, label: question.label ?? "Untitled question", type: isQuestionType(question.type) ? question.type : QuestionType.ShortAnswer,
  isMultiSelect: question.isMultiSelect ?? false, reference: question.reference, description: question.description,
  options: (question.options ?? []).flatMap((option) => option.name?.trim() ? [option.name] : []),
}));
export type FormQuestion = z.infer<typeof questionSchema>;

export const fieldSchema = z.object({ id: z.string().min(1), required: z.boolean().nullish(), rank: z.number().nullish(), description: text, question: questionSchema.nullish() })
  .transform((field) => ({ id: field.id, required: field.required ?? false, rank: field.rank ?? 0, description: field.description,
    question: field.question ?? { id: null, label: "Untitled question", type: QuestionType.ShortAnswer, isMultiSelect: false, reference: null, description: null, options: [] } }));
export type FormField = z.infer<typeof fieldSchema>;

export const sectionSchema = z.object({
  id: z.string().nullish(), name: z.string().nullish(), description: text, order: z.number().nullish(), groupName: text, analysisType: z.number().nullish(),
  fields: z.array(z.unknown()).nullish(),
}).transform((section, index) => ({
  id: section.id ?? `section-${String(index)}`, name: section.name ?? "", description: section.description, order: section.order ?? 0, groupName: section.groupName,
  analysisType: section.analysisType ?? null,
  fields: (section.fields ?? []).flatMap((field) => { const parsed = fieldSchema.safeParse(field); return parsed.success ? [parsed.data] : []; }).sort((a, b) => a.rank - b.rank),
}));
export type FormSection = z.infer<typeof sectionSchema>;

/** A form template: its sections in order, each with its fields in rank order. Fields without an id cannot be answered and are left out. */
export const formSchema = z.object({ id: z.string().min(1), name: text, sections: z.array(sectionSchema).nullish() })
  .transform((form) => ({ id: form.id, name: form.name ?? "Untitled form", sections: [...(form.sections ?? [])].sort((a, b) => a.order - b.order) }));
export type AnswerForm = z.infer<typeof formSchema>;

export const formFields = (form: AnswerForm) => form.sections.flatMap((section) => section.fields);
/** The definition a formula or table question carries in its first option. */
export const questionDefinition = (question: FormQuestion) => question.options[0] ?? "";

/** Only the sections and fields a person was assigned, in their original order. */
export function assignedSections(form: AnswerForm, fieldIds: ReadonlySet<string>): FormSection[] {
  return form.sections.map((section) => ({ ...section, fields: section.fields.filter((field) => fieldIds.has(field.id)) })).filter((section) => section.fields.length > 0);
}
