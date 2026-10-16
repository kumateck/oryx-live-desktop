import {
  FormResponseDto,
  FormSectionDto,
} from "@/shared/ard-view/dto";

const safeNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export const buildFormResponsesFromSections = (
  sections?: FormSectionDto[],
): FormResponseDto[] => {
  if (!sections?.length) return [];

  const sortedSections = [...sections].sort(
    (a, b) => safeNumber(a.order) - safeNumber(b.order),
  );

  return sortedSections.flatMap((section) => {
    const fields = [...(section.fields ?? [])].sort(
      (a, b) => safeNumber(a.rank) - safeNumber(b.rank),
    );

    return fields.map(
      (field) =>
        ({
          formField: field,
          value: null,
        }) as FormResponseDto,
    );
  });
};
