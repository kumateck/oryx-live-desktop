import { QuestionType, sanitizeNumber } from "@/shared/ard-view/legacy";
import {
  FormFieldDto,
  FormResponseDto,
  QuestionOptionDto,
} from "@/shared/ard-view/dto";
import { renderStoredValue } from "./question-renderers/stored-value";
import { renderEmptyValue } from "./question-renderers/empty-value";

export const isInlinePrintQuestionType = (questionType?: QuestionType) => {
  const safeType = sanitizeNumber(questionType);
  return (
    safeType === sanitizeNumber(QuestionType.ShortAnswer) ||
    safeType === sanitizeNumber(QuestionType.LongAnswer) ||
    safeType === sanitizeNumber(QuestionType.Datepicker)
  );
};

export const renderPrintStoredResponseValue = (
  response?: FormResponseDto | undefined,
  templateField?: FormFieldDto | undefined,
) => {
  if (!response || !templateField) return renderStoredValue(response);

  const formField: FormFieldDto = { ...response.formField, ...templateField };
  const question = templateField.question ?? response.formField?.question;
  if (question) formField.question = question;
  return renderStoredValue({ ...response, formField });
};

export const renderResponseValue = (
  questionType?: QuestionType | undefined,
  options?: QuestionOptionDto[],
) => {
  return renderEmptyValue(questionType, options);
};
