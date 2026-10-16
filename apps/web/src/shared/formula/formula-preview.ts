import { FormulaType } from "@/shared/questions/question-types";

// Reads the type and main expression out of a formula question's stored definition. Stored definitions have been
// written by several generations of the builder, so this accepts nested JSON strings, wrapper objects and, as a last
// resort, a definition that is not quite JSON. Ported from Oryx Next's lib/formula-preview.ts.

export interface FormulaPreview { type: FormulaType; expression: string }
type JsonObject = { [key: string]: unknown };

const known = (value: number): value is FormulaType => value === FormulaType.Simple || value === FormulaType.Uniformity || value === FormulaType.Universal;
const asObject = (value: unknown): JsonObject | null => value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : null;
const text = (value: unknown) => typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";

function parseNested(raw: string): unknown {
  let parsed: unknown = raw;
  for (let depth = 0; depth < 3 && typeof parsed === "string"; depth += 1) {
    try { parsed = JSON.parse(parsed) as unknown; } catch { break; }
  }
  return parsed;
}
function unwrapExpression(value: string): string {
  let current = value.trim();
  for (let depth = 0; depth < 3 && current; depth += 1) {
    const nested = text(asObject(parseNested(current))?.expression);
    if (!nested) break;
    current = nested;
  }
  return current;
}
function decodeFragment(value: string): string {
  try { const decoded: unknown = JSON.parse(`"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`); return typeof decoded === "string" ? decoded : value; } catch { return value; }
}
function fieldFromRaw(raw: string, field: string): string {
  const patterns = [
    new RegExp(`"${field}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`, "s"),
    new RegExp(`\\\\"${field}\\\\"\\s*:\\s*\\\\"((?:\\\\\\\\.|[^"\\\\])*)\\\\"`, "s"),
    new RegExp(`(?:\\\\?")${field}(?:\\\\?")\\s*:\\s*(?:\\\\?")([\\s\\S]*?)(?:\\\\?")(?:\\s*,|\\s*\\})`, "s"),
  ];
  for (const candidate of [raw, raw.replace(/\\"/g, '"'), raw.replace(/\\"/g, '"').replace(/^"+/, "").replace(/"+$/, "")]) {
    for (const pattern of patterns) { const match = pattern.exec(candidate); if (match?.[1]) return decodeFragment(match[1]).trim(); }
  }
  return "";
}
function typeOf(candidates: readonly JsonObject[]): FormulaType {
  const stored = candidates.find((candidate) => candidate.type !== undefined && candidate.type !== null || candidate.formulaType !== undefined && candidate.formulaType !== null);
  const number = Number(stored?.type ?? stored?.formulaType);
  if (Number.isFinite(number) && known(number)) return number;
  return candidates.some((candidate) => candidate.mode === "capsule" || candidate.mode === "tablet" || candidate.mode === "tube") ? FormulaType.Uniformity : FormulaType.Simple;
}

export function formulaPreview(rawOption: string | null | undefined): FormulaPreview {
  const raw = (rawOption ?? "").trim();
  if (!raw) return { type: FormulaType.Simple, expression: "" };
  const root = asObject(parseNested(raw));
  const candidates = [root, asObject(root?.schema), asObject(root?.data), asObject(root?.value), asObject(root?.settings), asObject(root?.formula)].filter((entry): entry is JsonObject => entry !== null);
  if (candidates.length === 0) {
    const match = /"type"\s*:\s*"?(\d+)"?/.exec(raw);
    const number = Number(match?.[1]);
    return { type: Number.isFinite(number) && known(number) ? number : FormulaType.Simple, expression: unwrapExpression(fieldFromRaw(raw, "expression")) || raw };
  }
  const type = typeOf(candidates);
  const expression = unwrapExpression(text(candidates.find((candidate) => typeof candidate.expression === "string")?.expression)) || unwrapExpression(fieldFromRaw(raw, "expression"));
  return { type, expression };
}

/** A definition with its type written explicitly, so every reader agrees on it. */
export function normalizeFormulaSettings(rawOption: string | null | undefined): string {
  const raw = (rawOption ?? "").trim();
  const root = raw ? asObject(parseNested(raw)) : null;
  return root ? JSON.stringify({ ...root, type: formulaPreview(raw).type }) : raw;
}
export const isUniformityFormula = (rawOption: string | null | undefined) => formulaPreview(rawOption).type === FormulaType.Uniformity;
