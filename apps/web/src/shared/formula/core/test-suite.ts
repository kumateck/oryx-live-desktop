import type { CompiledFormulaDefinitionV1 } from "./definition";
import { sha256CanonicalJson } from "./canonical-json";
import { evaluateCompiledFormulaV1 } from "./evaluate";
import {
  FormulaEvaluationStatus,
  type FormulaEvaluation,
  type FormulaEvaluationLimits,
} from "./evaluation-contracts";
import {
  FORMULA_TEST_CASES_V1,
  FormulaTestCategory,
  type FormulaTestCaseV1,
  type FormulaTestOutcomeV1,
  type FormulaTestSuiteResultV1,
} from "./test-contracts";

const WORKSHEET_TEST_HASH_DOMAIN =
  "oryx:formula-worksheet-preprocessor-tests:v1";

export const hashWorksheetPreprocessorTestCasesV1 = (
  cases: readonly FormulaTestCaseV1[],
): Promise<string> => sha256CanonicalJson(WORKSHEET_TEST_HASH_DOMAIN, cases);

const resultsOf = (evaluation: FormulaEvaluation): Record<string, string> =>
  Object.fromEntries(
    evaluation.results.map((result) => [result.key, result.roundedResult]),
  );

const inputsFor = (
  definition: CompiledFormulaDefinitionV1,
  values: readonly string[],
): Record<string, string> =>
  Object.fromEntries(
    definition.variables.map((variable, index) => [
      variable.key,
      values[index % values.length]!,
    ]),
  );

const fixture = (
  id: string,
  name: string,
  category: FormulaTestCategory,
  resolvedInputs: Record<string, string | null>,
  evaluation: FormulaEvaluation,
  expectedStatus = FormulaEvaluationStatus.Valid,
): FormulaTestCaseV1 => ({
  schemaVersion: FORMULA_TEST_CASES_V1,
  id,
  name,
  category,
  resolvedInputs,
  expectedStatus,
  expectedResults:
    expectedStatus === FormulaEvaluationStatus.Valid
      ? resultsOf(evaluation)
      : {},
});

export const buildDefaultFormulaTestCasesV1 = (
  definition: CompiledFormulaDefinitionV1,
  limits: FormulaEvaluationLimits,
): FormulaTestCaseV1[] => {
  const evaluate = (inputs: Record<string, string | null>) =>
    evaluateCompiledFormulaV1(definition, inputs, limits);
  const nominal = inputsFor(definition, ["2", "3", "5", "7", "11"]);
  const inputDigits = definition.precisionPolicy?.inputDecimalPlaces ?? 4;
  const increment =
    inputDigits === 0 ? "1" : `0.${"0".repeat(inputDigits - 1)}1`;
  const boundary = inputsFor(definition, [increment, "1", "2", "3"]);
  const rounding = inputsFor(definition, ["1", "3", "7", "11"]);
  const firstKey = definition.variables.find(
    (variable) => variable.required,
  )?.key;
  if (!firstKey) {
    throw new Error(
      "Automatic smoke checks require at least one required input; provide explicit test cases for this definition.",
    );
  }
  const missing = { ...nominal, [firstKey]: null };
  const invalid = { ...nominal, [firstKey]: "not-a-number" };
  const cases = [
    fixture(
      "nominal",
      "Nominal calculation",
      FormulaTestCategory.Nominal,
      nominal,
      evaluate(nominal),
    ),
    fixture(
      "boundary",
      "Small positive boundary",
      FormulaTestCategory.Boundary,
      boundary,
      evaluate(boundary),
    ),
    fixture(
      "missing-input",
      "Required input omitted",
      FormulaTestCategory.MissingInput,
      missing,
      evaluate(missing),
      FormulaEvaluationStatus.MissingInput,
    ),
    fixture(
      "invalid-input",
      "Non-numeric input rejected",
      FormulaTestCategory.InvalidInput,
      invalid,
      evaluate(invalid),
      FormulaEvaluationStatus.InvalidInput,
    ),
    fixture(
      "rounding",
      "Governed decimal rounding",
      FormulaTestCategory.Rounding,
      rounding,
      evaluate(rounding),
    ),
  ];
  const divideByZero = definition.variables
    .map((variable) => ({ ...nominal, [variable.key]: "0" }))
    .map((inputs) => ({ inputs, evaluation: evaluate(inputs) }))
    .find(
      ({ evaluation }) =>
        evaluation.status === FormulaEvaluationStatus.DivideByZero,
    );
  if (divideByZero) {
    cases.push(
      fixture(
        "divide-by-zero",
        "Zero denominator rejected",
        FormulaTestCategory.DivideByZero,
        divideByZero.inputs,
        divideByZero.evaluation,
        FormulaEvaluationStatus.DivideByZero,
      ),
    );
  }
  return cases;
};

export const runFormulaTestCasesV1 = (
  definition: CompiledFormulaDefinitionV1,
  cases: readonly FormulaTestCaseV1[],
  limits: FormulaEvaluationLimits,
): FormulaTestSuiteResultV1 => {
  const outcomes: FormulaTestOutcomeV1[] = cases.map((testCase) => {
    const evaluation = evaluateCompiledFormulaV1(
      definition,
      testCase.resolvedInputs,
      limits,
    );
    const actualResults = resultsOf(evaluation);
    const expectedEntries = Object.entries(testCase.expectedResults);
    const requiredStatus =
      testCase.category === FormulaTestCategory.Nominal ||
      testCase.category === FormulaTestCategory.Rounding
        ? FormulaEvaluationStatus.Valid
        : testCase.category === FormulaTestCategory.MissingInput
          ? FormulaEvaluationStatus.MissingInput
          : testCase.category === FormulaTestCategory.InvalidInput
            ? FormulaEvaluationStatus.InvalidInput
            : testCase.category === FormulaTestCategory.DivideByZero
              ? FormulaEvaluationStatus.DivideByZero
              : undefined;
    const categoryMatches =
      requiredStatus === undefined ||
      testCase.expectedStatus === requiredStatus;
    const resultsMatch =
      testCase.expectedStatus !== FormulaEvaluationStatus.Valid ||
      (expectedEntries.length === definition.results.length &&
        expectedEntries.every(([key, value]) => actualResults[key] === value));
    return {
      id: testCase.id,
      name: testCase.name,
      category: testCase.category,
      resolvedInputs: testCase.resolvedInputs,
      passed:
        categoryMatches &&
        evaluation.status === testCase.expectedStatus &&
        resultsMatch,
      expectedStatus: testCase.expectedStatus,
      actualStatus: evaluation.status,
      expectedResults: testCase.expectedResults,
      actualResults,
      errors: evaluation.errors,
    };
  });
  const passedCount = outcomes.filter((outcome) => outcome.passed).length;
  return {
    passed: outcomes.length > 0 && passedCount === outcomes.length,
    total: outcomes.length,
    passedCount,
    outcomes,
  };
};
