import { readFile, writeFile } from "node:fs/promises";
import { object, parse, type Json } from "../deploy/customer-server/data.ts";

// Import only the additive report read field from a built metadata-only export.
const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Pass a metadata-only backend OpenAPI export.");
const source = object(parse(await readFile(sourcePath, "utf8")));
const path = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const destination = object(parse(await readFile(path, "utf8")));
const schemaName = "DOMAIN.Entities.Materials.Batch.MaterialBatchDto";
const sourceSchemas = object(object(source.components ?? null).schemas ?? null);
const field = object(object(object(sourceSchemas[schemaName] ?? null).properties ?? null).stockDepartments ?? null);
if (field.type !== "array" || object(field.items ?? null).$ref !== "#/components/schemas/SHARED.CollectionItemDto") throw new Error("Unexpected stock department contract");
const targetSchemas = object(object(destination.components ?? null).schemas ?? null);
object(object(targetSchemas[schemaName] ?? null).properties ?? null).stockDepartments = field;
const visited = new Set<string>();
const collect = (value: Json): void => {
  if (Array.isArray(value)) { value.forEach(collect); return; }
  if (value === null || typeof value !== "object") return;
  if (typeof value.$ref === "string" && value.$ref.startsWith("#/components/schemas/")) {
    const name = value.$ref.slice("#/components/schemas/".length);
    if (!name.startsWith("DOMAIN.Entities.Materials.Batch.MaterialStockReport") || visited.has(name)) return;
    visited.add(name);
    const schema = sourceSchemas[name];
    if (!schema) throw new Error(`Missing stock-report schema ${name}`);
    targetSchemas[name] = schema; collect(schema);
  }
  Object.values(value).forEach(collect);
};
const reportPath = "/api/v1/material/batches/stock-report";
const operation = object(object(source.paths ?? null)[reportPath] ?? null);
for (const value of Object.values(operation)) {
  const parameters = object(value).parameters;
  if (Array.isArray(parameters)) for (const value of parameters) {
    const parameter = object(value);
    if (parameter.in === "header" && ["Module", "SubModule"].includes(String(parameter.name)) && !parameter.schema) parameter.schema = { type: "string" };
  }
}
collect(operation);
object(destination.paths ?? null)[reportPath] = operation;
await writeFile(path, JSON.stringify(destination, null, 2));
console.log("Imported additive stock department metadata and the stock-count report read operation.");
