import { readFile, writeFile } from "node:fs/promises";
import { object, parse, type Json } from "../deploy/customer-server/data.ts";

// Import only the draft material-link operations and their owned schemas.
const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Pass an absolute metadata-only OpenAPI export path.");
const source = object(parse(await readFile(sourcePath, "utf8")));
const target = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const destination = object(parse(await readFile(target, "utf8")));
const schemas = object(object(destination.components ?? null).schemas ?? null);
const sourceSchemas = object(object(source.components ?? null).schemas ?? null);
function collect(value: Json): void {
  if (Array.isArray(value)) { value.forEach(collect); return; }
  if (!value || typeof value !== "object") return;
  if (typeof value.$ref === "string" && value.$ref.startsWith("#/components/schemas/")) {
    const name = value.$ref.slice("#/components/schemas/".length);
    if (!(name in schemas)) {
      const schema = sourceSchemas[name];
      if (!schema) throw new Error(`Missing schema ${name}`);
      schemas[name] = schema;
      collect(schema);
    }
  }
  Object.values(value).forEach(collect);
}
const path = "/api/v1/stock-migrations/{id}/material-links/{kind}";
const operation = object(object(source.paths ?? null)[path] ?? null);
if (!operation.get || !operation.post) throw new Error("Missing material-link preview/create operations.");
for (const value of Object.values(operation)) {
  const parameters = object(value).parameters;
  if (Array.isArray(parameters)) for (const item of parameters) {
    const parameter = object(item);
    if (parameter.in === "header" && (parameter.name === "Module" || parameter.name === "SubModule") && !parameter.schema)
      parameter.schema = { type: "string" };
  }
}
collect(operation);
object(destination.paths ?? null)[path] = operation;
await writeFile(target, JSON.stringify(destination, null, 2));
console.log("Imported draft material-link preview/create contract.");
