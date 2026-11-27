import { readFile, writeFile } from "node:fs/promises";
import { object, parse } from "../deploy/customer-server/data.ts";

// COA reported tests (2026-11-27). Imports only the GET/PUT product specification coa-reporting path, its four owned
// DOMAIN.Entities.Forms schemas, `reportOnCoa` on template fields and their create/update requests, and
// `coaHiddenFieldIds` on the response detail.
const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Pass a metadata-only backend OpenAPI export.");
const source = object(parse(await readFile(sourcePath, "utf8")));
const target = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const document = object(parse(await readFile(target, "utf8")));
const schemas = object(object(document.components ?? null).schemas ?? null);
const sourceSchemas = object(object(source.components ?? null).schemas ?? null);
const paths = object(document.paths ?? null);
const sourcePaths = object(source.paths ?? null);
export const coaReportingPaths = ["/api/v1/product-specifications/{id}/coa-reporting/{analysisType}"];
export const coaReportingSchemas = ["CoaReportingFieldDto", "CoaReportingOverrideRequest", "SaveCoaReportingRequest", "SpecificationCoaReportingDto"]
  .map((name) => `DOMAIN.Entities.Forms.${name}`);
for (const path of coaReportingPaths) {
  if (!sourcePaths[path]) throw new Error(`Missing ${path}`);
  paths[path] = sourcePaths[path];
  // The same audit-header typing scripts/export-openapi.ts applies.
  for (const operation of Object.values(object(paths[path] ?? null)))
    for (const parameter of (object(operation).parameters as { in?: string; name?: string; schema?: object }[] | undefined) ?? [])
      if (parameter.in === "header" && (parameter.name === "Module" || parameter.name === "SubModule") && !parameter.schema) parameter.schema = { type: "string" };
}
for (const name of coaReportingSchemas) {
  if (!sourceSchemas[name]) throw new Error(`Missing ${name}`);
  schemas[name] = sourceSchemas[name];
}
const fields: [string, string][] = [
  ["DOMAIN.Entities.Forms.FormFieldDto", "reportOnCoa"],
  ["DOMAIN.Entities.Forms.Request.CreateFormFieldRequest", "reportOnCoa"],
  ["DOMAIN.Entities.Forms.Request.UpdateFormFieldRequest", "reportOnCoa"],
  ["DOMAIN.Entities.Forms.ResponseDetailDto", "coaHiddenFieldIds"],
];
for (const [schema, field] of fields) {
  const incoming = object(object(sourceSchemas[schema] ?? null).properties ?? null)[field];
  if (!incoming) throw new Error(`Missing ${schema}.${field}`);
  object(object(schemas[schema] ?? null).properties ?? null)[field] = incoming;
}
await writeFile(target, JSON.stringify(document, null, 2));
