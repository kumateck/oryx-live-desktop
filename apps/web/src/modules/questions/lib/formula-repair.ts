import { z } from "zod";

type Json = z.infer<ReturnType<typeof z.json>>;
type JsonObject = { [key: string]: Json };
const object = (value: Json | undefined): value is JsonObject => value !== null && typeof value === "object" && !Array.isArray(value);
const read = (raw: string): Json => z.json().parse(JSON.parse(raw));
interface Definition { payload: JsonObject; write: (payload: JsonObject) => string }

function decode(value: Json, depth = 0): Definition {
  if (depth > 6) throw new Error("This formula has too many nested settings layers.");
  if (typeof value === "string") {
    const nested = decode(read(value), depth + 1);
    return { payload: nested.payload, write: (payload) => JSON.stringify(nested.write(payload)) };
  }
  if (!object(value)) throw new Error("Formula settings are unavailable.");
  if (typeof value.expression === "string" && value.expression.trimStart().startsWith("{")) {
    const nested = decode(read(value.expression), depth + 1);
    return { payload: nested.payload, write: (payload) => JSON.stringify({ ...value, expression: nested.write(payload) }) };
  }
  if (typeof value.expression === "string" || typeof value.mode === "string") return { payload: value, write: JSON.stringify };
  for (const key of ["settings", "formula", "schema", "data", "value"]) {
    const inner = value[key];
    if (!inner) continue;
    const nested = decode(inner, depth + 1);
    return { payload: nested.payload, write: (payload) => JSON.stringify({ ...value, [key]: typeof inner === "string" ? nested.write(payload) : read(nested.write(payload)) }) };
  }
  throw new Error("Formula settings are unavailable.");
}

export function formulaRepairDefaults(raw: string) {
  const { payload } = decode(read(raw));
  const labels = object(payload.manualVarLabels) ? Object.fromEntries(Object.entries(payload.manualVarLabels).flatMap(([key, value]) => typeof value === "string" ? [[key, value]] : [])) : {};
  return { expression: typeof payload.expression === "string" ? payload.expression : "", labels };
}

export function manualRepairVariables(raw: string, expression: string): string[] {
  const { payload } = decode(read(raw));
  if (Number(payload.type ?? 0) !== 3) return [];
  const constants = object(payload.constants) ? payload.constants : {};
  return [...new Set([...expression.matchAll(/:([A-Za-z][A-Za-z0-9_.]*)/g)].flatMap(match => match[1] ? [match[1]] : []))]
    .filter(key => !(key in constants) && !/^(standard|sample\d*)(Avg|SD|RSD)$/.test(key)
      && !/^(standardInput|sampleInput\d*)\./.test(key) && !/^R\d+(standard|sample\d*)$/.test(key));
}

export function repairedFormulaDefinition(raw: string, expression: string, labels: Readonly<Record<string, string>>): string {
  const { payload, write } = decode(read(raw));
  const manualKeys = manualRepairVariables(raw, expression);
  return write({ ...payload, expression: expression.trim(), ...(Number(payload.type ?? 0) === 3
    ? { manualVarLabels: Object.fromEntries(manualKeys.map(key => [key, labels[key]?.trim() || key])) } : {}) });
}

