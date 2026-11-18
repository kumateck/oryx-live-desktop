import { z } from "zod";
import { evaluationSettings } from "@/shared/formula/ui/types/evaluate/settings";
import { formulaTypeLabels, type FormulaType } from "@/shared/questions/question-types";

type Json = z.infer<ReturnType<typeof z.json>>;
const objectSchema = z.record(z.string(), z.json());

/** One setting of a formula, as the repair page compares it. */
export interface SettingRow { key: string; label: string; current: string; approved: string | null; changed: boolean }

type Format = "switch" | "yesNo" | "number" | "text" | "list" | "inputs" | "sampleInputs" | "map" | "expressions" | "type";
// Every setting the question editor offers, in the editor's order. Anything else a definition holds is listed after these.
const known: readonly (readonly [key: string, label: string, format: Format])[] = [
  ["type", "Formula type", "type"], ["expression", "Expression", "text"], ["mode", "Uniformity mode", "text"], ["sampleCount", "Uniformity samples", "number"],
  ["firstColumnPurpose", "First column", "text"], ["standardInput", "Standard inputs", "switch"], ["standardInTable", "Standard column in table", "yesNo"],
  ["sampleInput", "Sample inputs", "switch"], ["sampleInTable", "Samples in table", "yesNo"], ["formulaInTable", "Formula in table", "yesNo"],
  ["calculateAvgInTable", "Average in table", "yesNo"], ["calculateSdInTable", "SD in table", "yesNo"], ["calculateRsdInTable", "RSD in table", "yesNo"],
  ["percentageResults", "Percentage results", "yesNo"], ["averageAllResults", "Average all results", "yesNo"],
  ["decimalPlaces", "Decimal places", "number"], ["inputDecimalPlaces", "Input decimals", "number"],
  ["tableCalculationDecimalPlaces", "Table decimals", "number"], ["finalResultDecimalPlaces", "Result decimals", "number"],
  ["numberOfSamples", "Samples", "number"], ["numberOfReadings", "Readings", "number"], ["headers", "Column headers", "list"], ["rowHeaders", "Row headers", "list"],
  ["constants", "Constants", "map"], ["manualVarLabels", "Manual variables", "map"], ["manualVars", "Manual variable values", "map"],
  ["standardInputs", "Standard input fields", "inputs"], ["sampleInputs", "Sample input fields", "sampleInputs"],
  ["namedExpressionsEnabled", "Named expressions", "yesNo"], ["namedExpressions", "Named expression list", "expressions"],
  ["columnExpressions", "Column expressions", "map"], ["variables", "Variables", "map"], ["concentrationUnit", "Concentration unit", "text"],
  ["variableKeyFormat", "Variable key format", "text"],
];
// Aliases older definitions use for the same setting; the canonical key above is shown.
const aliases: Readonly<Record<string, string>> = { noOfSamples: "numberOfSamples", noOfReadings: "numberOfReadings", percent: "percentageResults" };
const hidden = new Set(["formulaLanguageVersion", "numericPolicyVersion"]);

const text = (value: Json | undefined): string => {
  if (value === undefined || value === null || value === "") return "Not set";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
};
const field = (value: Json): string => {
  const parsed = objectSchema.safeParse(value);
  if (!parsed.success) return text(value);
  const { label, key } = parsed.data;
  return typeof label === "string" && label.trim() && label !== key ? `${label} (${text(key)})` : text(key);
};

function format(value: Json | undefined, kind: Format): string {
  if (value === undefined || value === null) return kind === "switch" || kind === "yesNo" ? "Not set" : "Not set";
  switch (kind) {
    case "switch": return value === true ? "Enabled" : value === false ? "Disabled" : text(value);
    case "yesNo": return value === true ? "Yes" : value === false ? "No" : text(value);
    case "type": return typeof value === "number" && value in formulaTypeLabels ? formulaTypeLabels[value as FormulaType] : text(value);
    case "list": return Array.isArray(value) ? value.length ? value.map(text).join(", ") : "None" : text(value);
    case "inputs": return Array.isArray(value) ? value.length ? value.map(field).join(", ") : "None" : text(value);
    case "sampleInputs": return Array.isArray(value) ? value.length
      ? value.map((sample, index) => `Sample ${index + 1}: ${Array.isArray(sample) && sample.length ? sample.map(field).join(", ") : "none"}`).join("; ") : "None" : text(value);
    case "map": {
      const parsed = objectSchema.safeParse(value);
      if (!parsed.success) return text(value);
      const entries = Object.entries(parsed.data);
      return entries.length ? entries.map(([key, entry]) => {
        const inner = objectSchema.safeParse(entry);
        const shown = inner.success ? text(inner.data.value ?? inner.data.label ?? inner.data.expression ?? inner.data.raw) : text(entry);
        return shown && shown !== "Not set" ? `:${key} = ${shown}` : `:${key}`;
      }).join("; ") : "None";
    }
    case "expressions": return Array.isArray(value) ? value.length ? value.map((entry) => {
      const parsed = objectSchema.safeParse(entry);
      return parsed.success ? `${text(parsed.data.name)} = ${text(parsed.data.expression)}` : text(entry);
    }).join("; ") : "None" : text(value);
    default: return text(value);
  }
}

/** The effective settings of a stored formula definition, with the builder's nested settings merged in. */
export function formulaSettings(raw: string | null | undefined): Record<string, Json> | null {
  if (!raw) return null;
  const settings = evaluationSettings(raw);
  if (!settings) return null;
  const parsed = objectSchema.safeParse(JSON.parse(settings.settings));
  if (!parsed.success) return null;
  const merged: Record<string, Json> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    const canonical = aliases[key] ?? key;
    if (!hidden.has(canonical) && !(canonical in merged && aliases[key])) merged[canonical] = value;
  }
  return merged;
}

/**
 * Every setting of the formula a test uses now beside the approved revision's, so the person repairing sees exactly what
 * changes. Without an approved revision only the current settings are listed.
 */
export function compareFormulaSettings(current: string | null | undefined, approved: string | null | undefined): SettingRow[] {
  const now = formulaSettings(current) ?? {};
  const next = approved ? formulaSettings(approved) ?? {} : null;
  const keys = [...known.map(([key]) => key), ...[...new Set([...Object.keys(now), ...Object.keys(next ?? {})])].filter((key) => !known.some(([k]) => k === key)).sort()];
  return keys.flatMap((key) => {
    if (!(key in now) && !(next && key in next)) return [];
    const [, label, kind] = known.find(([k]) => k === key) ?? [key, key, "text" as const];
    const currentText = format(now[key], kind);
    const approvedText = next ? format(next[key], kind) : null;
    return [{ key, label, current: currentText, approved: approvedText, changed: approvedText !== null && approvedText !== currentText }];
  });
}
