import type { FormFieldDto, FormResponseDto } from "@/shared/ard-view/dto";
import { isSectionQuestionLabelDistinct } from "@/shared/ard-view/raw-data/print/section-utils";
import { QuestionType, isChoiceQuestion } from "@/shared/questions/question-types";

/**
 * How an answer sits on the worksheet:
 * - "row": a short answer beside its label (Complies, 5.8, a date, a choice);
 * - "block": a longer answer under its label (paragraphs, tables, files, signatures);
 * - "formula": a calculation laid out in full;
 * - "header": equipment and instrument IDs, shown beside the test's name.
 */
export type AnswerLayout = "row" | "block" | "formula" | "header";

const blockTypes: readonly number[] = [QuestionType.LongAnswer, QuestionType.Paragraph, QuestionType.Table, QuestionType.FileUpload, QuestionType.Signature];
const headerTypes: readonly number[] = [QuestionType.Equipment, QuestionType.Instrument];

export function answerLayout(type: number | null | undefined): AnswerLayout {
  if (type === QuestionType.Formula) return "formula";
  if (type !== null && type !== undefined && headerTypes.includes(type)) return "header";
  if (type !== null && type !== undefined && blockTypes.includes(type)) return "block";
  return "row";
}

/** The label printed beside an answer. A question that only repeats its test's name reads as the observation. */
export function answerLabel(sectionName: string | null | undefined, questionLabel: string | null | undefined): string {
  return isSectionQuestionLabelDistinct(sectionName, questionLabel) ? (questionLabel ?? "").trim() : "Observation";
}

/** The field as it was answered: the template's question wins unless the answer was recorded against a stored formula. */
export function answeredField(response: FormResponseDto, field: FormFieldDto): FormResponseDto {
  if (response.formField?.formulaConfigurationHash) return response;
  const question = field.question ?? response.formField?.question;
  return { ...response, formField: { ...response.formField, ...field, ...(question ? { question } : {}) } };
}

/** A test shows its result beside the specification when it is calculated; an observation is already its own result. */
export const showsSectionResult = (fields: readonly FormFieldDto[]) => fields.some((field) => field.question?.type === QuestionType.Formula);

export { isChoiceQuestion };
