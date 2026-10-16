import { sanitizeNumber, sanitizeString } from "@/shared/ard-view/legacy";
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

type EvalEntry = {
  label: string;
  result: number | null;
};
const toNumberOrNull = (value: unknown): number | null => {
  const num = sanitizeNumber(value);
  return Number.isFinite(num) ? num : null;
};
const asObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
};
const parseJsonMaybe = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};
const unwrapFormulaPayload = (
  value: unknown,
  depth = 0,
): Record<string, unknown> | null => {
  if (depth > 3) return asObject(value);
  const parsed = parseJsonMaybe(value);
  const obj = asObject(parsed);
  if (!obj) return null;

  const nested = obj.value;
  if (nested && (typeof nested === "string" || typeof nested === "object")) {
    const nestedParsed = parseJsonMaybe(nested);
    const nestedObj = asObject(nestedParsed);
    if (nestedObj) return unwrapFormulaPayload(nestedObj, depth + 1);
  }

  return obj;
};
const toEvalItem = (item: unknown, index: number): EvalEntry | null => {
  const obj = asObject(item);
  if (!obj) return null;
  const result = toNumberOrNull(obj.result);
  const sampleLabel = String(obj.sample ?? "").trim();
  const sampleIndex = toNumberOrNull(obj.sampleIndex);
  const label = sampleLabel
    ? sampleLabel
    : sampleIndex !== null
      ? `Sample ${sampleIndex + 1}`
      : `Sample ${index + 1}`;
  return { label, result };
};
const fromResultsArray = (value: unknown): EvalEntry[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => toEvalItem(item, index))
    .filter((item): item is EvalEntry => Boolean(item));
};
const fromSampleResultsObject = (value: unknown): EvalEntry[] => {
  const obj = asObject(value);
  if (!obj) return [];
  return Object.entries(obj)
    .map(([key, raw]) => {
      const result = toNumberOrNull(raw);
      const sampleNumber = Number(key.replace(/\D/g, ""));
      const label = Number.isFinite(sampleNumber)
        ? `Sample ${sampleNumber}`
        : key;
      return { label, result };
    })
    .filter((item) => item.result !== null);
};

const RESULT_KEY_PATTERN = /result|content|assay|purity|yield|average|avg/i;

const fromScalarResultFields = (
  payload: Record<string, unknown>,
): EvalEntry[] => {
  const resultKeys = [
    "result",
    "finalResult",
    "calculatedResult",
    "calculatedValue",
    "content",
    "assay",
    "purity",
    "yield",
  ];

  return resultKeys
    .map((key): EvalEntry | null => {
      if (!(key in payload)) return null;
      const result = toNumberOrNull(payload[key]);
      if (result === null) return null;
      return { label: key, result };
    })
    .filter((item): item is EvalEntry => Boolean(item));
};

const fromManualVarsObject = (value: unknown): EvalEntry[] => {
  const obj = asObject(value);
  if (!obj) return [];

  return Object.entries(obj)
    .map(([key, raw]): EvalEntry | null => {
      const item = asObject(raw);
      if (!item) return null;

      const result = toNumberOrNull(item.evaluated ?? item.value);
      if (result === null || !RESULT_KEY_PATTERN.test(key)) return null;

      const label = sanitizeString(item.label) || key;
      return { label, result };
    })
    .filter((item): item is EvalEntry => Boolean(item));
};

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

export const getCompactFormulaEvaluations = (
  response: unknown,
  settings?: string | null,
) => {
  const simple = getSimpleFormulaEvaluation(response, settings);
  if (simple) return simple;

  const calculated = getCalculatedFormulaEvaluations(response, settings);
  if (calculated) return calculated;

  const payload = unwrapFormulaPayload(response);
  if (!payload)
    return {
      entries: [] as EvalEntry[],
      average: null as number | null,
      decimalPlaces: undefined as number | "" | undefined,
      percentageResults: false,
    };

  const entries = [
    ...fromScalarResultFields(payload),
    ...fromResultsArray(payload.results),
    ...fromResultsArray(payload.evaluations),
    ...fromResultsArray(payload.expressionEvaluations),
    ...fromResultsArray(payload.sampleResults),
    ...fromSampleResultsObject(payload.sampleResults),
    ...fromManualVarsObject(payload.manualVars),
  ];

  const seen = new Set<string>();
  const deduped = entries.filter((entry) => {
    const key = `${entry.label}:${entry.result}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const average =
    toNumberOrNull(payload.averageResult) ??
    toNumberOrNull(payload.average) ??
    toNumberOrNull(payload.avg);

  return {
    entries: deduped,
    average,
    decimalPlaces: undefined,
    percentageResults: false,
  };
};
