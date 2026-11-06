import {
  type CompiledFormulaDefinitionV1,
  type FormulaEvaluationLimits,
  type FormulaTestCaseV1,
  type FormulaTestOutcomeV1,
  runFormulaTestCasesV1,
} from "../../../apps/web/src/shared/formula/core";

export const executeAuthoritativeFormulaTests = (
  definition: CompiledFormulaDefinitionV1,
  cases: readonly FormulaTestCaseV1[],
  limits: FormulaEvaluationLimits,
): FormulaTestOutcomeV1[] =>
  runFormulaTestCasesV1(definition, cases, limits).outcomes;
