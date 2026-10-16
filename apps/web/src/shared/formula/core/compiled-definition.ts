import {
  FORMULA_LANGUAGE_V1,
  type FormulaDefinitionV1,
  type FormulaVariableDefinition,
} from "./contracts";
import { normalizeCanonicalDecimal } from "./decimal";
import type { ExpressionNode } from "./expression-model";

const compareAscii = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

export interface CompiledFormulaResultV1 {
  key: string;
  label: string;
  expression: ExpressionNode;
  dependencies: string[];
  unit: string | null;
  numericScale: number;
  rounding: { kind: number; digits: number };
}

export interface CompiledFormulaDerivedExpressionV1 {
  key: string;
  label: string;
  expression: ExpressionNode;
  dependencies: string[];
  unit: string | null;
}

export interface CompiledFormulaDefinitionV1 {
  formulaLanguageVersion: typeof FORMULA_LANGUAGE_V1;
  numericPolicyVersion: string;
  precisionPolicy?: FormulaDefinitionV1["precisionPolicy"];
  worksheetPolicy?: FormulaDefinitionV1["worksheetPolicy"];
  variables: FormulaDefinitionV1["variables"];
  derivedExpressions?: CompiledFormulaDerivedExpressionV1[];
  results: CompiledFormulaResultV1[];
}

export interface ExecutableFormulaDefinitionV1 {
  formulaLanguageVersion: typeof FORMULA_LANGUAGE_V1;
  numericPolicyVersion: string;
  precisionPolicy?: FormulaDefinitionV1["precisionPolicy"];
  worksheetPolicy?: FormulaDefinitionV1["worksheetPolicy"];
  variables: Array<Omit<FormulaVariableDefinition, "label">>;
  derivedExpressions?: Array<
    Omit<CompiledFormulaDerivedExpressionV1, "label" | "dependencies">
  >;
  results: Array<Omit<CompiledFormulaResultV1, "label" | "dependencies">>;
}

export const normalizeVariableDefinition = (
  variable: FormulaVariableDefinition,
): FormulaVariableDefinition => {
  const { validation, ...required } = variable;
  if (!validation) return required;
  const normalized = Object.fromEntries(
    Object.entries(validation).map(([key, value]) => [
      key,
      normalizeCanonicalDecimal(value) ?? value,
    ]),
  );
  return { ...required, validation: normalized };
};

export const toExecutableFormulaDefinitionV1 = (
  definition: CompiledFormulaDefinitionV1,
): ExecutableFormulaDefinitionV1 => ({
  formulaLanguageVersion: definition.formulaLanguageVersion,
  numericPolicyVersion: definition.numericPolicyVersion,
  ...(definition.precisionPolicy
    ? { precisionPolicy: definition.precisionPolicy }
    : {}),
  ...(definition.worksheetPolicy
    ? { worksheetPolicy: definition.worksheetPolicy }
    : {}),
  variables: definition.variables
    .map(({ label: _label, ...variable }) => variable)
    .sort((left, right) => compareAscii(left.key, right.key)),
  ...((definition.derivedExpressions?.length ?? 0) > 0
    ? {
        derivedExpressions: definition.derivedExpressions!.map(
          ({ label: _label, dependencies: _dependencies, ...expression }) =>
            expression,
        ),
      }
    : {}),
  results: definition.results
    .map(({ label: _label, dependencies: _dependencies, ...result }) => result)
    .sort((left, right) => compareAscii(left.key, right.key)),
});
