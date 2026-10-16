import { sanitizeNumber } from "@/shared/formula/ui/legacy";
import type {
  ExpressionExtract,
  FirstColumnPurpose,
  LabeledInputField,
  ManualVarsMap,
} from "@/shared/formula/ui/types/expression/universal/types";
import {
  configuredUniversalInputVariableKeys,
  sampleInputTemplateVariableKey,
  sampleInputVariableKey,
  standardInputVariableKey,
} from "@/shared/formula/builder/universal-variable-keys";

export type FormulaResponseShape = {
  standardInputs?: Record<string, string> | undefined;
  sampleInputs?: Array<Record<string, string>> | undefined;
  tableData?: string[][] | undefined;
  manualVars?:
    | ManualVarsMap
    | Record<
        string,
        {
          label?: string | undefined;
          raw?: string | undefined;
          value?: string | number | undefined;
          evaluated?: number | null | undefined;
        }
      >;
};

const PURPOSE_LABEL: Record<FirstColumnPurpose, string> = {
  standard: "Standard",
  blank: "Blank",
  titre: "Titre",
  control: "Control",
};

export const parseJson = <T>(value?: string): T | null => {
  if (!value) return null;
  try {
    const firstPass = JSON.parse(value) as unknown;
    const parsed =
      typeof firstPass === "string"
        ? (JSON.parse(firstPass) as unknown)
        : firstPass;

    if (!parsed || typeof parsed !== "object") return parsed as T;

    const candidate = parsed as Record<string, unknown>;
    const nestedExpression = candidate.expression;

    if (
      typeof nestedExpression === "string" &&
      nestedExpression.trim().startsWith("{")
    ) {
      try {
        const nested = JSON.parse(nestedExpression) as unknown;
        if (nested && typeof nested === "object") {
          return {
            ...candidate,
            ...(nested as Record<string, unknown>),
          } as T;
        }
      } catch {
        return parsed as T;
      }
    }

    return parsed as T;
  } catch {
    return null;
  }
};

export const parseFormulaResponse = (
  value?: string,
): FormulaResponseShape | null => {
  const parsed = parseJson<unknown>(value);
  if (!parsed || typeof parsed !== "object") return null;

  const candidate = parsed as Record<string, unknown>;
  const nested = candidate.value;
  if (typeof nested === "string") {
    const nestedParsed = parseJson<FormulaResponseShape>(nested);
    if (nestedParsed && typeof nestedParsed === "object") return nestedParsed;
  }

  return candidate as FormulaResponseShape;
};

export const coerceManualVars = (
  mv?:
    | ManualVarsMap
    | Record<
        string,
        {
          label?: string | undefined;
          raw?: string | undefined;
          value?: string | number | undefined;
          evaluated?: number | null | undefined;
        }
      >,
): ManualVarsMap => {
  if (!mv) return {};
  const result: ManualVarsMap = {};
  Object.entries(mv).forEach(([k, entry]) => {
    const v: { label?: string | undefined; raw?: string | undefined; evaluated?: number | null | undefined; value?: string | number | undefined } = entry;
    if ("raw" in v && "evaluated" in v) {
      result[k] = {
        label: v.label || "",
        raw: v.raw ?? "",
        evaluated: typeof v.evaluated === "number" ? v.evaluated : null,
      };
      return;
    }
    result[k] = {
      label: v.label || "",
      raw: String(v.value ?? ""),
      evaluated: null,
    };
  });
  return result;
};

export const buildInitialHeaders = (
  parsed?: ExpressionExtract | null,
): string[] => {
  if (parsed?.headers?.length) return parsed.headers;
  const sampleCount = sanitizeNumber(
    parsed?.numberOfSamples ?? parsed?.noOfSamples ?? 0,
  );
  const samples = Array(sampleCount)
    .fill("")
    .map((_, i) => `Sample ${i + 1}`);
  if (parsed?.standardInTable) {
    return [
      PURPOSE_LABEL[parsed?.firstColumnPurpose || "standard"],
      ...samples,
    ];
  }
  return samples;
};

export const buildInputVariables = (
  parsed: ExpressionExtract | null | undefined,
  standardInputs: LabeledInputField[],
  sampleInputs: LabeledInputField[][],
) => {
  const varsMap: Record<string, string | number> = {};
  const standardInputsEnabled =
    parsed?.standardInput ?? Boolean(parsed?.standardInputs?.length);
  const sampleInputsEnabled =
    parsed?.sampleInput ?? Boolean(parsed?.sampleInputs?.length);
  if (
    standardInputsEnabled &&
    parsed?.standardInTable &&
    parsed?.standardInputs
  ) {
    standardInputs.forEach((input) => {
      const value = input.value === "" ? "" : Number(input.value);
      varsMap[`standardInput.${input.key}`] = value;
      varsMap[standardInputVariableKey(input.key)] = value;
    });
  }
  if (sampleInputsEnabled && parsed?.sampleInputs) {
    sampleInputs.forEach((sample, i) => {
      sample.forEach((input) => {
        const value = input.value === "" ? "" : Number(input.value);
        varsMap[`sampleInput${i + 1}.${input.key}`] = value;
        varsMap[sampleInputVariableKey(i + 1, input.key)] = value;
        if (i === 0) {
          varsMap[`sampleInput.${input.key}`] = value;
          varsMap[sampleInputTemplateVariableKey(input.key)] = value;
        }
      });
    });
  }
  return varsMap;
};

export const isManualVarKey = (
  key: string,
  constants: Record<string, number> | undefined,
  namedExpressionKeys: ReadonlySet<string> = new Set(),
  inputConfig?: ExpressionExtract | null,
) => {
  if (
    /^(?:sample(?:\d+)?(?:avg|sd|rsd)|standard(?:avg|sd|rsd))$/i.test(key) ||
    /^(?:sampleInput(?:\d+)?|standardInput)(?:\.|$)/i.test(key)
  ) {
    return false;
  }
  if (/^(spl|blk|std)\.?[A-Za-z0-9_]+$/i.test(key)) return false;
  if (constants && key in constants) return false;
  if (namedExpressionKeys.has(key)) return false;
  if (
    inputConfig &&
    configuredUniversalInputVariableKeys(
      inputConfig as unknown as Record<string, unknown>,
    ).has(key)
  )
    return false;
  if (/^R\d+[A-Za-z0-9_]+$/.test(key)) return false;
  return true;
};
