import {
  FORMULA_LANGUAGE_V1,
  FormulaDataType,
  FormulaNumericScale,
  FormulaRoundingKind,
  FormulaValueShape,
  type FormulaDefinitionV1,
} from "../core/contracts";
import {
  compileFormulaDefinitionV1,
  hashCompiledFormulaDefinitionV1,
} from "../core/definition";
import { parseExpressionV1 } from "../core/expression";
import {
  FORMULA_V1_EVALUATION_LIMITS,
  FORMULA_V1_RUNTIME_LIMITS,
} from "../core/runtime-limits";
import type { FormulaTestCaseV1 } from "../core/test-contracts";
import { buildDefaultFormulaTestCasesV1 } from "../core/test-suite";
import { assertScalarAdapterSupported } from "./scalar-adapter-guard";
import { buildUniversalDefinition } from "./universal-definition-adapter";
import { variableScopeFor } from "./variable-scope";

export const FORMULA_NUMERIC_POLICY_V1 = "oryx-decimal-v1-half-up";

type LegacyFormulaConfig = Record<string, unknown>;

export type FormulaRevisionDraft = {
  authoringPayload: string;
  definitionHash: string;
  formulaLanguageVersion: typeof FORMULA_LANGUAGE_V1;
  numericPolicyVersion: string;
  presentationPreset: string;
  definition: FormulaDefinitionV1;
  testCases: FormulaTestCaseV1[];
};

const asObject = (value: unknown): LegacyFormulaConfig | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as LegacyFormulaConfig)
    : null;

const parseObject = (value: string): LegacyFormulaConfig | null => {
  try {
    return asObject(JSON.parse(value));
  } catch {
    return null;
  }
};

const unwrap = (raw: string): LegacyFormulaConfig => {
  const first = parseObject(raw);
  if (!first) return { expression: raw };
  const nested =
    typeof first.expression === "string" ? parseObject(first.expression) : null;
  return nested ? { ...first, ...nested } : first;
};

const labelFor = (metadata: LegacyFormulaConfig, key: string): string => {
  const value = asObject(metadata[key]);
  return typeof value?.label === "string" && value.label.trim()
    ? value.label.trim()
    : key;
};

export const buildFormulaRevisionDraft = async (
  raw: string,
  presentationPreset: string,
): Promise<FormulaRevisionDraft> => {
  const config = unwrap(raw);
  const isUniversal = presentationPreset.trim().toLowerCase() === "universal";
  if (!isUniversal) assertScalarAdapterSupported(config, presentationPreset);
  const expression =
    typeof config.expression === "string" ? config.expression.trim() : "";
  const parsed = parseExpressionV1(expression, FORMULA_V1_RUNTIME_LIMITS);
  if (!parsed.ok) {
    const detail = parsed.issues[0]?.message ?? "Unsupported expression.";
    throw new Error(`Formula cannot be governed by v1: ${detail}`);
  }
  const rawDigits = Number(config.decimalPlaces ?? 2);
  if (!Number.isInteger(rawDigits) || rawDigits < 0 || rawDigits > 12)
    throw new Error("Decimal places must be a whole number from 0 to 12.");
  const percentage = Boolean(config.percentageResults ?? config.percent);
  const variableLabels = asObject(config.variables) ?? {};
  const definition: FormulaDefinitionV1 = isUniversal
    ? await buildUniversalDefinition(raw)
    : {
        formulaLanguageVersion: FORMULA_LANGUAGE_V1,
        numericPolicyVersion: FORMULA_NUMERIC_POLICY_V1,
        variables: [...parsed.variables].sort().map((key) => ({
          key,
          label: labelFor(variableLabels, key),
          dataType: FormulaDataType.Decimal,
          valueShape: FormulaValueShape.Scalar,
          scope: variableScopeFor(config, key),
          unit: null,
          required: true,
        })),
        results: [
          {
            key: "result",
            label: "Result",
            expression,
            unit: percentage ? "%" : null,
            numericScale: percentage
              ? FormulaNumericScale.PercentagePoints
              : FormulaNumericScale.Absolute,
            rounding: {
              kind: FormulaRoundingKind.DecimalPlaces,
              digits: rawDigits,
            },
          },
        ],
      };
  const compiled = compileFormulaDefinitionV1(
    definition,
    FORMULA_V1_RUNTIME_LIMITS,
  );
  if (!compiled.ok) {
    const detail = compiled.issues[0]?.message ?? "Compilation failed.";
    throw new Error(`Formula cannot be governed by v1: ${detail}`);
  }
  return {
    authoringPayload: raw,
    definitionHash: await hashCompiledFormulaDefinitionV1(compiled.definition),
    formulaLanguageVersion: FORMULA_LANGUAGE_V1,
    numericPolicyVersion: FORMULA_NUMERIC_POLICY_V1,
    presentationPreset,
    definition,
    testCases: buildDefaultFormulaTestCasesV1(
      compiled.definition,
      FORMULA_V1_EVALUATION_LIMITS,
    ),
  };
};
