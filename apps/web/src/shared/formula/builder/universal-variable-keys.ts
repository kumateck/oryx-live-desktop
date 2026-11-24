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

export const MEASUREMENT_ALIAS_LABELS = {
  absorbance: "Absorbance",
  peakAreas: "Peak Areas",
  titreValue: "Titre Value",
} as const;
export type MeasurementAlias = keyof typeof MEASUREMENT_ALIAS_LABELS;
const measurementAliasKeys: MeasurementAlias[] = ["absorbance", "peakAreas", "titreValue"];
type InputAlias = typeof CONCENTRATION_INPUT_KEY | MeasurementAlias;
export type WeightInputRole = "standard" | "sample";

const inputAliasToken = (key: string, role = "(?:standard|sample[0-9]*)") =>
  new RegExp(`:${role}${upperFirst(key)}\\b`, "g");

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

/** Opt in on edit only when an older formula has not claimed that alias for a separate variable. */
export const measurementAliasesForEditing = (config: InputConfig): MeasurementAlias[] => {
  const declared = [
    ...objectKeys(config.constants),
    ...objectKeys(config.manualVars),
    ...objectKeys(config.manualVarLabels),
    ...configuredInputKeys(config.namedExpressions),
  ];
  const text = [configurationExpressionText(config), ...declared.map(key => `:${key}`)].join(" ");
  return measurementAliasKeys.filter(key =>
    (Array.isArray(config.measurementAliases) && config.measurementAliases.includes(key)) ||
    (!inputAliasToken(key).test(text) && !declared.includes(key)),
  );
};

const measurementInputAliases = (config: InputConfig, role: WeightInputRole): MeasurementAlias[] => {
  if (variableKeyFormatFor(config) !== UniversalVariableKeyFormat.CanonicalAlphanumeric ||
      !Array.isArray(config.measurementAliases)) return [];
  const inputs = role === "standard" ? config.standardInputs : config.sampleInputs;
  const enabled = role === "standard"
    ? config.standardInput !== false && config.standardInTable !== false
    : config.sampleInput !== false;
  const firstInputs = role === "sample" && Array.isArray(inputs) ? inputs[0] : inputs;
  if (!enabled || !weightKeyIn(firstInputs)) return [];
  const realKeys = configuredInputKeys(inputs).map(key => key.toLowerCase());
  const selected = config.measurementAliases;
  return measurementAliasKeys.filter(key => selected.includes(key) && !realKeys.includes(key.toLowerCase()));
};

export const inputAliasKeysFor = (config: InputConfig | null | undefined, role: WeightInputRole): InputAlias[] => {
  if (!config) return [];
  const concentration = concentrationAliasesFor(config);
  const weightKey = role === "standard" ? concentration?.standardWeightKey : concentration?.sampleWeightKey;
  const measurement = measurementInputAliases(config, role);
  return weightKey ? [CONCENTRATION_INPUT_KEY, ...measurement] : measurement;
};

export const usedMeasurementAliases = (config: InputConfig): MeasurementAlias[] | undefined => {
  const text = configurationExpressionText(config);
  const standard = measurementInputAliases(config, "standard");
  const sample = measurementInputAliases(config, "sample");
  const used = measurementAliasKeys.filter(key =>
    (standard.includes(key) && inputAliasToken(key, "standard").test(text)) ||
    (sample.includes(key) && inputAliasToken(key, "sample[0-9]*").test(text)),
  );
  return used.length ? used : undefined;
};

export const isBoundSampleAlias = (key: string, config: InputConfig) =>
  inputAliasKeysFor(config, "sample").some(alias => new RegExp(`^sample[0-9]*${upperFirst(alias)}$`).test(key));

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

/**
 * Normalize the alias spelling before building the governed formula. Every alias
 * uses the existing weight variable, including its input validation and value.
 */
export const resolveUniversalInputAliases = (
  expression: string,
  config: InputConfig,
) => {
  const standardWeight = weightKeyIn(config.standardInputs);
  const samples = Array.isArray(config.sampleInputs) ? config.sampleInputs : [];
  let resolved = expression;
  if (standardWeight) {
    for (const alias of inputAliasKeysFor(config, "standard")) {
      resolved = resolved.replace(inputAliasToken(alias, "standard"), `:${standardInputVariableKey(standardWeight)}`);
    }
  }
  for (const alias of inputAliasKeysFor(config, "sample")) {
    resolved = resolved.replace(inputAliasToken(alias, "sample([0-9]*)"), (token, index: string) => {
      const weight = weightKeyIn(samples[index ? Number(index) - 1 : 0]);
      if (!weight) return token;
      return index ? `:${sampleInputVariableKey(Number(index), weight)}` : `:${sampleInputTemplateVariableKey(weight)}`;
    });
  }
  return resolved;
};

