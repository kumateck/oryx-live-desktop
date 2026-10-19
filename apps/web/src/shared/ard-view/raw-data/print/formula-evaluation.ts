import { z } from "zod";
import { FormulaType } from "@/shared/questions/question-types";
import { evaluationSettings } from "@/shared/formula/ui/types/evaluate/settings";
import { normalizeFormulaResponse } from "./normalize-formula-response";
import { storedFormulaEvaluations } from "./stored-formula-evaluations";
import { sanitizeString } from "@/shared/ard-view/legacy";
import { calculateStats } from "@/shared/formula/ui/types/utils";
import { ExpressionExtract } from "@/shared/formula/ui/types/expression/universal/types";
import {
  buildInitialHeaders,
  buildInputVariables,
  coerceManualVars,
  computeAverageResult,
  computeFormulaResults,
  parseFormulaResponse,
  parseJson,
} from "@/shared/formula/compute/formula-compute";
import { toDisplayedFormulaResult } from "./compact-formula-result";
import { getSimpleFormulaEvaluation } from "./simple-formula-evaluation";

const getTableVars = (headers: string[], data: string[][]) => {
  const stats = headers.map((_header, colIdx) => {
    const values = data
      .map((row) => row[colIdx])
      .filter((value) => value !== "" && !isNaN(Number(value)))
      .map((value) => Number(value));
    return calculateStats(values);
  });

  return headers.reduce<Record<string, number | null>>(
    (acc, _header, index) => {
      const prefix = index === 0 ? "standard" : `sample${index}`;
      acc[`${prefix}Avg`] = stats[index]?.avg ?? null;
      acc[`${prefix}SD`] = stats[index]?.sd ?? null;
      acc[`${prefix}RSD`] = stats[index]?.rsd ?? null;
      return acc;
    },
    {},
  );
};

const getCalculatedFormulaEvaluations = (
  response: unknown,
  settings?: string | null,
) => {
  const parsed = parseJson<ExpressionExtract>(sanitizeString(settings));
  const parsedResponse = parseFormulaResponse(sanitizeString(response));
  if (!parsed || !parsedResponse) return null;

  const headers = buildInitialHeaders(parsed);
  const data = parsedResponse.tableData || [];
  const standardInputs = (parsed.standardInputs || []).map((input) => ({
    ...input,
    value: sanitizeString(parsedResponse.standardInputs?.[input.key]),
  }));
  const sampleInputs = (parsed.sampleInputs || []).map((inputs, sampleIndex) =>
    inputs.map((input) => ({
      ...input,
      value: sanitizeString(
        parsedResponse.sampleInputs?.[sampleIndex]?.[input.key],
      ),
    })),
  );
  const manualVars = coerceManualVars(
    parsedResponse.manualVars ?? parsed.manualVars,
  );
  const results = computeFormulaResults({
    parsed,
    headers,
    data,
    inputVariables: buildInputVariables(parsed, standardInputs, sampleInputs),
    tableVars: getTableVars(headers, data),
    manualVars,
  });
  const average = computeAverageResult(results, parsed.averageAllResults);

  return {
    entries: results.map((entry) => ({
      label: entry.sample,
      result: toDisplayedFormulaResult(entry.result, parsed.percentageResults),
    })),
    average: toDisplayedFormulaResult(average, parsed.percentageResults),
    decimalPlaces: parsed.decimalPlaces,
    percentageResults: Boolean(parsed.percentageResults),
  };
};

export const getCompactFormulaEvaluations = (response: unknown, settings?: string | null) => {
  const definition = evaluationSettings(sanitizeString(settings));
  const normalized = typeof response === "string" ? normalizeFormulaResponse(response) : response;
  if (definition) {
    if (definition.type === FormulaType.Simple) {
      const simple = getSimpleFormulaEvaluation(normalized, definition.settings);
      if (simple) return simple;
      // Missing inputs are unresolved, even if a stale result was saved alongside them.
      return { entries: [], average: null, decimalPlaces: undefined, percentageResults: false };
    }
    if (definition.type === FormulaType.Universal) {
      const calculated = getCalculatedFormulaEvaluations(normalized, definition.settings);
      if (calculated) return calculated;
    }
  }
  const json = z.json().safeParse(normalized);
  return storedFormulaEvaluations(json.success ? json.data : null);
};
