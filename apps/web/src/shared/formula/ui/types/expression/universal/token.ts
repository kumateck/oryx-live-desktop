// Shared token processing logic for both ExpressionPanel and Evaluate.

import { headerToSlug } from "./hooks/useTable";
import { getSampleNumber, resolveBareSampleInput } from "./sample-input-token";
import { expandCanonicalSampleInputTokens } from "@/shared/formula/builder/universal-variable-keys";

const toNumericToken = (value: string | number | null | undefined) => {
  if (value === "" || value === null || value === undefined) return null;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? String(numeric) : null;
};

const canonicalTableVariableKey = (key: string): string | null => {
  const match = key.match(/^(standard|sample\d+)(avg|sd|rsd)$/i);
  if (!match) return null;
  const prefix = (match[1] ?? "").toLowerCase();
  const suffix = (match[2] ?? "").toLowerCase();
  const canonicalSuffix =
    suffix === "avg" ? "Avg" : suffix === "sd" ? "SD" : "RSD";
  return `${prefix}${canonicalSuffix}`;
};

const resolveInputAlias = (
  prefix: string,
  key: string,
  context: Parameters<typeof resolveToken>[1],
) => {
  const sampleNumber = getSampleNumber(context.headers, context.sampleIndex);
  const candidates =
    prefix === "spl" && sampleNumber !== null
      ? [`sampleInput${sampleNumber}.${key}`, `sampleInput.${key}`]
      : [`standardInput.${key}`];

  for (const candidate of candidates) {
    const value = context.inputVariables[candidate];
    const numeric = toNumericToken(value);
    if (numeric !== null) return numeric;
  }
  return null;
};

const resolveTableAlias = (
  prefix: string,
  key: string,
  context: Parameters<typeof resolveToken>[1],
) => {
  const rowIndex = key === "tit" || key === "titre" ? 0 : -1;
  const colIndex = prefix === "spl" ? context.sampleIndex : 0;
  if (
    rowIndex < 0 ||
    typeof colIndex !== "number" ||
    rowIndex >= context.data.length ||
    colIndex < 0 ||
    colIndex >= context.headers.length
  ) {
    return null;
  }
  return toNumericToken(context.data[rowIndex]?.[colIndex] ?? "");
};

/**
 * Resolves a single token (without leading colon) to a numeric string or leaves it unchanged.
 * Supports:
 *  - R{row}sample (auto sample column)
 *  - R{row}{slug} (new style)
 *  - R{row}_{slug} (legacy style)
 */
export function resolveToken(
  varName: string,
  context: {
    sampleIndex?: number | undefined; // current sample column index (absolute in headers)
    headers: string[];
    data: string[][];
    constants: Record<string, number>;
    inputVariables: Record<string, string | number>;
    tableVars: Record<string, number | null>;
    manualVars: Record<
      string,
      { label: string; raw: string; evaluated: number | null }
    >;
  },
): string {
  // Auto sample cell R{row}sample
  let m = varName.match(/^R(\d+)sample$/i);
  if (m && typeof context.sampleIndex === "number") {
    const rowIndex = Number(m[1]) - 1;
    const colIndex = context.sampleIndex;
    if (
      rowIndex >= 0 &&
      rowIndex < context.data.length &&
      colIndex >= 0 &&
      colIndex < context.headers.length
    ) {
      const raw = context.data[rowIndex]?.[colIndex] ?? "";
      if (raw !== "" && !isNaN(Number(raw))) return String(Number(raw));
    }
    return `:${varName}`;
  }

  // Explicit cell new style R{row}{slug}
  m = varName.match(/^R(\d+)([a-z0-9]+)$/i);
  if (m) {
    const rowIndex = Number(m[1]) - 1;
    const slug = (m[2] ?? "").toLowerCase();
    const colIndex = context.headers.findIndex((h) => headerToSlug(h) === slug);
    if (
      rowIndex >= 0 &&
      rowIndex < context.data.length &&
      colIndex >= 0 &&
      colIndex < context.headers.length
    ) {
      const raw = context.data[rowIndex]?.[colIndex] ?? "";
      if (raw !== "" && !isNaN(Number(raw))) return String(Number(raw));
    }
    return `:${varName}`;
  }

  // Legacy style R{row}_{slug}
  m = varName.match(/^R(\d+)_([a-z0-9_]+)$/i);
  if (m) {
    const rowIndex = Number(m[1]) - 1;
    const slug = (m[2] ?? "").toLowerCase();
    const colIndex = context.headers.findIndex((h) => headerToSlug(h) === slug);
    if (
      rowIndex >= 0 &&
      rowIndex < context.data.length &&
      colIndex >= 0 &&
      colIndex < context.headers.length
    ) {
      const raw = context.data[rowIndex]?.[colIndex] ?? "";
      if (raw !== "" && !isNaN(Number(raw))) return String(Number(raw));
    }
    return `:${varName}`;
  }

  // Constants
  if (varName in context.constants) {
    return String(context.constants[varName]);
  }

  // Input variables (standardInput.*, sampleInput*)
  if (varName in context.inputVariables) {
    const val = context.inputVariables[varName];
    if (val !== "") {
      return String(typeof val === "string" ? Number(val) : val);
    }
    return `:${varName}`;
  }

  // Legacy Universal formulas used :sampleInput when only one input existed.
  const bareSampleInput = resolveBareSampleInput(varName, context);
  if (bareSampleInput !== null) return bareSampleInput;

  // Table vars (averages, SD, RSD)
  const tableVariableKey =
    varName in context.tableVars ? varName : canonicalTableVariableKey(varName);
  if (tableVariableKey && tableVariableKey in context.tableVars) {
    const tv = context.tableVars[tableVariableKey];
    return tv !== null ? String(tv) : `:${varName}`;
  }

  // Manual vars with values win over aliases.
  if (varName in context.manualVars) {
    const mv = context.manualVars[varName];
    if (mv && mv.evaluated !== null) return String(mv.evaluated);
    if (mv && mv.raw !== "" && !isNaN(Number(mv.raw))) return String(Number(mv.raw));
  }

  // QC shorthand aliases: spl.* = current sample, blk/std.* = first column.
  const aliasMatch = varName.match(/^(spl|blk|std)\.?([A-Za-z0-9_]+)$/i);
  if (aliasMatch) {
    const prefix = (aliasMatch[1] ?? "").toLowerCase();
    const key = (aliasMatch[2] ?? "").toLowerCase();
    const inputAlias = resolveInputAlias(prefix, key, context);
    if (inputAlias !== null) return inputAlias;
    const tableAlias = resolveTableAlias(prefix, key, context);
    if (tableAlias !== null) return tableAlias;
  }

  if (varName in context.manualVars) return `:${varName}`;

  return `:${varName}`;
}

/**
 * Expands auto sample tokens in base expression for a given sample index.
 */
export function expandAutoSampleTemplates(
  expr: string,
  sampleNumber: number,
  inputKeys: string[] = [],
): string {
  // These tokens are generic; expand them to the one-based sample number.
  const expanded = expr
    .replace(/:sampleAvg\b/gi, `:sample${sampleNumber}Avg`)
    .replace(/:sampleSD\b/gi, `:sample${sampleNumber}SD`)
    .replace(/:sampleRSD\b/gi, `:sample${sampleNumber}RSD`)
    .replace(
      /:sampleInput\.([a-zA-Z0-9]+)\b/g,
      `:sampleInput${sampleNumber}.$1`,
    );
  return expandCanonicalSampleInputTokens(expanded, sampleNumber, inputKeys);
}
