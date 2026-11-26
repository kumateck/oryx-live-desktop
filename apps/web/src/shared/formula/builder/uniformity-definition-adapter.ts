import {
  FORMULA_LANGUAGE_V1,
  FormulaDataType,
  FormulaNumericScale,
  FormulaRoundingKind,
  FormulaScope,
  FormulaValueShape,
  type FormulaDefinitionV1,
  type FormulaResultDefinition,
  type FormulaVariableDefinition,
} from "../core/contracts";

const NUMERIC_POLICY = "oryx-decimal-v1-half-up";
/** The evaluator shows up to six decimals when no fixed number is configured. */
const AUTO_DECIMALS = 6;
const MAX_SAMPLES = 1000;

type Config = Record<string, unknown>;
type Mode = "capsule" | "tablet" | "tube";

const isMode = (value: unknown): value is Mode =>
  value === "capsule" || value === "tablet" || value === "tube";

/** A finite number as a plain decimal literal the v1 grammar accepts (never exponent notation). */
const decimalLiteral = (value: number): string => {
  const text = String(value);
  if (!/e/i.test(text)) return text;
  return value
    .toFixed(20)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
};

const variable = (key: string, label: string): FormulaVariableDefinition => ({
  key,
  label,
  dataType: FormulaDataType.Decimal,
  valueShape: FormulaValueShape.Scalar,
  // Every value is read from this question's own uniformity table, never from another question.
  scope: FormulaScope.Placement,
  unit: null,
  required: true,
});

const result = (
  key: string,
  label: string,
  expression: string,
  digits: number,
  percentage = false,
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

/** Whether a stored payload is the Uniformity of Weight builder's configuration. */
export const isUniformityConfig = (config: Config): boolean =>
  isMode(config.mode);

/**
 * The governed definition of a Uniformity of Weight question. It matches the worksheet
 * evaluator: the weighed values (combined weight and the minimum and maximum of the
 * individual weights) are the inputs, and deviations are always percentages of the
 * nominal weight. The `percent` setting only changes how the worksheet shows the deviation,
 * so it does not change the definition.
 */
export const buildUniformityDefinition = (
  config: Config,
): FormulaDefinitionV1 => {
  if (!isMode(config.mode))
    throw new Error(
      "Uniformity of Weight needs a type: Capsules, Tablets or Tubes. No formula has been saved or converted.",
    );
  const mode = config.mode;
  const samples = Number(config.sampleCount);
  if (!Number.isInteger(samples) || samples < 1 || samples > MAX_SAMPLES)
    throw new Error(
      `Sample count must be a whole number from 1 to ${MAX_SAMPLES}.`,
    );
  const nominal = Number(config.nominal);
  if (
    config.nominal === null ||
    config.nominal === undefined ||
    config.nominal === "" ||
    !Number.isFinite(nominal) ||
    nominal <= 0
  )
    throw new Error(
      mode === "capsule"
        ? "Enter a nominal content weight greater than zero before saving."
        : "Enter a nominal weight greater than zero before saving.",
    );
  const rawDigits = config.decimalPlaces;
  const digits =
    rawDigits === "" || rawDigits === undefined || rawDigits === null
      ? AUTO_DECIMALS
      : Number(rawDigits);
  if (!Number.isInteger(digits) || digits < 0 || digits > 10)
    throw new Error("Decimal places must be a whole number from 0 to 10.");

  const n = String(samples);
  const nominalValue = decimalLiteral(nominal);
  const deviation = (extreme: string) =>
    `(:${extreme} - ${nominalValue}) / ${nominalValue} * 100`;

  const definition = (
    variables: FormulaVariableDefinition[],
    results: FormulaResultDefinition[],
  ): FormulaDefinitionV1 => ({
    formulaLanguageVersion: FORMULA_LANGUAGE_V1,
    numericPolicyVersion: NUMERIC_POLICY,
    variables: [...variables].sort((a, b) => a.key.localeCompare(b.key)),
    results,
  });

  if (mode === "capsule") {
    return definition(
      [
        variable("capsulesWeight", `Weight of ${n} capsules`),
        variable("shellsWeight", `Weight of ${n} empty shells`),
        variable(
          "minimumContentWeight",
          "Minimum content weight (capsule − shell)",
        ),
        variable(
          "maximumContentWeight",
          "Maximum content weight (capsule − shell)",
        ),
      ],
      [
        result(
          "contentWeight",
          "Weight of content",
          ":capsulesWeight - :shellsWeight",
          digits,
        ),
        result(
          "averageCapsuleWeight",
          `Average weight of capsule (bulk ÷ ${n})`,
          `:capsulesWeight / ${n}`,
          digits,
        ),
        result(
          "plusDeviation",
          "+ Dev",
          deviation("maximumContentWeight"),
          digits,
          true,
        ),
        result(
          "minusDeviation",
          "- Dev",
          deviation("minimumContentWeight"),
          digits,
          true,
        ),
      ],
    );
  }

  const unit = mode === "tablet" ? "tablets" : "tubes";
  return definition(
    [
      variable("combinedWeight", `Combined weight of ${n} ${unit}`),
      variable("minimumWeight", "Minimum individual weight"),
      variable("maximumWeight", "Maximum individual weight"),
    ],
    [
      result(
        "averageWeight",
        `Average weight (bulk ÷ ${n})`,
        `:combinedWeight / ${n}`,
        digits,
      ),
      result(
        "plusDeviation",
        "+ Dev",
        deviation("maximumWeight"),
        digits,
        true,
      ),
      result(
        "minusDeviation",
        "- Dev",
        deviation("minimumWeight"),
        digits,
        true,
      ),
    ],
  );
};
