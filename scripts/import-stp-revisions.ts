import { readFile, writeFile } from "node:fs/promises";
import { object, parse } from "../deploy/customer-server/data.ts";

// Structured STP revisions (2026-11-27). Imports only the /api/v1/stp-revisions operations and their
// DOMAIN.Entities.StpRevisions.* schemas; every existing operation and schema is kept as it is.
const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Pass a metadata-only backend OpenAPI export.");
const source = object(parse(await readFile(sourcePath, "utf8")));
const target = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const document = object(parse(await readFile(target, "utf8")));
const paths = object(document.paths ?? null);
const schemas = object(object(document.components ?? null).schemas ?? null);
const sourcePaths = object(source.paths ?? null);
const sourceSchemas = object(object(source.components ?? null).schemas ?? null);

const imported = Object.keys(sourcePaths).filter((path) => path.startsWith("/api/v1/stp-revisions"));
if (imported.length !== 8) throw new Error(`Expected 8 STP revision paths, found ${imported.length}.`);
for (const path of imported) {
  const item = object(sourcePaths[path] ?? null);
  // The audit headers are declared without a type, as in api:export: record them as strings.
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
if (owned.length !== 26) throw new Error(`Expected 26 STP revision schemas, found ${owned.length}.`);
for (const name of owned) {
  const schema = sourceSchemas[name];
  if (schema === undefined) throw new Error(`Missing ${name}`);
  schemas[name] = schema;
}
if (!schemas["DOMAIN.Entities.Reviews.DocumentReviewStatus"]) throw new Error("Missing DOMAIN.Entities.Reviews.DocumentReviewStatus.");

await writeFile(target, JSON.stringify(document, null, 2) + "\n");
