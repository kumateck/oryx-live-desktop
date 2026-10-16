import { ExpressionExtract, VarMap } from "@/shared/formula/ui/types/type";

type FormulaResponse = Record<string, unknown>;

export const parseSimpleFormulaSettings = (
  raw: string,
): ExpressionExtract | null => {
  try {
    if (!raw || raw.trim() === "") return null;
    const firstPass = JSON.parse(raw) as unknown;
    const parsed =
      typeof firstPass === "string"
        ? (JSON.parse(firstPass) as ExpressionExtract)
        : (firstPass as ExpressionExtract);
    if (!parsed || typeof parsed !== "object") return null;

    const nestedExpression = parsed.expression;
    if (
      typeof nestedExpression === "string" &&
      nestedExpression.trim().startsWith("{")
    ) {
      try {
        const nested = JSON.parse(nestedExpression) as ExpressionExtract;
        if (nested && typeof nested === "object") {
          return {
            ...parsed,
            ...nested,
            expression:
              typeof nested.expression === "string"
                ? nested.expression
                : parsed.expression,
          };
        }
      } catch {
        return parsed;
      }
    }

    return parsed;
  } catch {
    return null;
  }
};

export const parseSimpleFormulaResponse = (raw: string): VarMap => {
  try {
    if (!raw || raw.trim() === "") return {};
    const parsed = JSON.parse(raw) as FormulaResponse;
    if (!parsed || typeof parsed !== "object") return {};

    const nestedValue = parsed.value;
    if (typeof nestedValue === "string" && nestedValue.trim().startsWith("{")) {
      return JSON.parse(nestedValue) as VarMap;
    }

    return parsed as VarMap;
  } catch {
    return {};
  }
};

export const extractFormulaVariables = (
  expression: string,
  constants: Record<string, number>,
) => {
  const regex = /:([A-Za-z0-9_]+)/g;
  const found = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(expression))) if (match[1]) found.add(match[1]);
  return Array.from(found).filter((key) => !(key in constants));
};

export const substituteFormulaValues = (
  expression: string,
  values: Record<string, unknown>,
  constants: Record<string, number>,
) =>
  expression.replace(/:([A-Za-z0-9_]+)/g, (_, key) => {
    if (key in constants) return String(Number(constants[key]));
    const raw = values[key];
    return raw !== "" && raw !== undefined ? String(Number(raw)) : `:${key}`;
  });
