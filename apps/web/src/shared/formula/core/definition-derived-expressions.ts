import type {
  FormulaDerivedExpressionDefinition,
  FormulaIssue,
  FormulaLimits,
} from "./contracts";
import { FormulaIssueCode } from "./contracts";
import type { CompiledFormulaDerivedExpressionV1 } from "./compiled-definition";
import {
  definitionError as error,
  validateFormulaKey,
} from "./definition-helpers";
import { parseExpressionV1 } from "./expression";

const compareAscii = (left: string, right: string) =>
  left < right ? -1 : left > right ? 1 : 0;

export const compileDerivedExpressions = (
  source: FormulaDerivedExpressionDefinition[],
  variableKeys: Set<string>,
  limits: FormulaLimits,
  issues: FormulaIssue[],
): CompiledFormulaDerivedExpressionV1[] => {
  if (source.length + variableKeys.size > limits.maxVariables) {
    issues.push(
      error(
        FormulaIssueCode.ResourceLimit,
        "derivedExpressions",
        "Combined variable and derived-expression limit exceeded.",
      ),
    );
  }
  const keys = new Set(source.map((item) => item.key));
  const compiled = new Map<string, CompiledFormulaDerivedExpressionV1>();
  source.forEach((item, index) => {
    const path = `derivedExpressions[${index}]`;
    validateFormulaKey(item.key, `${path}.key`, limits.maxKeyLength, issues);
    if (
      variableKeys.has(item.key) ||
      source.findIndex((candidate) => candidate.key === item.key) !== index
    ) {
      issues.push(
        error(
          FormulaIssueCode.DuplicateKey,
          `${path}.key`,
          "Derived-expression key collides with another key.",
          item.key,
        ),
      );
    }
    if (!item.label.trim()) {
      issues.push(
        error(
          FormulaIssueCode.InvalidDefinition,
          `${path}.label`,
          "Derived-expression label is required.",
        ),
      );
    }
    if (item.expression.length > limits.maxExpressionLength) {
      issues.push(
        error(
          FormulaIssueCode.ResourceLimit,
          `${path}.expression`,
          "Expression length limit exceeded.",
        ),
      );
    }
    const parsed = parseExpressionV1(item.expression, limits);
    if (!parsed.ok) {
      issues.push(
        ...parsed.issues.map((issue) => ({
          ...issue,
          path: `${path}.${issue.path}`,
        })),
      );
      return;
    }
    for (const key of parsed.variables) {
      if (!variableKeys.has(key) && !keys.has(key)) {
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
    compiled.set(item.key, {
      key: item.key,
      label: item.label,
      expression: parsed.ast,
      dependencies: parsed.variables,
      unit: item.unit,
    });
  });

  const ordered: CompiledFormulaDerivedExpressionV1[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (key: string): boolean => {
    if (visited.has(key)) return true;
    if (visiting.has(key)) return false;
    visiting.add(key);
    const item = compiled.get(key);
    if (item) {
      for (const dependency of item.dependencies
        .filter((candidate) => compiled.has(candidate))
        .sort(compareAscii)) {
        if (!visit(dependency)) return false;
      }
      ordered.push(item);
    }
    visiting.delete(key);
    visited.add(key);
    return true;
  };
  for (const key of [...compiled.keys()].sort(compareAscii)) {
    if (!visit(key)) {
      issues.push(
        error(
          FormulaIssueCode.CyclicDependency,
          "derivedExpressions",
          "Derived expressions contain a circular dependency.",
          key,
        ),
      );
      return [];
    }
  }
  return ordered;
};
