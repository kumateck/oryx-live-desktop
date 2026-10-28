import { QuestionType } from "@/shared/questions/question-types";
import { answerComplete } from "./answer-completeness";
import { answerFingerprint, storedFingerprint, storedToAnswer, type AnswerValue } from "./answers";
import type { FormField } from "./form-model";
import type { StoredAnswers } from "./use-answer-form";

/** An editable field must match the saved version, including an acknowledged upload not yet refetched. */
export function draftStatus(field: FormField, value: AnswerValue | undefined, editable: boolean, stored: StoredAnswers, acknowledged: ReadonlyMap<string, string>): "incomplete" | "unsaved" | "saved" {
  const raw = stored.get(field.id)?.value;
  const type = field.question.type;
  const current = answerFingerprint(value, type);
  const saved = acknowledged.get(field.id) ?? storedFingerprint(raw, type);
  // File inputs cannot be restored by the browser; a persisted attachment represents their current value.
  if (type === QuestionType.FileUpload && (!editable || current === null)) return saved === null ? "incomplete" : "saved";
  const shown = editable ? value : storedToAnswer(raw, type);
  if (!answerComplete(field, shown)) return "incomplete";
  return !editable || current === saved ? "saved" : "unsaved";
}
