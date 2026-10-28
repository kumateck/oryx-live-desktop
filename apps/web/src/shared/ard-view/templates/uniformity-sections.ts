import {
  FormulaTypes,
  QuestionType,
  sanitizeNumber,
  sanitizeString,
} from "@/shared/ard-view/legacy";
import { formulaPreview as extractFormulaPreview } from "@/shared/formula/formula-preview";
import {
  FormFieldDto,
  FormSectionDto,
} from "@/shared/ard-view/dto";

const isUniformityField = (field: FormFieldDto) => {
  if (
    sanitizeNumber(field.question?.type) !==
    sanitizeNumber(QuestionType.Formula)
  ) {
    return false;
  }

  const settings = sanitizeString(field.question?.options?.[0]?.name);
  return extractFormulaPreview(settings).type === FormulaTypes.Uniformity;
};

export const splitUniformitySections = (sections?: FormSectionDto[] | null) => {
  const uniformityFields: FormFieldDto[] = [];
  const testSections = (sections ?? [])
    .map((section) => {
      const fields = (section.fields ?? []).filter((field) => {
        if (!isUniformityField(field)) return true;
        uniformityFields.push(field);
        return false;
      });

      return { ...section, fields };
    })
    .filter((section) => (section.fields ?? []).length > 0);

  return { testSections, uniformityFields };
};
