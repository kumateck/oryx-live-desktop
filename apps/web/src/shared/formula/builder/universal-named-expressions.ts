import type { FormulaDerivedExpressionDefinition } from "../core/contracts";
import { expandUniversalSampleExpression } from "./universal-sample-tokens";
import {
  ALPHANUMERIC_VARIABLE_KEY,
  configuredUniversalInputVariableKeys,
  perSampleDerivedVariableKey,
  UniversalVariableKeyFormat,
  variableKeyFormatFor,
} from "./universal-variable-keys";

export enum UniversalNamedExpressionScope {
  Global = 0,
  PerSample = 1,
}

export interface UniversalNamedExpression {
  key: string;
  label: string;
  expression: string;
  scope: UniversalNamedExpressionScope;
}

type UniversalConfig = Record<string, unknown>;

const LEGACY_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]{0,99}$/;
const RESERVED_KEY_PATTERN =
  /^(?:sample(?:Avg|SD|RSD|Input)|standard(?:Avg|SD|RSD|Input)|R\d+.+|spl|std|blk)$/i;
const sampleTokenPattern =
  /:(?:sample(?:Avg|SD|RSD)|sampleInput(?:\.|\b)|R\d+sample\b|spl\.)/i;

const replaceToken = (expression: string, key: string, replacement: string) =>
  expression.replace(
    new RegExp(`:${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"),
    replacement,
  );

export const parseUniversalNamedExpressions = (
  config: UniversalConfig,
): UniversalNamedExpression[] => {
  if (config.namedExpressionsEnabled !== true) return [];
  if (!Array.isArray(config.namedExpressions))
    throw new Error("Named expressions must be an array.");
  if (config.namedExpressions.length > 100)
    throw new Error("Named expression limit exceeded.");
  const constantKeys = new Set(
    config.constants &&
      typeof config.constants === "object" &&
      !Array.isArray(config.constants)
      ? Object.keys(config.constants)
      : [],
  );
  const inputKeys = configuredUniversalInputVariableKeys(config);
  const keys = new Set<string>();
  return config.namedExpressions.map((value, index) => {
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error(`Named expression ${index + 1} is invalid.`);
    const item = value as Record<string, unknown>;
    const key = typeof item.key === "string" ? item.key.trim() : "";
    const label = typeof item.label === "string" ? item.label.trim() : "";
    const expression =
      typeof item.expression === "string" ? item.expression.trim() : "";
    const scope = Number(item.scope);
    const keyPattern =
      variableKeyFormatFor(config) ===
      UniversalVariableKeyFormat.CanonicalAlphanumeric
        ? ALPHANUMERIC_VARIABLE_KEY
        : LEGACY_KEY_PATTERN;
    if (!keyPattern.test(key))
      throw new Error(`Named expression ${index + 1} has an invalid key.`);
    if (
      RESERVED_KEY_PATTERN.test(key) ||
      constantKeys.has(key) ||
      inputKeys.has(key)
    )
      throw new Error(
        `Named expression key “${key}” is reserved or already used.`,
      );
    if (keys.has(key))
      throw new Error(`Named expression key “${key}” is duplicated.`);
    if (!label) throw new Error(`Named expression “${key}” requires a label.`);
    if (!expression)
      throw new Error(`Named expression “${key}” requires an expression.`);
    if (
      scope !== UniversalNamedExpressionScope.Global &&
      scope !== UniversalNamedExpressionScope.PerSample
    )
      throw new Error(`Named expression “${key}” has an invalid scope.`);
    keys.add(key);
    return { key, label, expression, scope };
  });
};

const mappedKey = (
  item: UniversalNamedExpression,
  sample: number,
  config?: UniversalConfig,
): string =>
  item.scope === UniversalNamedExpressionScope.PerSample
    ? variableKeyFormatFor(config) ===
      UniversalVariableKeyFormat.CanonicalAlphanumeric
      ? perSampleDerivedVariableKey(sample, item.key)
      : `sample${sample}.${item.key}`
    : item.key;

export const expandNamedExpressionReferences = (
  expression: string,
  definitions: UniversalNamedExpression[],
  sample: number,
  config?: UniversalConfig,
): string =>
  definitions.reduce(
    (current, item) =>
      replaceToken(current, item.key, `:${mappedKey(item, sample, config)}`),
    expression,
  );

export const materializeUniversalNamedExpressions = (
  definitions: UniversalNamedExpression[],
  samples: number,
  config: UniversalConfig,
  inlineConstants: (expression: string) => string,
): FormulaDerivedExpressionDefinition[] => {
  const perSampleKeys = new Set(
    definitions
      .filter((item) => item.scope === UniversalNamedExpressionScope.PerSample)
      .map((item) => item.key),
  );
  return definitions.flatMap((item) => {
    if (item.scope === UniversalNamedExpressionScope.Global) {
      if (sampleTokenPattern.test(item.expression))
        throw new Error(
          `Global named expression “${item.key}” cannot use sample-scoped variables.`,
        );
      if ([...perSampleKeys].some((key) => item.expression.includes(`:${key}`)))
        throw new Error(
          `Global named expression “${item.key}” cannot depend on a per-sample expression.`,
        );
      return [
        {
          key: item.key,
          label: item.label,
          expression: inlineConstants(
            expandNamedExpressionReferences(
              item.expression,
              definitions,
              1,
              config,
            ),
          ),
          unit: null,
        },
      ];
    }
    return Array.from({ length: samples }, (_, index) => {
      const sample = index + 1;
      const references = expandNamedExpressionReferences(
        item.expression,
        definitions,
        sample,
        config,
      );
      return {
        key: mappedKey(item, sample, config),
        label: `${item.label} — Sample ${sample}`,
        expression: inlineConstants(
          expandUniversalSampleExpression(references, sample, config),
        ),
        unit: null,
      };
    });
  });
};

export const inlineUniversalNamedExpressions = (
  expression: string,
  definitions: UniversalNamedExpression[],
  sample: number,
  _config: UniversalConfig,
): string => {
  const byKey = new Map(definitions.map((item) => [item.key, item]));
  const resolving = new Set<string>();
  const resolved = new Map<string, string>();
  const resolve = (item: UniversalNamedExpression): string => {
    const cacheKey = `${sample}:${item.key}`;
    const cached = resolved.get(cacheKey);
    if (cached) return cached;
    if (resolving.has(item.key))
      throw new Error("Named expressions contain a circular dependency.");
    resolving.add(item.key);
    let value = item.expression;
    for (const candidate of definitions) {
      if (!value.includes(`:${candidate.key}`)) continue;
      if (!byKey.has(candidate.key)) continue;
      value = replaceToken(value, candidate.key, `(${resolve(candidate)})`);
    }
    resolving.delete(item.key);
    resolved.set(cacheKey, value);
    return value;
  };
  let output = expression;
  for (const item of definitions) {
    output = replaceToken(output, item.key, `(${resolve(item)})`);
  }
  return output;
};
