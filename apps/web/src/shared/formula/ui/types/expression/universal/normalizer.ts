type FormulaLike = { expression?: unknown };

const parseJsonObject = (value: unknown): FormulaLike | null => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as FormulaLike;
  }
  if (typeof value !== "string") return null;

  let current: unknown = value.trim();
  for (let i = 0; i < 4; i += 1) {
    if (typeof current !== "string" || current.trim() === "") break;
    try {
      current = JSON.parse(current);
    } catch {
      return null;
    }
    if (current && typeof current === "object" && !Array.isArray(current)) {
      return current as FormulaLike;
    }
  }
  return null;
};

export const normalizeFormulaExpression = (expression: unknown): string => {
  if (typeof expression !== "string") return "";

  let current = expression;
  for (let i = 0; i < 4; i += 1) {
    const nested = parseJsonObject(current);
    if (!nested || typeof nested.expression !== "string") break;
    current = nested.expression;
  }

  return current;
};

export const normalizeExpressionPayload = <T extends FormulaLike>(
  payload: T,
): T => {
  if (!payload || typeof payload !== "object") return payload;

  const nested = parseJsonObject(payload.expression);
  if (!nested || typeof nested.expression !== "string") {
    return {
      ...payload,
      expression: normalizeFormulaExpression(payload.expression),
    } as T;
  }

  return {
    ...nested,
    ...payload,
    expression: normalizeFormulaExpression(nested.expression),
  } as T;
};
