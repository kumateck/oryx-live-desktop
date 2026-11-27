import { readFile, writeFile } from "node:fs/promises";
import { object, parse } from "../deploy/customer-server/data.ts";

// STP step 4 (2026-11-27): the revision's Word file and print reads, the optional approvedFileSha256 on the revision,
// and /api/v1/stp-test-links (specification tests citing STP tests). Replaces only STP revision paths and schemas.
const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Pass a metadata-only backend OpenAPI export.");
const source = object(parse(await readFile(sourcePath, "utf8")));
const target = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const document = object(parse(await readFile(target, "utf8")));
const paths = object(document.paths ?? null);
const schemas = object(object(document.components ?? null).schemas ?? null);
const sourcePaths = object(source.paths ?? null);
const sourceSchemas = object(object(source.components ?? null).schemas ?? null);

const imported = Object.keys(sourcePaths).filter((path) => path.startsWith("/api/v1/stp-revisions") || path.startsWith("/api/v1/stp-test-links"));
if (imported.length !== 14) throw new Error(`Expected 14 STP revision and link paths, found ${imported.length}.`);
for (const path of imported) {
  const item = object(sourcePaths[path] ?? null);
  for (const operation of Object.values(item)) {
    const parameters = object(operation ?? null).parameters;
    if (!Array.isArray(parameters)) continue;
    for (const parameter of parameters) {
      const header = object(parameter);
      if (header.in === "header" && (header.name === "Module" || header.name === "SubModule") && !header.schema) header.schema = { type: "string" };
    }
  }
  paths[path] = item;
}
const owned = Object.keys(sourceSchemas).filter((name) => name.startsWith("DOMAIN.Entities.StpRevisions."));
if (owned.length !== 30) throw new Error(`Expected 30 STP revision schemas, found ${owned.length}.`);
for (const name of owned) {
  const schema = sourceSchemas[name];
  if (schema === undefined) throw new Error(`Missing ${name}`);
  schemas[name] = schema;
}
await writeFile(target, JSON.stringify(document, null, 2) + "\n");
