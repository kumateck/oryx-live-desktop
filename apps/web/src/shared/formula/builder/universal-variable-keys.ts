import type { ExpressionExtract } from "../ui/types/expression/universal/types";

export enum UniversalVariableKeyFormat {
  LegacyDotted = 0,
  CanonicalAlphanumeric = 1,
}

type UniversalConfig = Record<string, unknown>;
type InputConfig = UniversalConfig | ExpressionExtract;

export const ALPHANUMERIC_VARIABLE_KEY = /^[A-Za-z][A-Za-z0-9]{0,99}$/;

const LEGACY_INPUT_KEY_NAMES: Readonly<Record<string, string>> = {
  wt: "weight",
};

const upperFirst = (value: string) =>
  value.length > 0 ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;

export const canonicalInputKey = (key: string) =>
  LEGACY_INPUT_KEY_NAMES[key.toLowerCase()] ?? key;

export const variableKeyFormatFor = (
  config?: InputConfig | null,
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

/*
 * Concentration aliases. :standardConc and :sampleConc (and :sample1Conc, …) are other names for the weight
 * input: one input, one value, so a formula may use either name or both. A formula switches them on by saving
 * `concentrationUnit` with its configuration. Formulas saved without it keep their old meaning, so an older
 * formula that used one of these names for its own manual variable is never reinterpreted.
 */
export const CONCENTRATION_UNITS = ["mg/mL", "%"] as const;
export type ConcentrationUnit = (typeof CONCENTRATION_UNITS)[number];
export const DEFAULT_CONCENTRATION_UNIT: ConcentrationUnit = "mg/mL";
/** The alias behaves like an input with this key: standardConc, sampleConc, sample1Conc. */
export const CONCENTRATION_INPUT_KEY = "conc";
const WEIGHT_INPUT_KEY = "weight";
const CONCENTRATION_TOKEN = /:(?:standard|sample\d*)Conc\b/;

export const isConcentrationUnit = (
  value: UniversalConfig[string],
): value is ConcentrationUnit =>
  CONCENTRATION_UNITS.some((unit) => unit === value);

export const isWeightInputKey = (key: string) =>
  canonicalInputKey(key).toLowerCase() === WEIGHT_INPUT_KEY;

const weightKeyIn = (inputs: UniversalConfig[string]) =>
  configuredInputKeys(inputs).find(isWeightInputKey) ?? null;

export type ConcentrationAliases = {
  /** The standard weight input's key, or null when the formula has no standard weight. */
  standardWeightKey: string | null;
  /** The first sample's weight input key, or null when samples have no weight input. */
  sampleWeightKey: string | null;
  unit: ConcentrationUnit;
};

/** The concentration aliases a saved configuration has switched on, or null when it has none. */
export const concentrationAliasesFor = (
  config?: InputConfig | null,
): ConcentrationAliases | null => {
  if (
    !config ||
    variableKeyFormatFor(config) !==
      UniversalVariableKeyFormat.CanonicalAlphanumeric ||
    !isConcentrationUnit(config.concentrationUnit)
  )
    return null;
  const inputKeys = [
    ...configuredInputKeys(config.standardInputs),
    ...configuredInputKeys(config.sampleInputs),
  ];
  if (
    inputKeys.some(
      (key) => canonicalInputKey(key).toLowerCase() === CONCENTRATION_INPUT_KEY,
    )
  )
    return null;
  const standardWeightKey = weightKeyIn(config.standardInputs);
  const sampleWeightKey = Array.isArray(config.sampleInputs)
    ? weightKeyIn(config.sampleInputs[0])
    : null;
  if (!standardWeightKey && !sampleWeightKey) return null;
  return { standardWeightKey, sampleWeightKey, unit: config.concentrationUnit };
};

/** The text of every expression a configuration evaluates: the main formula, named expressions and manual-variable expressions. */
const configurationExpressionText = (config: InputConfig) => {
  const named = config.namedExpressionsEnabled === true && Array.isArray(config.namedExpressions)
    ? config.namedExpressions.flatMap((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry))
          return [];
        const expression = (entry as UniversalConfig).expression;
        return typeof expression === "string" ? [expression] : [];
      })
    : [];
  const manual =
    config.manualVarExpressions &&
    typeof config.manualVarExpressions === "object" &&
    !Array.isArray(config.manualVarExpressions)
      ? Object.values(config.manualVarExpressions).filter(
          (value): value is string => typeof value === "string",
        )
      : [];
  const main = typeof config.expression === "string" ? config.expression : "";
  return [main, ...named, ...manual].join("\n");
};

/** Whether a configuration's expressions use :standardConc, :sampleConc or :sampleNConc. */
export const usesConcentrationTokens = (config: InputConfig) =>
  CONCENTRATION_TOKEN.test(configurationExpressionText(config));

/**
 * The unit the editor starts from. A formula saved before the aliases existed that already uses one of their
 * names for its own variable gets none, so the editor keeps that variable as it was.
 */
