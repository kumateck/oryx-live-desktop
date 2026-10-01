import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import test from "node:test";
import { InputTypes } from "../apps/web/src/shared/forms/input-types.ts";

const source = resolve(import.meta.dirname, "../apps/web/src");

async function files(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory() ? files(join(directory, entry.name))
    : /\.(ts|tsx)$/.test(entry.name) ? [join(directory, entry.name)] : []));
  return nested.flat();
}

test("field type values are unique", () => {
  const values = Object.values(InputTypes);
  assert.equal(new Set(values).size, values.length);
});

test("forms name their field types through InputTypes, not bare strings", async () => {
  const literal = new RegExp(`\\btype: "(${Object.values(InputTypes).join("|")})"`);
  const offenders: string[] = [];
  for (const file of await files(source)) {
    const text = await readFile(file, "utf8");
    // Only files that declare form fields; other code may legitimately use the same words.
    if (!text.includes("WizardField") || file.endsWith("form-wizard-types.ts")) continue;
    const line = text.split("\n").findIndex((row) => literal.test(row));
    if (line >= 0) offenders.push(`${file.slice(source.length + 1)}:${line + 1}`);
  }
  assert.deepEqual(offenders, []);
});
