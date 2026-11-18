import { readFile, writeFile } from "node:fs/promises";
import { object, parse, type Json } from "../deploy/customer-server/data.ts";

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Pass an absolute metadata-only OpenAPI export path.");
const source = object(parse(await readFile(sourcePath, "utf8")));
const target = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const destination = object(parse(await readFile(target, "utf8")));
const paths = object(destination.paths ?? null);
const sourcePaths = object(source.paths ?? null);
const schemas = object(object(destination.components ?? null).schemas ?? null);
const sourceSchemas = object(object(source.components ?? null).schemas ?? null);
const seen = new Set<string>();
function collect(value: Json): void {
  if (Array.isArray(value)) { value.forEach(collect); return; }
  if (!value || typeof value !== "object") return;
  if (typeof value.$ref === "string" && value.$ref.startsWith("#/components/schemas/")) {
    const name = value.$ref.slice("#/components/schemas/".length);
    if (!seen.has(name) && (!(name in schemas) || /TemplateRepair|TestFieldReassignment|ReassignTestFields/.test(name))) {
      seen.add(name);
      const schema = sourceSchemas[name];
      if (!schema) throw new Error(`Missing schema ${name}`);
      schemas[name] = schema; collect(schema);
    }
  }
  Object.values(value).forEach(collect);
}
for (const [path, operation] of Object.entries(sourcePaths)) {
  if (!path.startsWith("/api/v1/template-repairs/") && !path.startsWith("/api/v1/test-field-reassignments/")) continue;
  for (const method of Object.values(object(operation))) {
    const parameters = object(method).parameters;
    if (Array.isArray(parameters)) for (const item of parameters) {
      const parameter = object(item);
      if (parameter.in === "header" && (parameter.name === "Module" || parameter.name === "SubModule") && !parameter.schema)
        parameter.schema = { type: "string" };
    }
  }
  collect(operation); paths[path] = operation;
}

// Read-only provenance fields used by the same QC certificate views.
for (const [name, additions] of Object.entries({
  "DOMAIN.Entities.AnalyticalTestRequests.AnalyticalTestRequestDto": ["testedAt", "testedBy"],
  "DOMAIN.Entities.Forms.ResponseDetailDto": ["approvedBy", "approvedAt"],
})) {
  const properties = object(object(schemas[name] ?? null).properties ?? null);
  const sourceProperties = object(object(sourceSchemas[name] ?? null).properties ?? null);
  for (const property of additions) {
    const value = sourceProperties[property];
    if (!value) throw new Error(`Missing ${name}.${property}`);
    properties[property] = value;
    collect(value);
  }
}
for (const name of ["DOMAIN.Entities.Products.CreateProductPackageSubstituteRequest"]) {
  if (!sourceSchemas[name]) throw new Error(`Missing ${name}`);
  schemas[name] = sourceSchemas[name]; collect(schemas[name]);
}
for (const [name, additions] of Object.entries({
  "DOMAIN.Entities.Products.CreateProductPackageRequest": ["substitutes"],
  "DOMAIN.Entities.Products.ProductPackageSubstituteDto": ["prescribedQuantity"],
})) {
  const properties = object(object(schemas[name] ?? null).properties ?? null);
  const sourceProperties = object(object(sourceSchemas[name] ?? null).properties ?? null);
  for (const property of additions) { if (!sourceProperties[property]) throw new Error(`Missing ${name}.${property}`); properties[property] = sourceProperties[property]; collect(sourceProperties[property]); }
}
await writeFile(target, JSON.stringify(destination, null, 2));
