export type UniversalConfig = Record<string, unknown>;

export const parseUniversalConfig = (raw: string): UniversalConfig => {
  try {
    const value = JSON.parse(raw) as unknown;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const config = value as UniversalConfig;
      if (typeof config.expression !== "string") return config;
      try {
        const nested = JSON.parse(config.expression) as unknown;
        if (nested && typeof nested === "object" && !Array.isArray(nested))
          return { ...config, ...(nested as UniversalConfig) };
      } catch {
        return config;
      }
      return config;
    }
  } catch {
    // Report one controlled validation error below.
  }
  throw new Error("Universal formula configuration must be valid JSON.");
};

export const universalNumberInRange = (
  value: unknown,
  fallback: number,
  maximum: number,
) => {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 && numeric <= maximum
    ? numeric
    : fallback;
};

export const universalDecimalPlaces = (
  value: unknown,
  fallback: number,
  label: string,
) => {
  if (value === undefined || value === null || value === "") return fallback;
  const numeric = Number(value);
  if (Number.isInteger(numeric) && numeric >= 0 && numeric <= 12)
    return numeric;
  throw new Error(`${label} must be a whole number from 0 to 12.`);
};

const replaceToken = (expression: string, key: string, value: string) =>
  expression.replace(
    new RegExp(`:${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"),
    value,
  );

export const inlineUniversalConstants = (
  expression: string,
  config: UniversalConfig,
) => {
  const constants = config.constants;
  if (!constants || typeof constants !== "object" || Array.isArray(constants))
    return expression;
  return Object.entries(constants).reduce((current, [key, value]) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric))
      throw new Error(`Universal constant “${key}” must be numeric.`);
    return replaceToken(current, key, String(numeric));
  }, expression);
};
