import { z } from "zod";
import { questionSchema } from "@/shared/form-response/form-model";
import { localKey, type FormType, type LoadedTemplate, type TemplateSection } from "./template-model";

const text = z.string().nullish().transform((value) => value ?? "");
const analysis = z.number().nullish().transform((value): 0 | 1 | null => value === 0 ? 0 : value === 1 ? 1 : null);
const fieldSchema = z.object({ id: z.string().min(1), required: z.boolean().nullish(), rank: z.number().nullish(), description: text, question: questionSchema.nullish() });
const sectionSchema = z.object({ id: z.string().min(1), name: text, description: text, groupName: text, order: z.number().nullish(), analysisType: analysis,
  instrument: z.object({ id: z.string().nullish() }).nullish(), fields: z.array(fieldSchema).nullish() });
const templateSchema = z.object({ id: z.string().min(1), name: text, type: z.number().nullish(), createdAt: z.string().nullish(), sections: z.array(sectionSchema).nullish() });
export const templateRowsSchema = z.array(templateSchema).transform((rows) => rows.map((row) => ({ id: row.id, name: row.name.trim() || "Untitled template", type: row.type ?? 0, tests: row.sections?.length ?? 0, createdAt: row.createdAt ?? null })));
export type TemplateRow = z.infer<typeof templateRowsSchema>[number];

/** A template as loaded, and its sections for editing. A copy drops every server id, so it is saved as a new template. */
export function readTemplate(data: unknown, keepIds: boolean): { loaded: LoadedTemplate; sections: TemplateSection[] } | null {
  const parsed = templateSchema.safeParse(data);
  if (!parsed.success) return null;
  const type: FormType = parsed.data.type === 1 ? 1 : 0;
  const sections = [...(parsed.data.sections ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((section, order) => ({
    id: section.id, name: section.name, description: section.description, groupName: section.groupName, instrumentId: section.instrument?.id ?? null, analysisType: section.analysisType, order,
    fields: [...(section.fields ?? [])].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0)).flatMap((field, rank) => field.question?.id ? [{ id: field.id, questionId: field.question.id, required: field.required ?? false,
      description: field.description, rank, question: field.question }] : []),
  }));
  return {
    loaded: { id: parsed.data.id, name: parsed.data.name, type, sections: sections.map((section) => ({ ...section, order: section.order, fields: section.fields.map(({ question: _question, ...field }) => field) })) },
    sections: sections.map((section) => ({ key: localKey("section"), sectionId: keepIds ? section.id : null, name: section.name, description: section.description, groupName: section.groupName,
      instrumentId: section.instrumentId, analysisType: section.analysisType, questions: section.fields.map((field) => ({ key: localKey("field"), fieldId: keepIds ? field.id : null, questionId: field.questionId,
        label: field.question.label, type: field.question.type, options: field.question.options, required: field.required, description: field.description })) })),
  };
}
