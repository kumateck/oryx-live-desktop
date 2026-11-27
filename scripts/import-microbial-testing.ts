import { readFile, writeFile } from "node:fs/promises";
import { object, parse } from "../deploy/customer-server/data.ts";

// Microbial testing (2026-11-27). Imports only the six microbial question types (QuestionType 15–20), the GET/PUT
// microbial-limits paths on material and product specifications, and their owned DOMAIN.Entities.Forms schemas.
const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Pass a metadata-only backend OpenAPI export.");
const source = object(parse(await readFile(sourcePath, "utf8")));
const target = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const document = object(parse(await readFile(target, "utf8")));
const schemas = object(object(document.components ?? null).schemas ?? null);
const sourceSchemas = object(object(source.components ?? null).schemas ?? null);
const paths = object(document.paths ?? null);
const sourcePaths = object(source.paths ?? null);
export const microbialPaths = ["/api/v1/material-specifications/{id}/microbial-limits", "/api/v1/product-specifications/{id}/microbial-limits"];
export const microbialSchemas = ["MicrobialLimitDto", "MicrobialLimitFieldDto", "MicrobialLimitKind", "MicrobialLimitRequest", "SaveMicrobialLimitsRequest", "SpecificationMicrobialLimitsDto"]
  .map((name) => `DOMAIN.Entities.Forms.${name}`);
for (const path of microbialPaths) {
  if (!sourcePaths[path]) throw new Error(`Missing ${path}`);
  paths[path] = sourcePaths[path];
  // The same audit-header typing scripts/export-openapi.ts applies.
  for (const operation of Object.values(object(paths[path] ?? null)))
    for (const parameter of (object(operation).parameters as { in?: string; name?: string; schema?: object }[] | undefined) ?? [])
      if (parameter.in === "header" && (parameter.name === "Module" || parameter.name === "SubModule") && !parameter.schema) parameter.schema = { type: "string" };
}
for (const name of microbialSchemas) {
  if (!sourceSchemas[name]) throw new Error(`Missing ${name}`);
  schemas[name] = sourceSchemas[name];
}
const questionType = object(schemas["DOMAIN.Entities.Forms.QuestionType"] ?? null);
const incoming = object(sourceSchemas["DOMAIN.Entities.Forms.QuestionType"] ?? null);
if (!Array.isArray(incoming.enum) || !incoming.enum.includes(20)) throw new Error("The export has no microbial question types.");
questionType.enum = incoming.enum;
await writeFile(target, JSON.stringify(document, null, 2));
