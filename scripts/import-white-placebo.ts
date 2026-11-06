import { readFile, writeFile } from "node:fs/promises";
import { object, parse, type Json } from "../deploy/customer-server/data.ts";

// Imports only the White Placebo paths, their owned schemas and the additive marker fields
// (isWhitePlacebo on materials, whitePlaceboPreparationId on requisitions). Everything else is kept.
const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Pass an absolute metadata-only OpenAPI export path.");
const source = object(parse(await readFile(sourcePath, "utf8")));
const target = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const destination = object(parse(await readFile(target, "utf8")));
const paths = object(destination.paths ?? null);
const sourcePaths = object(source.paths ?? null);
const sourceSchemas = object(object(source.components ?? null).schemas ?? null);
const schemas = object(object(destination.components ?? null).schemas ?? null);
const owned = "DOMAIN.Entities.Materials.WhitePlacebo.";
const seen = new Set<string>();
function collect(value: Json): void {
  if (Array.isArray(value)) { value.forEach(collect); return; }
  if (!value || typeof value !== "object") return;
  if (typeof value.$ref === "string" && value.$ref.startsWith("#/components/schemas/")) {
    const name = value.$ref.slice("#/components/schemas/".length);
    if (!seen.has(name) && (!(name in schemas) || name.startsWith(owned))) {
      seen.add(name);
      const schema = sourceSchemas[name];
      if (!schema) throw new Error(`Missing schema ${name}`);
      schemas[name] = schema;
      collect(schema);
    }
  }
  Object.values(value).forEach(collect);
}
const whitePlaceboPaths = Object.keys(sourcePaths).filter((path) => path === "/api/v1/white-placebo" || path.startsWith("/api/v1/white-placebo/"));
if (whitePlaceboPaths.length !== 6) throw new Error(`Expected 6 White Placebo paths, found ${whitePlaceboPaths.length}.`);
for (const path of whitePlaceboPaths) {
  const operation = object(sourcePaths[path] ?? null);
  for (const value of Object.values(operation)) {
    const parameters = object(value).parameters;
    if (Array.isArray(parameters)) for (const item of parameters) {
      const parameter = object(item);
      if (parameter.in === "header" && (parameter.name === "Module" || parameter.name === "SubModule") && !parameter.schema)
        parameter.schema = { type: "string" };
    }
  }
  collect(operation);
  paths[path] = operation;
}
const additive: Record<string, string> = {
  "DOMAIN.Entities.Materials.Material": "isWhitePlacebo",
  "DOMAIN.Entities.Materials.MaterialDto": "isWhitePlacebo",
  "DOMAIN.Entities.Materials.MaterialWithWarehouseStockDto": "isWhitePlacebo",
  "DOMAIN.Entities.Requisitions.RequisitionDto": "whitePlaceboPreparationId",
};
for (const [name, property] of Object.entries(additive)) {
  const value = object(object(sourceSchemas[name] ?? null).properties ?? null)[property];
  if (value === undefined) throw new Error(`Missing ${name}.${property} in the export.`);
  const properties = object(object(schemas[name] ?? null).properties ?? null);
  if (!(name in schemas)) throw new Error(`Missing ${name} in the contract.`);
  properties[property] = value;
}
await writeFile(target, JSON.stringify(destination, null, 2));
console.log("Imported White Placebo paths, owned schemas and the additive material/requisition markers.");
