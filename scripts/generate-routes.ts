import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateSource, routeKind } from "./routes/model.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = path.join(root, "apps/web/src/pages");
const output = path.join(root, "apps/web/src/routes/generated.tsx");

async function discover(directory = pages, prefix = ""): Promise<string[]> {
  const files: string[] = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, item.name);
    if (item.isDirectory()) files.push(...await discover(path.join(directory, item.name), relative));
    else if (item.isFile() && routeKind(item.name)) files.push(relative);
  }
  return files.sort();
}

async function validateExports(files: readonly string[]): Promise<void> {
  for (const file of files) {
    const source = await readFile(path.join(pages, file), "utf8");
    if (!/\bexport\s+default\b|\bexport\s*\{[^}]*\bas\s+default\b[^}]*\}/s.test(source)) {
      throw new Error(`Route file needs a default export: ${file}`);
    }
    if (routeKind(file) === "page" && source.split("\n").length > 200) {
      throw new Error(`Page exceeds 200 lines: ${file}`);
    }
  }
}

async function run(): Promise<void> {
  const files = await discover();
  await validateExports(files);
  const source = generateSource(files);
  let previous = "";
  try { previous = await readFile(output, "utf8"); } catch { /* first generation */ }
  if (process.argv.includes("--check")) {
    if (previous !== source) throw new Error("Generated routes are stale; run bun run routes:generate");
    return;
  }
  if (previous !== source) {
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, source);
  }
}

run().catch((error: Error) => { console.error(error); process.exitCode = 1; });
