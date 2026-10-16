import type {
  ResolvedFormulaPlacement,
  ResolvedFormulaResultTarget,
  ResolvedFormulaVariableBinding,
} from "./binding-contracts";
import { FormulaSourceType } from "./binding-contracts";
import {
  FormulaDataType,
  type FormulaIssue,
  FormulaIssueCode,
  FormulaValueShape,
} from "./contracts";
import { definitionError as error } from "./definition-helpers";
import { validateResolvedSourceContract } from "./source-contract";
import {
  formulaResultReferenceParts,
  isValidSourceReference,
} from "./source-reference";

export const validatePlacementBinding = (
  binding: ResolvedFormulaVariableBinding,
  placement: ResolvedFormulaPlacement,
  index: number,
  issues: FormulaIssue[],
): void => {
  const path = `placements[${placement.placementKey}].bindings[${index}]`;
  const variable = placement.definition.variables.find(
    (item) => item.key === binding.variableKey,
  );
  if (!variable) {
    issues.push(
      error(
        FormulaIssueCode.UnexpectedBinding,
        `${path}.variableKey`,
        `Variable "${binding.variableKey}" is not declared by the formula.`,
      ),
    );
    return;
  }
  if (
    !isValidSourceReference(binding.source.sourceType, binding.source.reference)
  ) {
    issues.push(
      error(
        FormulaIssueCode.InvalidDefinition,
        `${path}.source.reference`,
        "Source reference is missing or malformed for its source type.",
      ),
    );
  }
  validateResolvedSourceContract(binding.source, `${path}.source`, issues);
  if (binding.source.sourceType === FormulaSourceType.FormulaResult) {
    const referenced = formulaResultReferenceParts(binding.source.reference);
    const dependency = binding.source.dependencies?.[0];
    if (
      referenced &&
      dependency &&
      (referenced.placementKey !== dependency.placementKey ||
        referenced.resultKey !== dependency.resultKey)
    ) {
      issues.push(
        error(
          FormulaIssueCode.InvalidDefinition,
          `${path}.source.reference`,
          "Formula-result reference does not match its declared dependency.",
        ),
      );
    }
  }
  const checks = [
    ["dataType", FormulaIssueCode.TypeMismatch],
    ["valueShape", FormulaIssueCode.ShapeMismatch],
    ["scope", FormulaIssueCode.ScopeMismatch],
    ["unit", FormulaIssueCode.UnitMismatch],
  ] as const;
  for (const [field, code] of checks) {
    if (binding.source[field] !== variable[field]) {
      issues.push(
        error(
          code,
          `${path}.source.${field}`,
          `Source ${field} does not match variable contract.`,
        ),
      );
    }
  }
};

export const validatePlacementTarget = (
  target: ResolvedFormulaResultTarget,
  placement: ResolvedFormulaPlacement,
  index: number,
  issues: FormulaIssue[],
): void => {
  const path = `placements[${placement.placementKey}].resultTargets[${index}]`;
  const result = placement.definition.results.find(
    (item) => item.key === target.resultKey,
  );
  if (!result) {
    issues.push(
      error(
        FormulaIssueCode.UnknownResult,
        `${path}.resultKey`,
        `Result "${target.resultKey}" is not declared.`,
      ),
    );
    return;
  }
  if (!target.targetKey.trim()) {
    issues.push(
      error(
        FormulaIssueCode.InvalidDefinition,
        `${path}.targetKey`,
        "Target key is required.",
      ),
    );
  }
  if (target.dataType !== FormulaDataType.Decimal) {
    issues.push(
      error(
        FormulaIssueCode.TypeMismatch,
        `${path}.dataType`,
        "Result target must accept decimals.",
      ),
    );
  }
  if (target.valueShape !== FormulaValueShape.Scalar) {
    issues.push(
      error(
        FormulaIssueCode.ShapeMismatch,
        `${path}.valueShape`,
        "Result target must be scalar.",
      ),
    );
  }
  if (target.unit !== result.unit) {
    issues.push(
      error(
        FormulaIssueCode.UnitMismatch,
        `${path}.unit`,
        "Target unit does not match result unit.",
      ),
    );
  }
};
