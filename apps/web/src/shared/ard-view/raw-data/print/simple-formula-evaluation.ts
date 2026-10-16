import { FormulaTypes, sanitizeString } from "@/shared/ard-view/legacy";
import { evaluateExpression as safeEval } from "@/shared/formula/ui/types/expression/universal/engine/expressionEngine";
import { sanitizeForEval } from "@/shared/formula/ui/types/utils";
import {
  extractFormulaVariables,
  parseSimpleFormulaResponse,
  parseSimpleFormulaSettings,
  substituteFormulaValues,
} from "@/shared/formula/compute/simple-formula";
import { toDisplayedFormulaResult } from "./compact-formula-result";

export const getSimpleFormulaEvaluation = (
  response: unknown,
  settings?: string | null,
) => {
  const parsed = parseSimpleFormulaSettings(sanitizeString(settings));
  if (!parsed || Number(parsed.type) !== FormulaTypes.Simple) return null;

  const constants = parsed.constants ?? {};
  const values = parseSimpleFormulaResponse(sanitizeString(response));
  const variables = extractFormulaVariables(parsed.expression, constants);
  const inputs = variables.reduce<Record<string, unknown>>((acc, key) => {
    acc[key] = values[key];
    return acc;
  }, {});
  const substituted = substituteFormulaValues(
    parsed.expression,
    inputs,
    constants,
  );
  if (/:([A-Za-z0-9_]+)/.test(substituted) || !sanitizeForEval(substituted)) {
    return null;
  }

  const rawResult = safeEval(substituted, {});
  if (rawResult === null) return null;

  return {
    entries: [
      {
        label: "Result",
        result: toDisplayedFormulaResult(rawResult, parsed.percent),
      },
    ],
    average: null,
    decimalPlaces: parsed.decimalPlaces,
    percentageResults: Boolean(parsed.percent),
  };
};
