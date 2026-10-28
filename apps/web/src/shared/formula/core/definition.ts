import { canonicalJson, sha256CanonicalJson } from "./canonical-json";
import type {
  FormulaDefinitionV1,
  FormulaIssue,
  FormulaLimits,
} from "./contracts";
import { FORMULA_LANGUAGE_V1, FormulaIssueCode } from "./contracts";
import type { CompiledFormulaDefinitionV1 } from "./compiled-definition";
import {
  normalizeVariableDefinition,
  toExecutableFormulaDefinitionV1,
} from "./compiled-definition";
import { definitionError as error } from "./definition-helpers";
import { compileFormulaResults } from "./definition-results";
import { compileDerivedExpressions } from "./definition-derived-expressions";
import { validateFormulaVariables } from "./definition-variables";

const POLICY_VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

export type {
  CompiledFormulaDefinitionV1,
  CompiledFormulaResultV1,
} from "./compiled-definition";

export type CompileDefinitionResult =
  | { ok: true; definition: CompiledFormulaDefinitionV1; canonical: string }
  | { ok: false; issues: FormulaIssue[] };

export const compileFormulaDefinitionV1 = (
  source: FormulaDefinitionV1,
  limits: FormulaLimits,
): CompileDefinitionResult => {
  const issues: FormulaIssue[] = [];
  if (source.formulaLanguageVersion !== FORMULA_LANGUAGE_V1) {
    issues.push(
      error(
        FormulaIssueCode.InvalidDefinition,
        "formulaLanguageVersion",
        "Unsupported formula language version.",
      ),
    );
  }
  if (!POLICY_VERSION_PATTERN.test(source.numericPolicyVersion)) {
    issues.push(
      error(
        FormulaIssueCode.InvalidDefinition,
        "numericPolicyVersion",
        "Numeric policy version has an invalid format.",
      ),
    );
  }
  for (const [key, value] of Object.entries(source.precisionPolicy ?? {})) {
    if (!Number.isInteger(value) || value < 0 || value > 12) {
      issues.push(
        error(
          FormulaIssueCode.InvalidDefinition,
          `precisionPolicy.${key}`,
          "Decimal places must be a whole number from 0 to 12.",
        ),
      );
    }
  }
  if (source.variables.length === 0) {
    issues.push(
      error(
        FormulaIssueCode.InvalidDefinition,
        "variables",
        "At least one variable is required.",
      ),
    );
  } else if (source.variables.length > limits.maxVariables) {
    issues.push(
      error(
        FormulaIssueCode.ResourceLimit,
        "variables",
        "Variable limit exceeded.",
      ),
    );
  }
  if (source.results.length === 0) {
    issues.push(
      error(
        FormulaIssueCode.InvalidDefinition,
        "results",
        "At least one result is required.",
      ),
    );
  } else if (source.results.length > limits.maxResults) {
    issues.push(
      error(
        FormulaIssueCode.ResourceLimit,
        "results",
        "Result limit exceeded.",
      ),
    );
  }

  const variableKeys = validateFormulaVariables(
    source.variables,
    limits,
    issues,
  );
  const derivedExpressions = compileDerivedExpressions(
    source.derivedExpressions ?? [],
    variableKeys,
    limits,
    issues,
  );
  const expressionKeys = new Set([
    ...variableKeys,
    ...derivedExpressions.map((item) => item.key),
  ]);
  const results = compileFormulaResults(
    source.results,
    expressionKeys,
    limits,
    issues,
  );
  if (issues.length > 0) return { ok: false, issues };

  const definition: CompiledFormulaDefinitionV1 = {
    formulaLanguageVersion: FORMULA_LANGUAGE_V1,
    numericPolicyVersion: source.numericPolicyVersion,
    ...(source.precisionPolicy
      ? { precisionPolicy: source.precisionPolicy }
      : {}),
    ...(source.worksheetPolicy
      ? { worksheetPolicy: source.worksheetPolicy }
      : {}),
    variables: source.variables.map(normalizeVariableDefinition),
    derivedExpressions,
    results,
  };
  const executable = toExecutableFormulaDefinitionV1(definition);
  return { ok: true, definition, canonical: canonicalJson(executable) };
};

export const hashCompiledFormulaDefinitionV1 = (
  definition: CompiledFormulaDefinitionV1,
): Promise<string> =>
  sha256CanonicalJson(
    "oryx:formula-definition:v1",
    toExecutableFormulaDefinitionV1(definition),
  );
