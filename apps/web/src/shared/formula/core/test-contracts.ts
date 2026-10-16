import type {
  FormulaEvaluationError,
  FormulaEvaluationStatus,
} from "./evaluation-contracts";

export const FORMULA_TEST_CASES_V1 = "oryx-formula-test-cases-v1" as const;

export enum FormulaTestCategory {
  Nominal = 0,
  Boundary = 1,
  MissingInput = 2,
  InvalidInput = 3,
  DivideByZero = 4,
  Rounding = 5,
  Statistical = 6,
}

export const formulaTestCategoryNames: Record<FormulaTestCategory, string> = {
  [FormulaTestCategory.Nominal]: "Nominal",
  [FormulaTestCategory.Boundary]: "Boundary",
  [FormulaTestCategory.MissingInput]: "Missing input",
  [FormulaTestCategory.InvalidInput]: "Invalid input",
  [FormulaTestCategory.DivideByZero]: "Divide by zero",
  [FormulaTestCategory.Rounding]: "Rounding",
  [FormulaTestCategory.Statistical]: "Statistical",
};

export interface FormulaTestCaseV1 {
  schemaVersion: typeof FORMULA_TEST_CASES_V1;
  id: string;
  name: string;
  category: FormulaTestCategory;
  resolvedInputs: Record<string, string | null>;
  expectedStatus: FormulaEvaluationStatus;
  expectedResults: Record<string, string>;
}

export interface FormulaTestOutcomeV1 {
  id: string;
  name: string;
  category: FormulaTestCategory;
  resolvedInputs: Record<string, string | null>;
  passed: boolean;
  expectedStatus: FormulaEvaluationStatus;
  actualStatus: FormulaEvaluationStatus;
  expectedResults: Record<string, string>;
  actualResults: Record<string, string>;
  errors: FormulaEvaluationError[];
}

export interface FormulaTestSuiteResultV1 {
  passed: boolean;
  total: number;
  passedCount: number;
  outcomes: FormulaTestOutcomeV1[];
}
