import { z } from "zod";
const json = z.json();
type JsonValue = z.infer<typeof json>;

import { sanitizeString } from "@/shared/ard-view/legacy";

export type EvalEntry = {
  label: string;
  result: number | null;
};
const toNumberOrNull = (value: JsonValue | undefined): number | null => {
  if (typeof value !== "number" && typeof value !== "string" || typeof value === "string" && !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};
const asObject = (value: JsonValue | undefined): Record<string, JsonValue> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value;
};
const parseJsonMaybe = (value: JsonValue | undefined): JsonValue | undefined => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return json.parse(JSON.parse(trimmed));
  } catch {
    return value;
  }
};
const unwrapFormulaPayload = (
  value: JsonValue | undefined,
  depth = 0,
): Record<string, JsonValue> | null => {
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
const toEvalItem = (item: JsonValue | undefined, index: number): EvalEntry | null => {
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
const fromResultsArray = (value: JsonValue | undefined): EvalEntry[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => toEvalItem(item, index))
    .filter((item): item is EvalEntry => Boolean(item));
};
const fromSampleResultsObject = (value: JsonValue | undefined): EvalEntry[] => {
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
  payload: Record<string, JsonValue>,
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

const fromManualVarsObject = (value: JsonValue | undefined): EvalEntry[] => {
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


export function storedFormulaEvaluations(response: JsonValue | undefined) {
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
}
