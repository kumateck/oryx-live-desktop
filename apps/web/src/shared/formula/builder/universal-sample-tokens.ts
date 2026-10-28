import {
  canonicalizeUniversalInputTokens,
  expandCanonicalSampleInputTokens,
  sampleInputVariableKey,
  UniversalVariableKeyFormat,
  variableKeyFormatFor,
} from "./universal-variable-keys";

type UniversalConfig = Record<string, unknown>;

const singleSampleInputKey = (
  config: UniversalConfig,
  sample: number,
): string | null => {
  if (!Array.isArray(config.sampleInputs)) return null;
  const inputs = config.sampleInputs[sample - 1];
  if (!Array.isArray(inputs) || inputs.length !== 1) return null;
  const input = inputs[0];
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const key = (input as UniversalConfig).key;
  return typeof key === "string" && /^[A-Za-z0-9_]+$/.test(key) ? key : null;
};

export const expandUniversalSampleExpression = (
  expression: string,
  sample: number,
  config: UniversalConfig,
) => {
  if (
    variableKeyFormatFor(config) ===
    UniversalVariableKeyFormat.CanonicalAlphanumeric
  ) {
    const inputKeys = Array.isArray(config.sampleInputs)
      ? ((config.sampleInputs[sample - 1] as unknown[]) ?? []).flatMap(
          (input) => {
            if (!input || typeof input !== "object" || Array.isArray(input))
              return [];
            const key = (input as UniversalConfig).key;
            return typeof key === "string" ? [key] : [];
          },
        )
      : [];
    const canonical = canonicalizeUniversalInputTokens(expression);
    const expanded = expandCanonicalSampleInputTokens(
      canonical
        .replace(/:sampleAvg\b/gi, `:sample${sample}Avg`)
        .replace(/:sampleSD\b/gi, `:sample${sample}SD`)
        .replace(/:sampleRSD\b/gi, `:sample${sample}RSD`)
        .replace(/:R(\d+)sample\b/gi, `:R$1sample${sample}`),
      sample,
      inputKeys,
    );
    const sampleInputKey = singleSampleInputKey(config, sample);
    return sampleInputKey
      ? expanded.replace(
          /:sampleInput\b/gi,
          `:${sampleInputVariableKey(sample, sampleInputKey)}`,
        )
      : expanded;
  }
  const expanded = expression
    .replace(/:sampleAvg\b/gi, `:sample${sample}Avg`)
    .replace(/:sampleSD\b/gi, `:sample${sample}SD`)
    .replace(/:sampleRSD\b/gi, `:sample${sample}RSD`)
    .replace(/:sampleInput\.([A-Za-z0-9_]+)\b/gi, `:sampleInput${sample}.$1`)
    .replace(/:R(\d+)sample\b/gi, `:R$1sample${sample}`)
    .replace(/:spl\.([A-Za-z0-9_]+)\b/gi, `:sampleInput${sample}.$1`);
  const sampleInputKey = singleSampleInputKey(config, sample);
  return sampleInputKey
    ? expanded.replace(
        /:sampleInput\b/gi,
        `:sampleInput${sample}.${sampleInputKey}`,
      )
    : expanded;
};
