export enum UniversalVariableKeyFormat {
  LegacyDotted = 0,
  CanonicalAlphanumeric = 1,
}

type UniversalConfig = Record<string, unknown>;

export const ALPHANUMERIC_VARIABLE_KEY = /^[A-Za-z][A-Za-z0-9]{0,99}$/;

const LEGACY_INPUT_KEY_NAMES: Readonly<Record<string, string>> = {
  wt: "weight",
};

const upperFirst = (value: string) =>
  value.length > 0 ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;

export const canonicalInputKey = (key: string) =>
  LEGACY_INPUT_KEY_NAMES[key.toLowerCase()] ?? key;

export const variableKeyFormatFor = (
  config?: UniversalConfig | null,
): UniversalVariableKeyFormat =>
  config?.variableKeyFormat === UniversalVariableKeyFormat.CanonicalAlphanumeric
    ? UniversalVariableKeyFormat.CanonicalAlphanumeric
    : UniversalVariableKeyFormat.LegacyDotted;

export const standardInputVariableKey = (key: string) =>
  `standard${upperFirst(canonicalInputKey(key))}`;

export const sampleInputTemplateVariableKey = (key: string) =>
  `sample${upperFirst(canonicalInputKey(key))}`;

export const sampleInputVariableKey = (sample: number, key: string) =>
  `sample${sample}${upperFirst(canonicalInputKey(key))}`;

export const perSampleDerivedVariableKey = (sample: number, key: string) =>
  `sample${sample}${upperFirst(key)}`;

export const canonicalVariableLabel = (key: string) => {
  const words = key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d+)/g, "$1 $2 ")
    .replace(/\s+/g, " ")
    .trim();
  return words.length > 0 ? `${words.charAt(0).toUpperCase()}${words.slice(1)}` : key;
};

const objectKeys = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? Object.keys(value)
    : [];

const configuredInputKeys = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.flat(2).flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate))
      return [];
    const key = (candidate as UniversalConfig).key;
    return typeof key === "string" ? [key] : [];
  });
};

export const configuredUniversalInputVariableKeys = (
  config: UniversalConfig,
) => {
  const keys = new Set<string>();
  for (const key of configuredInputKeys(config.standardInputs))
    keys.add(standardInputVariableKey(key));
  if (Array.isArray(config.sampleInputs)) {
    config.sampleInputs.forEach((sample, index) => {
      for (const key of configuredInputKeys(sample)) {
        keys.add(sampleInputTemplateVariableKey(key));
        keys.add(sampleInputVariableKey(index + 1, key));
      }
    });
  }
  return keys;
};

export const assertCanonicalUniversalConfigKeys = (config: UniversalConfig) => {
  const userKeys = [
    ...objectKeys(config.constants),
    ...objectKeys(config.manualVars),
    ...objectKeys(config.manualVarLabels),
  ];
  const inputKeys = configuredUniversalInputVariableKeys(config);
  const configuredKeys = [
    ...userKeys,
    ...configuredInputKeys(config.standardInputs).map(canonicalInputKey),
    ...configuredInputKeys(config.sampleInputs).map(canonicalInputKey),
  ];
  const invalidKey = configuredKeys.find(
    (key) => !ALPHANUMERIC_VARIABLE_KEY.test(key),
  );
  if (invalidKey)
    throw new Error(
      `Variable key “${invalidKey}” must contain letters and numbers only and start with a letter.`,
    );
  const collision = userKeys.find((key) => inputKeys.has(key));
  if (collision)
    throw new Error(`Variable key “${collision}” is already used by an input.`);
};

const replaceToken = (expression: string, pattern: RegExp, key: string) =>
  expression.replace(pattern, `:${key}`);

export const canonicalizeUniversalInputTokens = (expression: string) => {
  let normalized = expression;
  normalized = normalized.replace(
    /:standardInput\.([A-Za-z0-9_]+)\b/gi,
    (_match, key: string) => `:${standardInputVariableKey(key)}`,
  );
  normalized = normalized.replace(
    /:sampleInput(\d+)\.([A-Za-z0-9_]+)\b/gi,
    (_match, sample: string, key: string) =>
      `:${sampleInputVariableKey(Number(sample), key)}`,
  );
  normalized = normalized.replace(
    /:sampleInput\.([A-Za-z0-9_]+)\b/gi,
    (_match, key: string) => `:${sampleInputTemplateVariableKey(key)}`,
  );
  normalized = normalized.replace(
    /:std\.([A-Za-z0-9_]+)\b/gi,
    (_match, key: string) => `:${standardInputVariableKey(key)}`,
  );
  return normalized.replace(
    /:spl\.([A-Za-z0-9_]+)\b/gi,
    (_match, key: string) => `:${sampleInputTemplateVariableKey(key)}`,
  );
};

export const expandCanonicalSampleInputTokens = (
  expression: string,
  sample: number,
  inputKeys: string[],
) =>
  inputKeys.reduce(
    (current, key) =>
      replaceToken(
        current,
        new RegExp(`:${sampleInputTemplateVariableKey(key)}\\b`, "gi"),
        sampleInputVariableKey(sample, key),
      ),
    expression,
  );
