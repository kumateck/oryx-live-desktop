import { FormulaSourceType } from "./binding-contracts";

const PLACEMENT = "[A-Za-z0-9._%:-]+";
const QUESTION_VALUE = new RegExp(`^placement/${PLACEMENT}/value$`);
const QUESTION_TABLE_STAT = new RegExp(
  `^placement/${PLACEMENT}/table/column/(0|[1-9][0-9]*)$`,
);
const FORMULA_RESULT = new RegExp(
  `^placement/${PLACEMENT}/result/[A-Za-z0-9._%:-]+$`,
);

export const crossQuestionValueReference = (placementKey: string): string =>
  `placement/${encodeURIComponent(placementKey)}/value`;

export const crossQuestionTableStatisticReference = (
  placementKey: string,
  column: number,
): string =>
  `placement/${encodeURIComponent(placementKey)}/table/column/${column}`;

export const formulaResultReference = (
  placementKey: string,
  resultKey: string,
): string =>
  `placement/${encodeURIComponent(placementKey)}/result/${encodeURIComponent(resultKey)}`;

export const formulaResultReferenceParts = (
  reference: string,
): { placementKey: string; resultKey: string } | null => {
  if (!FORMULA_RESULT.test(reference)) return null;
  const parts = reference.split("/");
  try {
    return {
      placementKey: decodeURIComponent(parts[1]!),
      resultKey: decodeURIComponent(parts[3]!),
    };
  } catch {
    return null;
  }
};

export const isValidSourceReference = (
  sourceType: FormulaSourceType,
  reference: string,
): boolean => {
  if (sourceType === FormulaSourceType.QuestionValue)
    return QUESTION_VALUE.test(reference);
  if (sourceType === FormulaSourceType.QuestionTableColumnStat)
    return QUESTION_TABLE_STAT.test(reference);
  if (sourceType === FormulaSourceType.FormulaResult)
    return formulaResultReferenceParts(reference) !== null;
  return reference.trim().length > 0;
};
