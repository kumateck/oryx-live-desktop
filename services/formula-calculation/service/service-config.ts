import {
  FORMULA_V1_EVALUATION_LIMITS,
  FORMULA_V1_RUNTIME_LIMITS,
  type FormulaEvaluationLimits,
  type FormulaLimits,
} from "../../../apps/web/src/shared/formula/core";

export const DEFAULT_SERVICE_FORMULA_LIMITS = FORMULA_V1_RUNTIME_LIMITS;

export const DEFAULT_SERVICE_EVALUATION_LIMITS = FORMULA_V1_EVALUATION_LIMITS;

export const HARD_MAX_SERVICE_FORMULA_LIMITS = DEFAULT_SERVICE_FORMULA_LIMITS;
export const HARD_MAX_SERVICE_EVALUATION_LIMITS =
  DEFAULT_SERVICE_EVALUATION_LIMITS;

export interface FormulaCalculationServiceConfig {
  enabled?: boolean;
  engineBuildHash: string;
  supportedNumericPolicyVersion: string;
  formulaLimits?: Readonly<FormulaLimits>;
  evaluationLimits?: Readonly<FormulaEvaluationLimits>;
  maxCompiledDefinitions?: number;
}

const positiveIntegerValues = (value: object): boolean =>
  Object.values(value).every(
    (item) => Number.isSafeInteger(item) && Number(item) > 0,
  );

const staysWithinHardMaximum = (
  configured: Record<string, number>,
  maximum: Record<string, number>,
): boolean => {
  const keys = Object.keys(configured).sort();
  const expectedKeys = Object.keys(maximum).sort();
  return (
    keys.length === expectedKeys.length &&
    keys.every((key, index) => key === expectedKeys[index]) &&
    Object.entries(configured).every(
      ([key, value]) => key in maximum && value <= (maximum[key] ?? 0),
    )
  );
};

export const validateServiceConfig = (
  config: FormulaCalculationServiceConfig,
): void => {
  if (!/^[a-f0-9]{64}$/.test(config.engineBuildHash)) {
    throw new TypeError("engineBuildHash must be a lowercase SHA-256 digest.");
  }
  if (
    !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(
      config.supportedNumericPolicyVersion,
    )
  ) {
    throw new TypeError("supportedNumericPolicyVersion has an invalid format.");
  }
  if (
    !positiveIntegerValues(
      config.formulaLimits ?? DEFAULT_SERVICE_FORMULA_LIMITS,
    ) ||
    !positiveIntegerValues(
      config.evaluationLimits ?? DEFAULT_SERVICE_EVALUATION_LIMITS,
    )
  ) {
    throw new TypeError(
      "Formula service limits must be positive safe integers.",
    );
  }
  if (
    !staysWithinHardMaximum(
      { ...(config.formulaLimits ?? DEFAULT_SERVICE_FORMULA_LIMITS) },
      { ...HARD_MAX_SERVICE_FORMULA_LIMITS },
    ) ||
    !staysWithinHardMaximum(
      { ...(config.evaluationLimits ?? DEFAULT_SERVICE_EVALUATION_LIMITS) },
      { ...HARD_MAX_SERVICE_EVALUATION_LIMITS },
    )
  ) {
    throw new TypeError("Formula service limits exceed a hard safety maximum.");
  }
  const cacheEntries = config.maxCompiledDefinitions ?? 256;
  if (
    !Number.isSafeInteger(cacheEntries) ||
    cacheEntries < 1 ||
    cacheEntries > 2_048
  ) {
    throw new TypeError("Compiled-definition cache size is invalid.");
  }
};
