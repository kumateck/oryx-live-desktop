import { sanitizeNumber, sanitizeString } from "@/shared/formula/ui/legacy";
import {
  normalizeMathExpression,
  sanitizeForEval,
} from "@/shared/formula/ui/types/utils";
import { evaluateExpression as safeEval } from "@/shared/formula/ui/types/expression/universal/engine/expressionEngine";
import {
  expandAutoSampleTemplates,
  resolveToken,
} from "@/shared/formula/ui/types/expression/universal/token";
import type {
  ExpressionExtract,
  ManualVarsMap,
} from "@/shared/formula/ui/types/expression/universal/types";
import {
  inlineUniversalNamedExpressions,
  parseUniversalNamedExpressions,
} from "@/shared/formula/builder/universal-named-expressions";

export * from "./formula-compute-helpers";

export type FormulaComputedResult = {
  sample: string;
  result: number | null;
  expression: string;
  substitutedExpression: string;
};

const hasBalancedParentheses = (expr: string): boolean => {
  let count = 0;
  for (let i = 0; i < expr.length; i++) {
    if (expr[i] === "(") count++;
    if (expr[i] === ")") count--;
    if (count < 0) return false;
  }
  return count === 0;
};

export const formatAutoComputedNumber = (value: string | number): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return raw;
  const numeric = sanitizeNumber(raw);
  if (!Number.isFinite(numeric)) return raw;

  const decimalPart = raw.split(".")[1];
  if (!decimalPart || decimalPart.length <= 4) {
    return String(numeric);
  }

  return numeric.toFixed(4);
};

export const normalizeAutoComputedNumber = (value: string | number): number => {
  return sanitizeNumber(formatAutoComputedNumber(value));
};

const formatExpressionNumericPrecision = (expr: string): string => {
  return expr.replace(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi, (token) => {
    if (!token.includes(".") && !/[eE]/.test(token)) return token;
    return String(normalizeAutoComputedNumber(token));
  });
};

export const normalizeFormulaExpressionText = (expression?: string): string => {
  return sanitizeString(expression).replace(/\s+/g, "");
};

export const computeFormulaResults = (args: {
  parsed: ExpressionExtract | null | undefined;
  headers: string[];
  data: string[][];
  inputVariables: Record<string, string | number>;
  tableVars: Record<string, number | null>;
  manualVars: ManualVarsMap;
}): FormulaComputedResult[] => {
  const { parsed, headers, data, inputVariables, tableVars, manualVars } = args;
  if (!parsed) return [];

  const out: FormulaComputedResult[] = [];
  const namedExpressions = parseUniversalNamedExpressions(
    parsed as unknown as Record<string, unknown>,
  );
  const startIdx = parsed.standardInTable ? 1 : 0;
  if (sanitizeNumber(headers.length) <= startIdx) return [];

  for (
    let sampleIdx = startIdx;
    sampleIdx < sanitizeNumber(headers.length);
    sampleIdx++
  ) {
    const sampleNumber = parsed.standardInTable ? sampleIdx : sampleIdx + 1;
    let expr = normalizeFormulaExpressionText(parsed.expression);
    expr = inlineUniversalNamedExpressions(
      expr,
      namedExpressions,
      sampleNumber,
      parsed as unknown as Record<string, unknown>,
    );
    expr = expandAutoSampleTemplates(
      expr,
      sampleNumber,
      (parsed.sampleInputs?.[sampleNumber - 1] ?? []).map(({ key }) => key),
    );

    const displayExpr = expr.replace(
      /:R(\d+)sample\b/gi,
      (_m, r: string) => `:R${r}sample${sampleNumber}`,
    );

    const substituted = expr.replace(/:([A-Za-z0-9_.]+)/g, (_m, varName) =>
      resolveToken(varName, {
        sampleIndex: sampleIdx,
        headers,
        data,
        constants: parsed.constants || {},
        inputVariables,
        tableVars,
        manualVars,
      }),
    );
    const displaySubstituted = formatExpressionNumericPrecision(substituted);

    if (/:([A-Za-z0-9_.]+)/.test(substituted)) {
      out.push({
        sample: headers[sampleIdx] ?? "",
        result: null,
        expression: displayExpr,
        substitutedExpression: displaySubstituted,
      });
      continue;
    }

    if (!hasBalancedParentheses(substituted) || !sanitizeForEval(substituted)) {
      out.push({
        sample: headers[sampleIdx] ?? "",
        result: null,
        expression: displayExpr,
        substitutedExpression: displaySubstituted,
      });
      continue;
    }

    try {
      out.push({
        sample: headers[sampleIdx] ?? "",
        result: safeEval(normalizeMathExpression(substituted), {}),
        expression: displayExpr,
        substitutedExpression: displaySubstituted,
      });
    } catch {
      out.push({
        sample: headers[sampleIdx] ?? "",
        result: null,
        expression: displayExpr,
        substitutedExpression: displaySubstituted,
      });
    }
  }

  return out;
};

export const computeAverageResult = (
  results: FormulaComputedResult[],
  averageAllResults?: boolean,
) => {
  if (!averageAllResults) return null;
  const valid = results
    .map((r) => r.result)
    .filter((x): x is number => x !== null);
  if (!valid.length) return null;
  return valid.reduce((s, v) => s + v, 0) / valid.length;
};
