import { z } from "zod";
import type { DomainEntitiesFormsRequestCreateQuestionRequest } from "@/shared/api/generated/forms";
import type { FormQuestion } from "@/shared/form-response/form-model";
import { QuestionType } from "@/shared/questions/question-types";
import { emptyTable, parseTableConfig, serializeTableConfig } from "@/shared/questions/table-question";

export const tableQuestionSchema = z.object({
  label: z.string().trim().min(1, "Enter the question.").max(200, "Use no more than 200 characters."),
  description: z.string(),
  definition: z.string().refine((value): boolean => parseTableConfig(value) !== null, "Set up the table."),
});
export type TableQuestionValues = z.infer<typeof tableQuestionSchema>;
export const tableQuestionDefaults = (question: FormQuestion | null): TableQuestionValues => ({
  label: question?.label ?? "", description: question?.description ?? "", definition: question?.options[0] && parseTableConfig(question.options[0]) ? question.options[0] : serializeTableConfig(emptyTable()),
});
/** A table question keeps its grid as its one option, as Oryx Next stores it. */
export const tableQuestionRequest = (values: TableQuestionValues): DomainEntitiesFormsRequestCreateQuestionRequest => ({
  label: values.label.trim(), description: values.description.trim() || null, type: QuestionType.Table, isMultiSelect: false, options: [{ name: values.definition }],
});
