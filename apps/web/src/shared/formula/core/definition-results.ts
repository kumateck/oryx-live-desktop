import type {
  FormulaIssue,
  FormulaLimits,
  FormulaResultDefinition,
} from "./contracts";
import {
  FormulaIssueCode,
  FormulaNumericScale,
  FormulaRoundingKind,
} from "./contracts";
import type { CompiledFormulaResultV1 } from "./compiled-definition";
import {
  definitionError as error,
  isNumericEnumValue,
  validateFormulaKey,
} from "./definition-helpers";
import { parseExpressionV1 } from "./expression";

export const compileFormulaResults = (
  results: FormulaResultDefinition[],
  variableKeys: Set<string>,
  limits: FormulaLimits,
  issues: FormulaIssue[],
): CompiledFormulaResultV1[] => {
  const resultKeys = new Set<string>();
  const compiled: CompiledFormulaResultV1[] = [];
  results.forEach((result, index) => {
    const path = `results[${index}]`;
    validateFormulaKey(result.key, `${path}.key`, limits.maxKeyLength, issues);
    if (resultKeys.has(result.key) || variableKeys.has(result.key)) {
      issues.push(
        error(
          FormulaIssueCode.DuplicateKey,
          `${path}.key`,
          "Result key collides with another key.",
        ),
      );
    }
    resultKeys.add(result.key);
    if (!result.label.trim()) {
      issues.push(
        error(
          FormulaIssueCode.InvalidDefinition,
          `${path}.label`,
          "Result label is required.",
        ),
      );
    }
    if (result.expression.length > limits.maxExpressionLength) {
      issues.push(
        error(
          FormulaIssueCode.ResourceLimit,
          `${path}.expression`,
          "Expression length limit exceeded.",
        ),
      );
    }
    if (!isNumericEnumValue(FormulaNumericScale, result.numericScale)) {
      issues.push(
        error(
          FormulaIssueCode.InvalidDefinition,
          `${path}.numericScale`,
          "Unknown numeric scale.",
        ),
      );
    }
    if (
      !Number.isInteger(result.rounding.digits) ||
      result.rounding.digits < 0
    ) {
      issues.push(
        error(
          FormulaIssueCode.InvalidDefinition,
          `${path}.rounding.digits`,
          "Rounding digits must be a non-negative integer.",
        ),
      );
    }
    if (!isNumericEnumValue(FormulaRoundingKind, result.rounding.kind)) {
      issues.push(
        error(
          FormulaIssueCode.InvalidDefinition,
          `${path}.rounding.kind`,
          "Unknown rounding kind.",
        ),
      );
    }

    const parsed = parseExpressionV1(result.expression, limits);
    if (!parsed.ok) {
      issues.push(
        ...parsed.issues.map((item) => ({
          ...item,
          path: `${path}.${item.path}`,
        })),
      );
      return;
    }
    for (const key of parsed.variables) {
      if (!variableKeys.has(key)) {
        issues.push(
          error(
            FormulaIssueCode.UnknownVariable,
            `${path}.expression`,
            `Variable "${key}" is not declared.`,
            key,
          ),
        );
      }
    }
    compiled.push({
      key: result.key,
      label: result.label,
      expression: parsed.ast,
      dependencies: parsed.variables,
      unit: result.unit,
      numericScale: result.numericScale,
      rounding: result.rounding,
    });
  });
  return compiled;
};
