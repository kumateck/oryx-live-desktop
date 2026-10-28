import type { CompiledFormulaDefinitionV1 } from "./compiled-definition";
import type { FormulaEvaluationLimits } from "./evaluation-contracts";
import { FormulaEvaluationStatus } from "./evaluation-contracts";
import { EvaluationFault } from "./evaluation-fault";
import {
  compareRational,
  parseRationalDecimal,
  type Rational,
} from "./rational";
import { FormulaValueShape } from "./contracts";

const decimalScale = (value: string): number => {
  const [mantissa, rawExponent] = value.toLowerCase().split("e");
  const fraction = mantissa?.split(".")[1]?.length ?? 0;
  const exponent = rawExponent === undefined ? 0 : Number(rawExponent);
  return Number.isInteger(exponent)
    ? Math.max(0, fraction - exponent)
    : fraction;
};

export const resolveFormulaInputs = (
  definition: CompiledFormulaDefinitionV1,
  rawInputs: Readonly<Record<string, unknown>>,
  limits: FormulaEvaluationLimits,
): Map<string, Rational> => {
  const values = new Map<string, Rational>();
  const declared = new Set(definition.variables.map(({ key }) => key));
  const unexpected = Object.keys(rawInputs).find((key) => !declared.has(key));
  if (unexpected) {
    throw new EvaluationFault(
      FormulaEvaluationStatus.InvalidInput,
      `Unexpected input ${unexpected}.`,
      `inputs.${unexpected}`,
      unexpected,
    );
  }

  for (const variable of definition.variables) {
    if (variable.valueShape !== FormulaValueShape.Scalar) {
      throw new EvaluationFault(
        FormulaEvaluationStatus.UnsupportedPolicy,
        "The scalar evaluator cannot evaluate this value shape.",
        `variables.${variable.key}.valueShape`,
        variable.key,
      );
    }
    const raw = rawInputs[variable.key];
    if (raw === undefined || raw === null || raw === "") {
      if (!variable.required) continue;
      throw new EvaluationFault(
        FormulaEvaluationStatus.MissingInput,
        `Required input ${variable.key} is missing.`,
        `inputs.${variable.key}`,
        variable.key,
      );
    }
    if (typeof raw !== "string") {
      throw new EvaluationFault(
        FormulaEvaluationStatus.InvalidInput,
        `Input ${variable.key} must be a decimal string.`,
        `inputs.${variable.key}`,
        variable.key,
      );
    }
    const value = parseRationalDecimal(raw, limits.maxInputDigits);
    if (!value) {
      throw new EvaluationFault(
        FormulaEvaluationStatus.InvalidInput,
        `Input ${variable.key} is not a permitted decimal.`,
        `inputs.${variable.key}`,
        variable.key,
      );
    }
    const permittedScale = definition.precisionPolicy?.inputDecimalPlaces;
    if (permittedScale !== undefined && decimalScale(raw) > permittedScale) {
      throw new EvaluationFault(
        FormulaEvaluationStatus.InvalidInput,
        `Input ${variable.key} exceeds ${permittedScale} decimal places.`,
        `inputs.${variable.key}`,
        variable.key,
      );
    }
    const minimum = variable.validation?.minimum
      ? parseRationalDecimal(variable.validation.minimum, limits.maxInputDigits)
      : null;
    const maximum = variable.validation?.maximum
      ? parseRationalDecimal(variable.validation.maximum, limits.maxInputDigits)
      : null;
    if (
      (minimum && compareRational(value, minimum) < 0) ||
      (maximum && compareRational(value, maximum) > 0)
    ) {
      throw new EvaluationFault(
        FormulaEvaluationStatus.OutOfRange,
        `Input ${variable.key} is outside its declared range.`,
        `inputs.${variable.key}`,
        variable.key,
      );
    }
    values.set(variable.key, value);
  }
  return values;
};
