import { QuestionType, sanitizeNumber, sanitizeString } from "@/shared/ard-view/legacy";
import {
  FormResponseDto,
  FormSectionDto,
} from "@/shared/ard-view/dto";

export const safeNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const normalizeText = (value?: string | null) =>
  (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

export const hasMeaningfulResponse = (response?: FormResponseDto) => {
  if (!response) return false;
  const value = sanitizeString(response.value);
  return value.length > 0 || Boolean(response.attachments?.length) || Boolean(response.formulaGoverned);
};

export const groupSections = (sections?: FormSectionDto[]) => {
  return (sections ?? [])
    .slice()
    .sort((a, b) => safeNumber(a.order) - safeNumber(b.order))
    .reduce<
      Array<{
        key: string;
        section: FormSectionDto;
        fields: NonNullable<FormSectionDto["fields"]>;
      }>
    >((acc, section) => {
      const key = normalizeText(section.name) || section.id || "section";
      const existing = acc.find((item) => item.key === key);
      const sortedFields = [...(section.fields ?? [])].sort(
        (a, b) => safeNumber(a.rank) - safeNumber(b.rank),
      );
      if (!existing) {
        acc.push({ key, section, fields: sortedFields });
        return acc;
      }
      existing.fields.push(...sortedFields);
      return acc;
    }, []);
};

export const getHeaderFieldForSection = (
  fields: NonNullable<FormSectionDto["fields"]>,
  type: QuestionType,
  responseMap: Map<string, FormResponseDto>,
) => {
  const toLabelFirst = (raw?: string | null) => {
    const trimmed = sanitizeString(raw);
    if (!trimmed) return "";
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) =>
            sanitizeString(
              typeof item === "object" && item
                ? ((item as { label?: unknown }).label ??
                    (item as { value?: unknown }).value)
                : item,
            ),
          )
          .filter(Boolean)
          .join(", ");
      }
      if (parsed && typeof parsed === "object") {
        const label = sanitizeString((parsed as { label?: unknown }).label);
        const value = sanitizeString((parsed as { value?: unknown }).value);
        return label || value;
      }
    } catch {
      return trimmed;
    }
    return trimmed;
  };

  const targetField = fields.find(
    (field) => sanitizeNumber(field.question?.type) === sanitizeNumber(type),
  );
  if (!targetField?.id) return null;
  const responseValue = toLabelFirst(responseMap.get(targetField.id)?.value);
  return { exists: true, value: responseValue };
};

export const isSectionQuestionLabelDistinct = (
  sectionName?: string | null,
  questionLabel?: string | null,
) => {
  const normalizedSection = normalizeText(sectionName);
  const normalizedQuestion = normalizeText(questionLabel);
  return (
    Boolean(normalizedQuestion) && normalizedQuestion !== normalizedSection
  );
};