/** Input keys eligible for template expansion for this particular sample. */
export const sampleExpansionInputKeys = (config: InputConfig, sample: number) => {
  const keys = Array.isArray(config.sampleInputs)
    ? configuredInputKeys(config.sampleInputs[sample - 1])
    : [];
  return keys.some(isWeightInputKey) ? [...keys, ...inputAliasKeysFor(config, "sample")] : keys;
};

/** Name the one worksheet field using the aliases that read from it. */
export const weightInputPresentation = (
  config: InputConfig | null | undefined,
  role: WeightInputRole,
  input: { key: string; label: string },
  sampleNumber?: number,
) => {
  const unchanged = { label: input.label, key: input.key };
  const aliases = concentrationAliasesFor(config);
  if (!config || !isWeightInputKey(input.key)) return unchanged;
  const text = canonicalizeUniversalInputTokens(
    configurationExpressionText(config),
  );
  const weightName = upperFirst(canonicalInputKey(input.key));
  const tokenRole = role === "standard" ? "standard" : sampleNumber ? `sample(?:${sampleNumber})?` : "sample[0-9]*";
  const selected = inputAliasKeysFor(config, role).filter(alias => inputAliasToken(alias, tokenRole).test(text));
  if (!selected.length) return unchanged;
  const usesWeight = inputAliasToken(weightName, tokenRole).test(text) ||
    (role === "sample" && /:sampleInput\b/.test(text));
  const names = selected.map(alias => alias === CONCENTRATION_INPUT_KEY
    ? "Concentration"
    : MEASUREMENT_ALIAS_LABELS[alias]);
  const sourceUnit = input.label.match(/\(([^)]+)\)\s*$/)?.[1] ?? "g";
  const units = [
    ...(usesWeight ? [sourceUnit] : []),
    ...(aliases && selected.includes(CONCENTRATION_INPUT_KEY) ? [aliases.unit] : []),
  ];
  return {
    label: `${role === "standard" ? "Standard " : ""}${[...(usesWeight ? ["Weight"] : []), ...names].join(" / ")}${units.length ? ` (${units.join(" or ")})` : ""}`,
    key: [...(usesWeight ? [input.key] : []), ...selected].join(" / "),
  };
};

/** Present the authored input name while retaining the governed variable's canonical key. */
export const universalInputVariableLabel = (config: InputConfig, key: string) => {
  const match = /^(standard|sample([1-9][0-9]*))Weight$/.exec(key);
  if (!match) return canonicalVariableLabel(key);
  const sample = match[2] ? Number(match[2]) : undefined;
  const fields = sample === undefined ? config.standardInputs
    : Array.isArray(config.sampleInputs) ? config.sampleInputs[sample - 1] : undefined;
  if (!Array.isArray(fields)) return canonicalVariableLabel(key);
  for (const field of fields) {
    if (!field || typeof field !== "object") continue;
    if (!("key" in field) || typeof field.key !== "string" || !isWeightInputKey(field.key)) continue;
    const label = "label" in field && typeof field.label === "string" ? field.label : "Weight";
    const shown = weightInputPresentation(config, sample === undefined ? "standard" : "sample", { key: field.key, label }, sample);
    if (shown.key !== field.key) return sample === undefined ? shown.label : `Sample ${sample} ${shown.label}`;
  }
  return canonicalVariableLabel(key);
};

export const configuredUniversalInputVariableKeys = (
  config: InputConfig,
) => {
  const keys = new Set<string>();
  for (const key of configuredInputKeys(config.standardInputs))
    keys.add(standardInputVariableKey(key));
  for (const alias of inputAliasKeysFor(config, "standard"))
    keys.add(standardInputVariableKey(alias));
  if (Array.isArray(config.sampleInputs)) {
    config.sampleInputs.forEach((_sample, index) => {
      for (const key of sampleExpansionInputKeys(config, index + 1)) {
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
