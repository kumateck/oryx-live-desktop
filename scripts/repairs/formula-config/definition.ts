import { createHash } from "node:crypto";

/** A formula definition (or a stored answer) is JSON, sometimes wrapped in up to three layers of JSON strings. */
type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

export type PatchOperation =
  | { op: "replace"; value: Json }
  | { op: "set"; path: readonly (string | number)[]; value: Json }
  | { op: "remove"; path: readonly (string | number)[] }
  | { op: "renameVariable"; from: string; to: string }
  | { op: "padArray"; path: readonly (string | number)[]; length: number; fill: Json };

export const sha256 = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");

const isObject = (value: Json | undefined): value is JsonObject => value !== null && typeof value === "object" && !Array.isArray(value);
const envelopeKeys = ["schema", "data", "value", "settings", "formula"] as const;

function unwrap(raw: string): { value: Json; layers: number } {
  let value = JSON.parse(raw) as Json;
  let layers = 0;
  while (typeof value === "string" && layers < 3) { value = JSON.parse(value) as Json; layers += 1; }
  return { value, layers };
}

const wrap = (value: Json, layers: number): string => {
  let text = JSON.stringify(value);
  for (let index = 0; index < layers; index += 1) text = JSON.stringify(text);
  return text;
};

const isPayload = (value: Json | undefined) => isObject(value) && (typeof value.expression === "string" || typeof value.mode === "string");
/** Settings written back as the string they were read from: JSON text, string-wrapped `layers` more times. */
const asString = (settings: JsonObject, layers: number): string => layers === 0 ? JSON.stringify(settings) : wrap(JSON.stringify(settings), layers - 1);
/** A JSON object written as a string, or null when the text is not one. */
const parsedObject = (text: string): { value: JsonObject; layers: number } | null => {
  try { const inner = unwrap(text); return isObject(inner.value) ? { value: inner.value, layers: inner.layers } : null; }
  catch { return null; }
};

interface Layers { settings: JsonObject; rebuild: (settings: JsonObject) => string; outerLayers: number }

/**
 * Finds the object holding the formula settings and a way to write it back with every layer of wrapping kept.
 * Layers seen in stored definitions: JSON-string wrapping, an envelope key (`settings`, `formula`, ...), and the
 * older layout `{"type": 2, "expression": "<settings as JSON>"}` where the real settings sit inside `expression`.
 */
function decodeDefinition(raw: string): Layers {
  const { value: root, layers: outerLayers } = unwrap(raw);
  if (!isObject(root)) throw new Error("The stored definition is not a JSON object");
  let holder: { settings: JsonObject; put: (settings: JsonObject) => JsonObject } | null = isPayload(root) ? { settings: root, put: (settings) => settings } : null;
  for (const key of envelopeKeys) {
    if (holder) break;
    const candidate = root[key];
    if (isPayload(candidate) && isObject(candidate)) holder = { settings: candidate, put: (settings) => ({ ...root, [key]: settings }) };
    else if (typeof candidate === "string") {
      const inner = parsedObject(candidate);
      if (inner && isPayload(inner.value)) holder = { settings: inner.value, put: (settings) => ({ ...root, [key]: asString(settings, inner.layers) }) };
    }
  }
  if (!holder) throw new Error("The stored definition has no formula settings (no expression or mode)");
  const outer = holder;
  const nested = typeof outer.settings.expression === "string" ? parsedObject(outer.settings.expression) : null;
  if (nested && isPayload(nested.value)) {
    return { settings: nested.value, outerLayers, rebuild: (settings) =>
      wrap(outer.put({ ...outer.settings, expression: asString(settings, nested.layers) }), outerLayers) };
  }
  return { settings: outer.settings, outerLayers, rebuild: (settings) => wrap(outer.put(settings), outerLayers) };
}

/** The formula settings object inside a stored definition. */
export function definitionPayload(raw: string): JsonObject {
  return decodeDefinition(raw).settings;
}

function setAt(target: Json, path: readonly (string | number)[], value: Json | undefined): Json {
  if (path.length === 0) { if (value === undefined) throw new Error("Cannot remove the whole payload"); return value; }
  const [head, ...rest] = path;
  if (typeof head === "number") {
    if (!Array.isArray(target)) throw new Error(`Path step ${head} needs an array`);
    if (!Number.isInteger(head) || head < 0 || head > target.length) throw new Error(`Index ${head} is out of range`);
    const copy = [...target];
    if (rest.length === 0 && value === undefined) copy.splice(head, 1);
    else copy[head] = setAt(copy[head] ?? null, rest, value);
    return copy;
  }
  if (head === undefined || head === "__proto__" || head === "constructor" || head === "prototype") throw new Error("Invalid path step");
  if (!isObject(target)) throw new Error(`Path step "${head}" needs an object`);
  const copy: JsonObject = { ...target };
  if (rest.length === 0 && value === undefined) delete copy[head];
  else copy[head] = setAt(copy[head] ?? (typeof rest[0] === "number" ? [] : {}), rest, value);
  return copy;
}

