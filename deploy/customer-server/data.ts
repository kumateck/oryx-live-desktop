import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, rm } from "node:fs/promises";
import { dirname } from "node:path";

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type ObjectValue = { [key: string]: Json };
export function object(value: Json): ObjectValue {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected a JSON object");
  return value;
}
export function string(value: Json | undefined): string {
  if (typeof value !== "string") throw new Error("Expected a string");
  return value;
}
export function integer(value: Json | undefined): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new Error("Expected a non-negative integer");
  return value;
}
export function nullableString(value: Json | undefined): string | null { return value === null ? null : string(value); }
export function parse(text: string): Json { const value: Json = JSON.parse(text); return value; }
export function sha256(bytes: string | Uint8Array): string { return createHash("sha256").update(bytes).digest("hex"); }
function sorted(value: Json): Json {
  if (Array.isArray(value)) return value.map(sorted);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sorted(value[key] ?? null)]));
}
export function contractDigest(value: Json): string { return sha256(JSON.stringify(sorted(value))); }
export function commit(value: string): string {
  if (!/^[0-9a-f]{40}$/.test(value)) throw new Error("Expected a full Git commit SHA");
  return value;
}
export async function readJson(path: string): Promise<Json> { return parse(await readFile(path, "utf8")); }
export async function exists(path: string): Promise<boolean> {
  try { const file = await open(path, "r"); await file.close(); return true; }
  catch (error) { if (error instanceof Error && "code" in error && error.code === "ENOENT") return false; throw error; }
}
export async function syncDirectory(path: string): Promise<void> {
  const directory = await open(path, "r");
  try { await directory.sync(); } finally { await directory.close(); }
}
export async function atomicWrite(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    const file = await open(temporary, "wx", 0o640);
    try { await file.writeFile(content); await file.sync(); } finally { await file.close(); }
    await rename(temporary, path); await syncDirectory(dirname(path));
  }
  finally { await rm(temporary, { force: true }); }
}
export function message(error: object | string): string { return error instanceof Error ? error.message : typeof error === "string" ? error : "Deployment failed"; }
