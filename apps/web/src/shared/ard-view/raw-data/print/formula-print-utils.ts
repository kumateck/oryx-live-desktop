import { sanitizeString } from "@/shared/ard-view/legacy";
import type {
  ExpressionExtract,
  LabeledInputField,
  ManualVarsMap,
} from "@/shared/formula/ui/types/expression/universal/types";

export const hasFormulaResponseValues = ({
  data,
  manualVars,
  sampleInputs,
  standardInputs,
}: {
  data: string[][];
  manualVars: ManualVarsMap;
  sampleInputs: LabeledInputField[][];
  standardInputs: LabeledInputField[];
}) =>
  standardInputs.some((input) => sanitizeString(input.value) !== "") ||
  sampleInputs.some((sample) =>
    sample.some((input) => sanitizeString(input.value) !== ""),
  ) ||
  Object.values(manualVars).some(
    (value) =>
      sanitizeString(value.raw) !== "" ||
      (value.evaluated !== null &&
        value.evaluated !== undefined &&
        Number.isFinite(Number(value.evaluated))),
  ) ||
  data.some((row) => row.some((cell) => sanitizeString(cell) !== ""));

export const buildReadingLabels = ({
  data,
  hasValues,
  parsed,
}: {
  data: string[][];
  hasValues: boolean;
  parsed: ExpressionExtract | null;
}) => {
  const configured = (parsed?.rowHeaders || []).map((row, index) => {
    return sanitizeString(row?.label) || `Reading ${index + 1}`;
  });
  const rowCount = hasValues ? data.length : configured.length;
  return Array.from({ length: rowCount }).map((_, index) => {
    return configured[index] || `Reading ${index + 1}`;
  });
};
