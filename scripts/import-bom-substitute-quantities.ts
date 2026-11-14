import { readFile, writeFile } from "node:fs/promises";
import { object, parse, type Json } from "../deploy/customer-server/data.ts";

// Import only BOM substitute quantities and the store's material choice on stock requisitions:
// the material-options read/choose operations, their owned schemas, and the optional properties below.
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

/** Optional properties added to existing schemas. */
export const bomSubstituteFields: Record<string, readonly string[]> = {
  "DOMAIN.Entities.BillOfMaterials.BillOfMaterialItemSubstitute": ["baseQuantity", "baseUoMId", "baseUoM", "prescribedQuantity"],
  "DOMAIN.Entities.BillOfMaterials.BillOfMaterialItemSubstituteDto": ["baseQuantity", "baseUoM", "prescribedQuantity"],
  "DOMAIN.Entities.BillOfMaterials.Request.CreateBoMItemsRequest": ["substitutes"],
  "DOMAIN.Entities.Requisitions.RequisitionItemDto": ["substituteFor"],
};
for (const [name, fields] of Object.entries(bomSubstituteFields)) {
  const from = object(object(sourceSchemas[name] ?? null).properties ?? null);
  const into = object(object(schemas[name] ?? null).properties ?? null);
  for (const field of fields) {
    const property = from[field];
    if (property === undefined) throw new Error(`Missing ${name}.${field}`);
    into[field] = property;
    collect(property);
  }
}

const path = "/api/v1/requisition/{requisitionId}/material-options";
const operation = object(object(source.paths ?? null)[path] ?? null);
if (!operation.get || !operation.post) throw new Error("Missing material-options read/choose operations.");
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
// Keep the contract's ASCII escapes so the import changes only what it adds.
await writeFile(target, JSON.stringify(destination, null, 2).replace(/[\u007f-\uffff]/g, (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`));
console.log("Imported BOM substitute quantities and stock-requisition material options.");
