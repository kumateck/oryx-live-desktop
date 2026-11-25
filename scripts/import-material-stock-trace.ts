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
const seen = new Set<string>();
function collect(value: Json): void {
  if (Array.isArray(value)) { value.forEach(collect); return; }
  if (!value || typeof value !== "object") return;
  if (typeof value.$ref === "string" && value.$ref.startsWith("#/components/schemas/")) {
    const name = value.$ref.slice("#/components/schemas/".length);
    if (!seen.has(name)) {
      if (!name.startsWith("DOMAIN.Entities.Materials.Batch.MaterialStockTrace")) {
        if (name in schemas) return;
        throw new Error(`Unreviewed schema ${name}`);
      }
      if (!sourceSchemas[name]) throw new Error(`Missing schema ${name}`);
      seen.add(name); schemas[name] = sourceSchemas[name]; collect(schemas[name]);
    }
  }
  Object.values(value).forEach(collect);
}
for (const kind of ["raw", "packaging"]) for (const suffix of ["", "/print"]) {
  const path = `/api/v1/material-stock-trace/${kind}/{materialId}${suffix}`;
  const operation = object(object(source.paths ?? null)[path] ?? null);
  if (!operation.get) throw new Error(`Missing ${path}`);
  const parameters = object(operation.get).parameters;
  if (Array.isArray(parameters)) for (const value of parameters) {
    const parameter = object(value);
    if (parameter.in === "header" && (parameter.name === "Module" || parameter.name === "SubModule") && !parameter.schema) parameter.schema = { type: "string" };
  }
  collect(operation); paths[path] = operation;
}
await writeFile(target, JSON.stringify(document, null, 2) + "\n");
