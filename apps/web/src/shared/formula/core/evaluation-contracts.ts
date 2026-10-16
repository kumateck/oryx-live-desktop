export const FORMULA_EVALUATOR_VERSION = "oryx-formula-evaluator-v1" as const;

export enum FormulaEvaluationStatus {
  Valid = 0,
  MissingInput = 1,
  InvalidInput = 2,
  DivideByZero = 3,
  InvalidDefinition = 4,
  ResourceLimit = 5,
  UnsupportedPolicy = 6,
  OutOfRange = 7,
}

export const formulaEvaluationStatusNames: Record<
  FormulaEvaluationStatus,
  string
> = {
  [FormulaEvaluationStatus.Valid]: "VALID",
  [FormulaEvaluationStatus.MissingInput]: "MISSING_INPUT",
  [FormulaEvaluationStatus.InvalidInput]: "INVALID_INPUT",
  [FormulaEvaluationStatus.DivideByZero]: "DIVIDE_BY_ZERO",
  [FormulaEvaluationStatus.InvalidDefinition]: "INVALID_DEFINITION",
  [FormulaEvaluationStatus.ResourceLimit]: "RESOURCE_LIMIT",
  [FormulaEvaluationStatus.UnsupportedPolicy]: "UNSUPPORTED_POLICY",
  [FormulaEvaluationStatus.OutOfRange]: "OUT_OF_RANGE",
};

export interface FormulaEvaluationLimits {
  maxOperations: number;
  maxTraceSteps: number;
  maxInputDigits: number;
  maxResultDigits: number;
}

export interface FormulaEvaluationError {
  status: FormulaEvaluationStatus;
  path: string;
  message: string;
  variableKey?: string | undefined;
}

export interface FormulaCalculationTraceStep {
  sequence: number;
  operation: string;
  operands: string[];
  result: string;
}

export interface FormulaEvaluationResult {
  key: string;
  exactResult: string;
  roundedResult: string;
  displayedResult: string;
  unit: string | null;
}

export interface FormulaEvaluation {
  evaluatorVersion: typeof FORMULA_EVALUATOR_VERSION;
  status: FormulaEvaluationStatus;
  results: FormulaEvaluationResult[];
  errors: FormulaEvaluationError[];
  trace: FormulaCalculationTraceStep[];
  traceTruncated: boolean;
  operationCount: number;
}
