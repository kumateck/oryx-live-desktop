import { readFile, writeFile } from "node:fs/promises";
import { object, parse, type Json } from "../deploy/customer-server/data.ts";

// Import only this feature from a built metadata-only backend export.
const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Pass the absolute path to a metadata-only backend OpenAPI export.");
const source = object(parse(await readFile(sourcePath, "utf8")));
const path = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const destination = object(parse(await readFile(path, "utf8")));
const sourceSchemas = object(object(source.components ?? null).schemas ?? null);
const schemas = object(object(destination.components ?? null).schemas ?? null);
const sourcePaths = object(source.paths ?? null);
const paths = object(destination.paths ?? null);
const repairPath = "/api/v1/production-schedule/{batchId}/issued-material-repair/{kind}";
const operation = object(sourcePaths[repairPath] ?? null);
const collected = new Set<string>();
const collect = (value: Json): void => {
  if (Array.isArray(value)) { value.forEach(collect); return; }
  if (!value || typeof value !== "object") return;
  if (typeof value.$ref === "string" && value.$ref.startsWith("#/components/schemas/")) {
    const name = value.$ref.slice("#/components/schemas/".length);
    if (!collected.has(name) && (!(name in schemas) || name.startsWith("DOMAIN.Entities.Products.Production.IssuedMaterialRepair")
      || name === "DOMAIN.Entities.Products.Production.ApplyIssuedMaterialRepairRequest")) {
      collected.add(name);
      const schema = sourceSchemas[name];
      if (!schema) throw new Error(`Missing backend schema ${name}`);
      schemas[name] = schema;
      collect(schema);
    }
  }
  Object.values(value).forEach(collect);
};
for (const value of Object.values(operation)) {
  const parameters = object(value).parameters;
  if (Array.isArray(parameters)) for (const entry of parameters) {
    const parameter = object(entry);
    if (parameter.in === "header" && (parameter.name === "Module" || parameter.name === "SubModule") && !parameter.schema)
      parameter.schema = { type: "string" };
  }
}
collect(operation);
paths[repairPath] = operation;
const stepPath = "/api/v1/production-schedule/activity-step/{productionStepId}/status";
object(object(object(paths[stepPath] ?? null).put ?? null).responses ?? null)["409"]
  = object(object(object(sourcePaths[stepPath] ?? null).put ?? null).responses ?? null)["409"] ?? { description: "Conflict" };
const itemName = "DOMAIN.Entities.Requisitions.RequisitionItemDto";
object(object(schemas[itemName] ?? null).properties ?? null).approvedQuantity = object(object(sourceSchemas[itemName] ?? null).properties ?? null).approvedQuantity ?? null;
await writeFile(path, JSON.stringify(destination, null, 2));
console.log("Imported the two post-issue repair operations and their owned schemas.");