function getAt(target: Json, path: readonly (string | number)[]): Json | undefined {
  let current: Json | undefined = target;
  for (const step of path) {
    if (typeof step === "number") current = Array.isArray(current) ? current[step] : undefined;
    else current = isObject(current) ? current[step] : undefined;
  }
  return current;
}

const variablePattern = /^[A-Za-z][A-Za-z0-9_.]{0,99}$/;
/** Renames `:from` tokens in every string, and `from` keys of manual-variable maps. */
function renameVariable(value: Json, from: string, to: string, parentKey: string | null): Json {
  if (typeof value === "string") return value.replace(new RegExp(`:${from.replaceAll(".", "\\.")}(?![A-Za-z0-9_.])`, "g"), `:${to}`);
  if (Array.isArray(value)) return value.map((item) => renameVariable(item, from, to, null));
  if (!isObject(value)) return value;
  const renameKeys = parentKey === "manualVars" || parentKey === "manualVarLabels";
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [renameKeys && key === from ? to : key, renameVariable(item, from, to, key)]));
}

export function applyOperations(payload: Json, operations: readonly PatchOperation[]): Json {
  return operations.reduce<Json>((current, operation) => {
    switch (operation.op) {
      case "replace":
        if (!isObject(operation.value)) throw new Error("replace needs the whole settings object");
        return operation.value;
      case "set": return setAt(current, operation.path, operation.value);
      case "remove":
        if (getAt(current, operation.path) === undefined) throw new Error(`Nothing to remove at ${JSON.stringify(operation.path)}`);
        return setAt(current, operation.path, undefined);
      case "renameVariable": {
        if (!variablePattern.test(operation.from) || !variablePattern.test(operation.to)) throw new Error("Variable names must be plain identifiers");
        const before = JSON.stringify(current);
        const after = renameVariable(current, operation.from, operation.to, null);
        if (JSON.stringify(after) === before) throw new Error(`Variable :${operation.from} was not found`);
        return after;
      }
      case "padArray": {
        const existing = getAt(current, operation.path);
        const items = Array.isArray(existing) ? [...existing] : [];
        if (existing !== undefined && !Array.isArray(existing)) throw new Error(`${JSON.stringify(operation.path)} is not an array`);
        if (!Number.isInteger(operation.length) || operation.length < 1 || operation.length > 500) throw new Error("padArray length must be 1–500");
        while (items.length < operation.length) items.push(operation.fill);
        return setAt(current, operation.path, items);
      }
    }
  }, payload);
}

/**
 * Applies operations to the formula settings and re-encodes the definition with its original wrapping.
 * `replace` swaps the whole stored definition (keeping only the outer string wrapping), so it can also move a
 * definition out of an old nested layout; the other operations change the innermost settings.
 */
export function patchDefinition(raw: string, operations: readonly PatchOperation[]): string {
  let current = raw;
  for (const operation of operations) {
    const decoded = decodeDefinition(current);
    if (operation.op === "replace") {
      if (!isPayload(operation.value)) throw new Error("The patched settings lost their expression or mode");
      current = wrap(operation.value, decoded.outerLayers);
      continue;
    }
    const patched = applyOperations(decoded.settings, [operation]);
    if (!isPayload(patched) || !isObject(patched)) throw new Error("The patched settings lost their expression or mode");
    current = decoded.rebuild(patched);
  }
  decodeDefinition(current);
  return current;
}

/** Applies operations to a stored answer, keeping its wrapping. */
export function patchAnswer(raw: string, operations: readonly PatchOperation[]): string {
  const { value, layers } = unwrap(raw);
  if (!isObject(value)) throw new Error("The stored answer is not a JSON object");
  return wrap(applyOperations(value, operations), layers);
}

/** The settings that decide whether the app can count an answer as complete. */
export function definitionSummary(raw: string): Record<string, Json | undefined> {
  const payload = definitionPayload(raw);
  const pick = (keys: readonly string[]) => Object.fromEntries(keys.filter((key) => key in payload).map((key) => [key, payload[key]]));
  const expressions = [payload.expression, ...(Array.isArray(payload.namedExpressions) ? payload.namedExpressions.map((item) => isObject(item) ? item.expression : null) : [])]
    .filter((item): item is string => typeof item === "string");
  const variables = [...new Set(expressions.flatMap((expression) => [...expression.matchAll(/:([A-Za-z0-9_.]+)/g)].map((match) => match[1] ?? "")))];
  return { ...pick(["type", "mode", "sampleCount", "decimalPlaces", "percent", "nominal", "expression", "numberOfReadings", "headers", "standardInputs", "sampleInputs", "manualVars", "manualVarLabels", "constants", "standardInTable"]), variables };
}
