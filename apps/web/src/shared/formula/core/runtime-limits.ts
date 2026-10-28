import type { FormulaLimits } from "./contracts";
import type { FormulaEvaluationLimits } from "./evaluation-contracts";

export const FORMULA_V1_RUNTIME_LIMITS: Readonly<FormulaLimits> = {
  maxTokens: 1_000,
  maxAstNodes: 1_000,
  maxDepth: 100,
  maxVariableReferences: 500,
  maxVariables: 200,
  maxResults: 20,
  maxKeyLength: 120,
  maxExpressionLength: 10_000,
};

export const FORMULA_V1_EVALUATION_LIMITS: Readonly<FormulaEvaluationLimits> = {
  maxOperations: 2_000,
  maxTraceSteps: 200,
  maxInputDigits: 1_000,
  maxResultDigits: 10_000,
};
