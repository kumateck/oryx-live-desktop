import type { FormFieldDto, FormResponseDto, FormSectionDto } from "@/shared/ard-view/dto";
import { isQuestionType } from "@/shared/questions/question-types";
import type { ArdResultField, ArdResultSection } from "../schemas/ard-result-schema";
import type { RecordedAnswer } from "./ard-results";

const displayField = (field: ArdResultField): FormFieldDto => ({
  ...(field.id ? { id: field.id } : {}), ...(field.rank != null ? { rank: field.rank } : {}),
  ...(field.description != null ? { description: field.description } : {}),
  ...(field.question ? { question: {
    label: field.question.label, ...(isQuestionType(field.question.type) ? { type: field.question.type } : {}),
    options: (field.question.options ?? []).map((option) => ({ name: option.name })),
  } } : {}),
});

/** Retain recorded evidence when adapting the approval API to the shared Next worksheet. */
export function ardDisplayData(sections: readonly ArdResultSection[], recorded: ReadonlyMap<string, RecordedAnswer>) {
  const displaySections: FormSectionDto[] = sections.map((section) => ({
    ...(section.id ? { id: section.id } : {}), name: section.name, description: section.description,
    ...(section.groupName != null ? { groupName: section.groupName } : {}), fields: section.fields.map(displayField),
  }));
  const responses: FormResponseDto[] = [...recorded.values()].map((answer) => ({
    value: answer.value, ...(answer.responseId ? { responseId: answer.responseId } : {}),
    ...(answer.formField ? { formField: displayField(answer.formField) } : {}),
    ...(answer.complies != null ? { complies: answer.complies } : {}),
    ...(answer.formulaGoverned != null ? { formulaGoverned: answer.formulaGoverned } : {}),
    ...(answer.formulaResultFinalized != null ? { formulaResultFinalized: answer.formulaResultFinalized } : {}),
    formulaExecutionId: answer.formulaExecutionId ?? null, formulaDisplayResultsJson: answer.formulaDisplayResultsJson ?? null,
    attachments: (answer.attachments ?? []).map((attachment) => ({ name: attachment.name, link: attachment.link })),
  }));
  return { sections: displaySections, responses };
}
