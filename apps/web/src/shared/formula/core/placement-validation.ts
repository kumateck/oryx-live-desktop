import type {
  PlacementValidationOptions,
  ResolvedFormulaPlacement,
} from "./binding-contracts";
import { type FormulaIssue, FormulaIssueCode } from "./contracts";
import { definitionError as error } from "./definition-helpers";
import { validateFormulaDependencyGraph } from "./dependency-graph";
import {
  validatePlacementBinding,
  validatePlacementTarget,
} from "./placement-contract-validation";

const PLACEMENT_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

const duplicateKeys = <T>(
  items: T[],
  keyOf: (item: T) => string,
  path: string,
  issues: FormulaIssue[],
): Set<string> => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  items.forEach((item, index) => {
    const key = keyOf(item);
    if (seen.has(key)) {
      duplicates.add(key);
      issues.push(
        error(
          FormulaIssueCode.DuplicateKey,
          `${path}[${index}]`,
          `Key "${key}" is duplicated.`,
        ),
      );
    }
    seen.add(key);
  });
  return duplicates;
};

const validatePlacement = (
  placement: ResolvedFormulaPlacement,
  options: PlacementValidationOptions,
  issues: FormulaIssue[],
): void => {
  const path = `placements[${placement.placementKey}]`;
  if (
    placement.placementKey.length > options.maxPlacementKeyLength ||
    !PLACEMENT_KEY_PATTERN.test(placement.placementKey)
  ) {
    issues.push(
      error(
        FormulaIssueCode.InvalidDefinition,
        `${path}.placementKey`,
        "Placement key is invalid.",
      ),
    );
  }
  if (!SHA256_PATTERN.test(placement.definitionHash)) {
    issues.push(
      error(
        FormulaIssueCode.InvalidDefinition,
        `${path}.definitionHash`,
        "Definition hash must be lowercase SHA-256.",
      ),
    );
  }
  if (
    options.requireMethodReference(placement.placementKey) &&
    !placement.methodReference?.trim()
  ) {
    issues.push(
      error(
        FormulaIssueCode.MethodReferenceRequired,
        `${path}.methodReference`,
        "An approved method reference is required.",
      ),
    );
  }
  if (placement.bindings.length > options.maxBindingsPerPlacement) {
    issues.push(
      error(
        FormulaIssueCode.ResourceLimit,
        `${path}.bindings`,
        "Binding limit exceeded.",
      ),
    );
  }
  if (placement.resultTargets.length > options.maxTargetsPerPlacement) {
    issues.push(
      error(
        FormulaIssueCode.ResourceLimit,
        `${path}.resultTargets`,
        "Result-target limit exceeded.",
      ),
    );
  }
  duplicateKeys(
    placement.bindings,
    (item) => item.variableKey,
    `${path}.bindings`,
    issues,
  );
  duplicateKeys(
    placement.resultTargets,
    (item) => item.resultKey,
    `${path}.resultTargets`,
    issues,
  );
  const bound = new Set(placement.bindings.map((item) => item.variableKey));
  const targeted = new Set(
    placement.resultTargets.map((item) => item.resultKey),
  );
  placement.definition.variables.forEach((variable) => {
    if (!bound.has(variable.key))
      issues.push(
        error(
          FormulaIssueCode.MissingBinding,
          `${path}.bindings`,
          `Variable "${variable.key}" is not bound.`,
        ),
      );
  });
  placement.definition.results.forEach((result) => {
    if (!targeted.has(result.key))
      issues.push(
        error(
          FormulaIssueCode.MissingTarget,
          `${path}.resultTargets`,
          `Result "${result.key}" has no target.`,
        ),
      );
  });
  placement.bindings.forEach((binding, index) =>
    validatePlacementBinding(binding, placement, index, issues),
  );
  placement.resultTargets.forEach((target, index) =>
    validatePlacementTarget(target, placement, index, issues),
  );
};

export const validateResolvedFormulaPlacements = (
  placements: ResolvedFormulaPlacement[],
  options: PlacementValidationOptions,
): FormulaIssue[] => {
  const issues: FormulaIssue[] = [];
  if (placements.length > options.maxPlacements) {
    issues.push(
      error(
        FormulaIssueCode.ResourceLimit,
        "placements",
        "Formula placement limit exceeded.",
      ),
    );
  }
  duplicateKeys(placements, (item) => item.placementKey, "placements", issues);
  placements.forEach((placement) =>
    validatePlacement(placement, options, issues),
  );
  issues.push(...validateFormulaDependencyGraph(placements, options));
  return issues;
};
