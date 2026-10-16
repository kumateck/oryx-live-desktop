import { z } from "zod";
import type { DomainEntitiesFormsRequestCreateQuestionRequest } from "@/shared/api/generated/forms";
import { questionSchema } from "@/shared/form-response/form-model";
import type { SelectOption } from "@/shared/forms/form-wizard-types";
import { isChoiceQuestion, QuestionType, type QuestionType as QuestionTypeValue } from "@/shared/questions/question-types";
import { typeOption } from "../lib/questions";

const createdSchema = z.object({ createdAt: z.string().nullish() });
/** A question in the list. Questions without an id cannot be opened and are left out. */
export const questionRowsSchema = z.array(z.unknown()).transform((rows) => rows.flatMap((row) => {
  const question = questionSchema.safeParse(row);
  const created = createdSchema.safeParse(row);
  return question.success && question.data.id ? [{ ...question.data, id: question.data.id, createdAt: created.success ? created.data.createdAt ?? null : null }] : [];
}));
export type QuestionRow = z.infer<typeof questionRowsSchema>[number];

export const questionFormSchema = z.object({
  label: z.string().trim().min(1, "Enter the question.").max(200, "Use no more than 200 characters."),
  type: z.custom<SelectOption>().nullable().refine((value): boolean => value !== null, "Choose the question type."),
  reference: z.string().trim().max(100, "Use no more than 100 characters."),
  description: z.string().trim().max(2000, "Use no more than 2,000 characters."),
  isMultiSelect: z.boolean(),
  options: z.array(z.object({ id: z.string(), name: z.string() })),
}).superRefine((values, context) => {
  const type = Number(values.type?.value);
  if (isChoiceQuestion(type) && !values.options.some((option) => option.name.trim())) context.addIssue({ code: "custom", path: ["options"], message: "Add at least one answer option." });
  const names = values.options.map((option) => option.name.trim().toLowerCase()).filter(Boolean);
  if (new Set(names).size !== names.length) context.addIssue({ code: "custom", path: ["options"], message: "Each option must be different." });
});
export type QuestionFormValues = z.infer<typeof questionFormSchema>;

let draftId = 0;
export const newOption = (name = "") => ({ id: `option-${String(++draftId)}`, name });
export function questionDefaults(row: QuestionRow | null): QuestionFormValues {
  return {
    label: row?.label ?? "", type: typeOption(row?.type ?? QuestionType.ShortAnswer), reference: row?.reference ?? "", description: row?.description ?? "",
    isMultiSelect: row?.isMultiSelect ?? false, options: row?.options.length ? row.options.map((name) => newOption(name)) : [newOption("Option 1")],
  };
}
/** An instrument question always takes several instruments; only choice questions keep their options. */
export function questionRequest(values: QuestionFormValues): DomainEntitiesFormsRequestCreateQuestionRequest {
  const type = Number(values.type?.value) as QuestionTypeValue;
  const choice = isChoiceQuestion(type);
  return {
    label: values.label.trim(), type, description: values.description.trim() || null, reference: values.reference.trim() || null,
    isMultiSelect: type === QuestionType.Instrument ? true : choice && values.isMultiSelect,
    options: choice ? values.options.map((option) => ({ name: option.name.trim() })).filter((option) => option.name) : null,
  };
}
