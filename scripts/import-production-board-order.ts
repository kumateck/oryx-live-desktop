import { readFile, writeFile } from "node:fs/promises";
import { object, parse, type Json } from "../deploy/customer-server/data.ts";

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Pass a metadata-only backend OpenAPI export.");
const source = object(parse(await readFile(sourcePath, "utf8")));
const target = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const document = object(parse(await readFile(target, "utf8")));
const schemas = object(object(document.components ?? null).schemas ?? null);
const sourceSchemas = object(object(source.components ?? null).schemas ?? null);
const owned = new Set(["ProductionBoardOrderDto", "ProductionBoardOperationDto", "SaveProductionBoardOrder"].map(name => `DOMAIN.Entities.Base.${name}`));
const seen = new Set<string>();
function collect(value: Json): void {
  if (Array.isArray(value)) { value.forEach(collect); return; }
  if (!value || typeof value !== "object") return;
  if (typeof value.$ref === "string" && value.$ref.startsWith("#/components/schemas/")) {
    const name = value.$ref.slice("#/components/schemas/".length);
    if (!owned.has(name)) throw new Error(`Unreviewed schema ${name}`);
    if (!seen.has(name)) {
      if (!sourceSchemas[name]) throw new Error(`Missing ${name}`);
      seen.add(name); schemas[name] = sourceSchemas[name]; collect(schemas[name]);
    }
  }
  Object.values(value).forEach(collect);
}
const path = "/api/v1/production-board-order/{departmentId}";
const operation = object(object(source.paths ?? null)[path] ?? null);
if (!operation.get || !operation.put) throw new Error("The board-order GET/PUT contract is missing.");
for (const method of [operation.get, operation.put]) {
  const parameters = object(method).parameters;
  if (Array.isArray(parameters)) for (const item of parameters) {
    const parameter = object(item);
    if (parameter.in === "header" && (parameter.name === "Module" || parameter.name === "SubModule") && !parameter.schema) parameter.schema = { type: "string" };
  }
}
collect(operation); object(document.paths ?? null)[path] = operation;
await writeFile(target, JSON.stringify(document, null, 2) + "\n");
