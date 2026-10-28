type FormulaJson = Record<string, unknown>;

const variableTokenPattern = /:[A-Za-z0-9_.]+/g;
const numericLiteralPattern = /(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/g;
const identifierPattern = /[A-Za-z_][A-Za-z0-9_.]*/g;

const maskToken = (token: string) => " ".repeat(token.length);

const parseJsonObject = (value: string): FormulaJson | null => {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as FormulaJson)
      : null;
  } catch {
    return null;
  }
};

const collectExpressionString = (value: string, expressions: string[]) => {
  const parsed = parseJsonObject(value);
  if (parsed) {
    collectFormulaExpressions(parsed, expressions);
    return;
  }

  if (value.trim()) expressions.push(value);
};

const collectFormulaExpressions = (
  payload: FormulaJson,
  expressions: string[],
) => {
  for (const [key, value] of Object.entries(payload)) {
    if (key === "expression" && typeof value === "string") {
      collectExpressionString(value, expressions);
      continue;
    }

    if (key === "manualVarExpressions" && value && typeof value === "object") {
      for (const manualExpression of Object.values(value)) {
        if (typeof manualExpression === "string") {
          collectExpressionString(manualExpression, expressions);
        }
      }
      continue;
    }

    if (key === "columnExpressions" && value && typeof value === "object") {
      for (const columnExpression of Object.values(value)) {
        if (columnExpression && typeof columnExpression === "object") {
          collectFormulaExpressions(
            columnExpression as FormulaJson,
            expressions,
          );
        }
      }
    }
  }
};

export const findBareVariableNames = (expression: string): string[] => {
  const maskedExpression = expression
    .replace(variableTokenPattern, maskToken)
    .replace(numericLiteralPattern, maskToken);
  const bareNames = new Set<string>();

  for (const match of maskedExpression.matchAll(identifierPattern)) {
    const name = match[0];
    const end = (match.index ?? 0) + name.length;
    const isFunctionCall = /^\s*\(/.test(maskedExpression.slice(end));
    if (!isFunctionCall) bareNames.add(name);
  }

  return [...bareNames];
};

export const findBareFormulaVariableNames = (
  formulaValue: string,
): string[] => {
  const expressions: string[] = [];
  const parsed = parseJsonObject(formulaValue);

  if (parsed) collectFormulaExpressions(parsed, expressions);
  else if (formulaValue.trim()) expressions.push(formulaValue);

  const bareNames = new Set<string>();
  for (const expression of expressions) {
    for (const name of findBareVariableNames(expression)) bareNames.add(name);
  }
  return [...bareNames];
};

export const getFormulaVariableSyntaxError = (
  formulaValue: string,
): string | null => {
  const bareNames = findBareFormulaVariableNames(formulaValue);
  if (bareNames.length === 0) return null;

  const corrections = bareNames.map((name) => `${name} to :${name}`).join(", ");
  return `Variables must start with ":". Change ${corrections}.`;
};
