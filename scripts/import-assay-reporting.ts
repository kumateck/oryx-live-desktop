import { readFile, writeFile } from "node:fs/promises";
import { object, parse, type Json } from "../deploy/customer-server/data.ts";

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Pass a metadata-only backend OpenAPI export.");
const source = object(parse(await readFile(sourcePath, "utf8")));
const target = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const document = object(parse(await readFile(target, "utf8")));
const paths = object(document.paths ?? null);
const schemas = object(object(document.components ?? null).schemas ?? null);
const sourceSchemas = object(object(source.components ?? null).schemas ?? null);
const owned = /^DOMAIN\.Entities\.ProductSpecifications\.(?:Assay|SaveAssay)/;
const seen = new Set<string>();
function collect(value: Json): void {
  if (Array.isArray(value)) { value.forEach(collect); return; }
  if (!value || typeof value !== "object") return;
  if (typeof value.$ref === "string") {
    const name = value.$ref.replace("#/components/schemas/", "");
    if (!seen.has(name) && owned.test(name)) {
      seen.add(name);
      const schema = sourceSchemas[name];
      if (!schema) throw new Error(`Missing ${name}`);
      schemas[name] = schema; collect(schema);
    } else if (!(name in schemas)) throw new Error(`Unreviewed dependency ${name}`);
  }
  Object.values(value).forEach(collect);
}
const path = "/api/v1/product-specifications/{id}/assay-reporting";
const operations = object(object(source.paths ?? null)[path] ?? null);
if (!operations.get || !operations.put) throw new Error("Missing assay reporting operations.");
for (const operation of Object.values(operations)) {
  const parameters = object(operation).parameters;
  if (Array.isArray(parameters)) for (const value of parameters) {
    const parameter = object(value);
    if (parameter.in === "header" && (parameter.name === "Module" || parameter.name === "SubModule") && !parameter.schema)
      parameter.schema = { type: "string" };
  }
}
collect(operations); paths[path] = operations;
const name = "DOMAIN.Entities.Forms.FormResponseDto";
const properties = object(object(schemas[name] ?? null).properties ?? null);
const sourceProperties = object(object(sourceSchemas[name] ?? null).properties ?? null);
for (const property of ["coaReportedResults", "coaReportingError"]) {
  const value = sourceProperties[property];
  if (!value) throw new Error(`Missing ${name}.${property}`);
  collect(value); properties[property] = value;
}
await writeFile(target, JSON.stringify(document, null, 2) + "\n");
