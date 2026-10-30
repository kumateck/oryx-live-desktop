import { readFileSync } from "node:fs";
import type { PatchOperation } from "./definition.ts";

/**
 * One case of a badly configured formula question. The recipe names the exact stored definition it expects
 * (by hash) and the change to make, so it can never be applied to a definition someone has changed since.
 */
export interface Recipe {
  name: string;
  note: string;
  questionId: string;
  expectedDefinitionSha256: string;
  definition: PatchOperation[];
  /** Optional changes to saved answers of named open responses, e.g. a renamed manual variable. */
  answers: { responseIds: string[]; operations: PatchOperation[] } | null;
}

export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const hashPattern = /^[0-9a-f]{64}$/;
type Raw = Record<string, unknown>;
const object = (value: unknown, label: string): Raw => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value as Raw;
};
const text = (value: unknown, label: string, min = 1, max = 2000) => {
  if (typeof value !== "string" || value.trim().length < min || value.length > max) throw new Error(`${label} must be text of ${min}–${max} characters`);
  return value.trim();
};
const uuid = (value: unknown, label: string) => {
  if (typeof value !== "string" || !uuidPattern.test(value) || /^0{8}-/.test(value)) throw new Error(`${label} must be a non-empty UUID`);
  return value.toLowerCase();
};
const path = (value: unknown, label: string) => {
  if (!Array.isArray(value) || value.length === 0 || value.length > 10
    || !value.every((step) => typeof step === "string" && /^[A-Za-z0-9_]{1,100}$/.test(step) && !["__proto__", "constructor", "prototype"].includes(step)
      || Number.isInteger(step) && (step as number) >= 0)) {
    throw new Error(`${label} must be a list of 1–10 plain keys or indexes`);
  }
  return value as (string | number)[];
};

function operations(value: unknown, label: string): PatchOperation[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 50) throw new Error(`${label} must list 1–50 operations`);
  return value.map((item, index) => {
    const entry = object(item, `${label}[${index}]`);
    const where = `${label}[${index}]`;
    switch (entry.op) {
      case "replace":
        if (!entry.value || typeof entry.value !== "object" || Array.isArray(entry.value)) throw new Error(`${where}.value must be the whole settings object`);
        return { op: "replace", value: entry.value as never };
      case "set":
        if (!("value" in entry)) throw new Error(`${where}.value is required`);
        return { op: "set", path: path(entry.path, `${where}.path`), value: entry.value as never };
      case "remove": return { op: "remove", path: path(entry.path, `${where}.path`) };
      case "renameVariable": return { op: "renameVariable", from: text(entry.from, `${where}.from`, 1, 100), to: text(entry.to, `${where}.to`, 1, 100) };
      case "padArray":
        if (!Number.isInteger(entry.length)) throw new Error(`${where}.length must be an integer`);
        return { op: "padArray", path: path(entry.path, `${where}.path`), length: entry.length as number, fill: (entry.fill ?? "") as never };
      default: throw new Error(`${where}.op must be replace, set, remove, renameVariable or padArray`);
    }
  });
}

export function parseRecipe(json: string): Recipe {
  const raw = object(JSON.parse(json), "Recipe");
  const allowed = new Set(["name", "note", "questionId", "expectedDefinitionSha256", "definition", "answers"]);
  for (const key of Object.keys(raw)) if (!allowed.has(key)) throw new Error(`Unknown recipe field: ${key}`);
  const expected = text(raw.expectedDefinitionSha256, "expectedDefinitionSha256", 64, 64).toLowerCase();
  if (!hashPattern.test(expected)) throw new Error("expectedDefinitionSha256 must be a SHA-256 hex digest from `find`");
  let answers: Recipe["answers"] = null;
  if (raw.answers !== undefined && raw.answers !== null) {
    const entry = object(raw.answers, "answers");
    if (!Array.isArray(entry.responseIds) || entry.responseIds.length === 0 || entry.responseIds.length > 50) throw new Error("answers.responseIds must list 1–50 responses");
    const responseIds = entry.responseIds.map((id, index) => uuid(id, `answers.responseIds[${index}]`));
    if (new Set(responseIds).size !== responseIds.length) throw new Error("answers.responseIds has duplicates");
    answers = { responseIds, operations: operations(entry.operations, "answers.operations") };
  }
  return { name: text(raw.name, "name", 3, 200), note: text(raw.note, "note", 10), questionId: uuid(raw.questionId, "questionId"),
    expectedDefinitionSha256: expected, definition: operations(raw.definition, "definition"), answers };
}

export const loadRecipe = (file: string) => parseRecipe(readFileSync(file, "utf8"));