export const concentrationUnitForEditing = (
  config: InputConfig,
): ConcentrationUnit | undefined => {
  if (isConcentrationUnit(config.concentrationUnit))
    return config.concentrationUnit;
  return usesConcentrationTokens(config)
    ? undefined
    : DEFAULT_CONCENTRATION_UNIT;
};

/** Whether a variable key is a concentration alias the configuration has switched on. */
export const isConcentrationAliasKey = (
  key: string,
  config?: InputConfig | null,
) => {
  const aliases = concentrationAliasesFor(config);
  if (!aliases) return false;
  if (key === standardInputVariableKey(CONCENTRATION_INPUT_KEY))
    return aliases.standardWeightKey !== null;
  return /^sample\d*Conc$/.test(key) && aliases.sampleWeightKey !== null;
};

/**
 * Rewrites the concentration aliases to the weight keys they stand for, so the governed definition, its hash and
 * every server calculation are exactly those of the same formula written with the weight keys.
 */
export const resolveConcentrationAliases = (
  expression: string,
  config: InputConfig,
) => {
  const aliases = concentrationAliasesFor(config);
  if (!aliases) return expression;
  const { standardWeightKey, sampleWeightKey } = aliases;
  let resolved = expression;
  if (standardWeightKey)
    resolved = resolved.replace(
      /:standardConc\b/g,
      `:${standardInputVariableKey(standardWeightKey)}`,
    );
  if (sampleWeightKey)
    resolved = resolved.replace(/:sample(\d*)Conc\b/g, (_match, sample: string) =>
      sample
        ? `:${sampleInputVariableKey(Number(sample), sampleWeightKey)}`
        : `:${sampleInputTemplateVariableKey(sampleWeightKey)}`,
    );
  return resolved;
};

/** One sample's input keys for expanding :sampleWeight-style tokens, including the concentration alias when it is on. */
export const sampleExpansionInputKeys = (
  config: InputConfig,
  sample: number,
) => {
  const keys = Array.isArray(config.sampleInputs)
    ? configuredInputKeys(config.sampleInputs[sample - 1])
    : [];
  return concentrationAliasesFor(config)?.sampleWeightKey &&
    keys.some(isWeightInputKey)
    ? [...keys, CONCENTRATION_INPUT_KEY]
    : keys;
};

export type WeightInputRole = "standard" | "sample";

/**
 * How the worksheet names the weight input: by the key the formula uses. A formula that uses only the
 * concentration alias shows "Concentration (unit)", one that uses both shows "Weight / Concentration", and every
 * other input keeps its saved label and key.
 */
export const weightInputPresentation = (
  config: InputConfig | null | undefined,
  role: WeightInputRole,
  input: { key: string; label: string },
) => {
  const unchanged = { label: input.label, key: input.key };
  const aliases = concentrationAliasesFor(config);
  if (!config || !aliases || !isWeightInputKey(input.key)) return unchanged;
  if (
    (role === "standard" ? aliases.standardWeightKey : aliases.sampleWeightKey) ===
    null
  )
    return unchanged;
  const text = canonicalizeUniversalInputTokens(
    configurationExpressionText(config),
  );
  const weightName = upperFirst(canonicalInputKey(input.key));
  const usesConcentration =
    role === "standard"
      ? /:standardConc\b/.test(text)
      : /:sample\d*Conc\b/.test(text);
  if (!usesConcentration) return unchanged;
  const usesWeight =
    role === "standard"
      ? new RegExp(`:standard${weightName}\\b`).test(text)
      : new RegExp(`:sample\\d*${weightName}\\b`).test(text) ||
        /:sampleInput\b/.test(text);
  return usesWeight
    ? {
        label: `${role === "standard" ? "Standard " : ""}Weight / Concentration (${input.label.match(/\(([^)]+)\)\s*$/)?.[1] ?? "g"} or ${aliases.unit})`,
        key: `${input.key} / ${CONCENTRATION_INPUT_KEY}`,
      }
    : { label: `${role === "standard" ? "Standard " : ""}Concentration (${aliases.unit})`, key: CONCENTRATION_INPUT_KEY };
};

export const configuredUniversalInputVariableKeys = (
  config: InputConfig,
) => {
  const keys = new Set<string>();
  const aliases = concentrationAliasesFor(config);
  for (const key of configuredInputKeys(config.standardInputs))
    keys.add(standardInputVariableKey(key));
  if (aliases?.standardWeightKey)
    keys.add(standardInputVariableKey(CONCENTRATION_INPUT_KEY));
  if (Array.isArray(config.sampleInputs)) {
    config.sampleInputs.forEach((sample, index) => {
      const sampleKeys = configuredInputKeys(sample);
      const withAlias =
        aliases?.sampleWeightKey && sampleKeys.some(isWeightInputKey)
          ? [...sampleKeys, CONCENTRATION_INPUT_KEY]
          : sampleKeys;
      for (const key of withAlias) {
        keys.add(sampleInputTemplateVariableKey(key));
        keys.add(sampleInputVariableKey(index + 1, key));
      }
    });
  }
  return keys;
};

export const assertCanonicalUniversalConfigKeys = (config: InputConfig) => {
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
