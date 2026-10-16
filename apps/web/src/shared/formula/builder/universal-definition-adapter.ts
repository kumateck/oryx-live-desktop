import {
  FORMULA_LANGUAGE_V1,
  FormulaDataType,
  FormulaNumericScale,
  FormulaRoundingKind,
  FormulaValueShape,
  type FormulaDefinitionV1,
  type FormulaResultDefinition,
} from "../core/contracts";
import { parseExpressionV1 } from "../core/expression";
import { FORMULA_V1_RUNTIME_LIMITS } from "../core/runtime-limits";
import { expandUniversalSampleExpression } from "./universal-sample-tokens";
import { buildWorksheetPreprocessor } from "./universal-worksheet-adapter";
import { variableScopeFor } from "./variable-scope";
import {
  expandNamedExpressionReferences,
  materializeUniversalNamedExpressions,
  parseUniversalNamedExpressions,
} from "./universal-named-expressions";
import {
  ALPHANUMERIC_VARIABLE_KEY,
  assertCanonicalUniversalConfigKeys,
  canonicalVariableLabel,
  canonicalizeUniversalInputTokens,
  UniversalVariableKeyFormat,
  variableKeyFormatFor,
} from "./universal-variable-keys";
import {
  inlineUniversalConstants,
  parseUniversalConfig,
  universalDecimalPlaces,
  universalNumberInRange,
} from "./universal-config-values";

const FORMULA_NUMERIC_POLICY_V1 = "oryx-decimal-v1-half-up";

const makeResult = (
  key: string,
  label: string,
  expression: string,
  digits: number,
  percentage: boolean,
): FormulaResultDefinition => ({
  key,
  label,
  expression,
  unit: percentage ? "%" : null,
  numericScale: percentage
    ? FormulaNumericScale.PercentagePoints
    : FormulaNumericScale.Absolute,
  rounding: { kind: FormulaRoundingKind.DecimalPlaces, digits },
});

export const buildUniversalDefinition = async (
  raw: string,
): Promise<FormulaDefinitionV1> => {
  const config = parseUniversalConfig(raw);
  const standardInTable = config.standardInTable !== false;
  const canonicalKeys =
    variableKeyFormatFor(config) ===
    UniversalVariableKeyFormat.CanonicalAlphanumeric;
  const normalizeInputTokens = (expression: string) =>
    canonicalKeys ? canonicalizeUniversalInputTokens(expression) : expression;
  if (canonicalKeys) assertCanonicalUniversalConfigKeys(config);
  const base = inlineUniversalConstants(
    normalizeInputTokens(String(config.expression ?? "").trim()),
    config,
  );
  if (!base) throw new Error("Universal formula expression is required.");
  const samples = universalNumberInRange(
    config.numberOfSamples ?? config.noOfSamples,
    2,
    100,
  );
  const resultDigits = universalDecimalPlaces(
    config.finalResultDecimalPlaces ?? config.decimalPlaces,
    2,
    "Final result decimal places",
  );
  const inputDigits = universalDecimalPlaces(
    config.inputDecimalPlaces,
    2,
    "Input decimal places",
  );
  const tableDigits = universalDecimalPlaces(
    config.tableCalculationDecimalPlaces ?? config.decimalPlaces,
    2,
    "Table calculation decimal places",
  );
  const percentage = Boolean(config.percentageResults ?? config.percent);
  const namedExpressions = parseUniversalNamedExpressions(config);
  const derivedExpressions = materializeUniversalNamedExpressions(
    namedExpressions,
    samples,
    config,
    (expression) =>
      inlineUniversalConstants(normalizeInputTokens(expression), config),
  );
  const preprocessor = await buildWorksheetPreprocessor(
    config,
    tableDigits,
    inputDigits,
  );
  const expressions = Array.from({ length: samples }, (_, index) => {
    const sample = index + 1;
    return expandUniversalSampleExpression(
      expandNamedExpressionReferences(base, namedExpressions, sample, config),
      sample,
      config,
    );
  });
  const allExpressions = [
    ...derivedExpressions.map((item) => item.expression),
    ...expressions,
  ];
  const parsed = allExpressions.map((expression) =>
    parseExpressionV1(expression, FORMULA_V1_RUNTIME_LIMITS),
  );
  const failure = parsed.find((item) => !item.ok);
  if (failure && !failure.ok)
    throw new Error(
      `Universal formula cannot be governed by v1: ${failure.issues[0]?.message ?? "Unsupported expression."}`,
    );
  if (
    !standardInTable &&
    parsed.some(
      (item) =>
        item.ok &&
        item.variables.some((key) =>
          /^(standard(?:Avg|SD|RSD)|R\d+standard)$/i.test(key),
        ),
    )
  )
    throw new Error(
      "Universal formula references a standard-column value, but Include First Column is disabled.",
    );
  const variables = new Set<string>();
  const derivedKeys = new Set(derivedExpressions.map(({ key }) => key));
  for (const item of parsed) {
    if (item.ok)
      for (const key of item.variables) {
        if (!derivedKeys.has(key)) variables.add(key);
      }
  }
  if (canonicalKeys) {
    const invalidKey = [...variables, ...derivedKeys].find(
      (key) => !ALPHANUMERIC_VARIABLE_KEY.test(key),
    );
    if (invalidKey)
      throw new Error(
        `Variable key “${invalidKey}” must contain letters and numbers only and start with a letter.`,
      );
  }
  const results = expressions.map((expression, index) =>
    makeResult(
      `sample${index + 1}`,
      `Sample ${index + 1}`,
      expression,
      resultDigits,
      percentage,
    ),
  );
  if (config.averageAllResults === true && expressions.length > 1) {
    results.push(
      makeResult(
        "average",
        "Average",
        `(${expressions.join("+")})/${expressions.length}`,
        resultDigits,
        percentage,
      ),
    );
  }
  return {
    formulaLanguageVersion: FORMULA_LANGUAGE_V1,
    numericPolicyVersion: FORMULA_NUMERIC_POLICY_V1,
    precisionPolicy: {
      inputDecimalPlaces: inputDigits,
      tableCalculationDecimalPlaces: tableDigits,
    },
    worksheetPolicy: {
      standardInTable,
      ...(preprocessor ? { preprocessor } : {}),
    },
    variables: [...variables].sort().map((key) => ({
      key,
      label: canonicalKeys ? canonicalVariableLabel(key) : key,
      dataType: FormulaDataType.Decimal,
      valueShape: FormulaValueShape.Scalar,
      scope: variableScopeFor(config, key),
      unit: null,
      required: true,
    })),
    ...(derivedExpressions.length > 0 ? { derivedExpressions } : {}),
    results,
  };
};
