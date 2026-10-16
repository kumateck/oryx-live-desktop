import type {
  FormulaIssue,
  FormulaLimits,
  FormulaVariableDefinition,
} from "./contracts";
import {
  FormulaDataType,
  FormulaIssueCode,
  FormulaScope,
  FormulaValueShape,
} from "./contracts";
import { isCanonicalDecimal } from "./decimal";
import {
  definitionError as error,
  isNumericEnumValue,
  validateFormulaKey,
} from "./definition-helpers";

export const validateFormulaVariables = (
  variables: FormulaVariableDefinition[],
  limits: FormulaLimits,
  issues: FormulaIssue[],
): Set<string> => {
  const keys = new Set<string>();
  variables.forEach((variable, index) => {
    const path = `variables[${index}]`;
    validateFormulaKey(
      variable.key,
      `${path}.key`,
      limits.maxKeyLength,
      issues,
    );
    if (keys.has(variable.key)) {
      issues.push(
        error(
          FormulaIssueCode.DuplicateKey,
          `${path}.key`,
          "Variable key is duplicated.",
          variable.key,
        ),
      );
    }
    keys.add(variable.key);
    if (!variable.label.trim()) {
      issues.push(
        error(
          FormulaIssueCode.InvalidDefinition,
          `${path}.label`,
          "Variable label is required.",
        ),
      );
    }
    if (!isNumericEnumValue(FormulaDataType, variable.dataType)) {
      issues.push(
        error(
          FormulaIssueCode.InvalidDefinition,
          `${path}.dataType`,
          "Unknown variable data type.",
        ),
      );
    }
    if (!isNumericEnumValue(FormulaValueShape, variable.valueShape)) {
      issues.push(
        error(
          FormulaIssueCode.InvalidDefinition,
          `${path}.valueShape`,
          "Unknown variable value shape.",
        ),
      );
    }
    if (!isNumericEnumValue(FormulaScope, variable.scope)) {
      issues.push(
        error(
          FormulaIssueCode.InvalidDefinition,
          `${path}.scope`,
          "Unknown variable scope.",
        ),
      );
    }
    for (const [name, value] of Object.entries(variable.validation ?? {})) {
      if (!isCanonicalDecimal(value)) {
        issues.push(
          error(
            FormulaIssueCode.InvalidDefinition,
            `${path}.validation.${name}`,
            "Validation bound must be a canonical decimal.",
          ),
        );
      }
    }
  });
  return keys;
};
