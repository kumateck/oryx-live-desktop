import { readFile, writeFile } from "node:fs/promises";
import { object, parse } from "../deploy/customer-server/data.ts";

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Pass a metadata-only backend OpenAPI export.");
const source = object(parse(await readFile(sourcePath, "utf8")));
const destinationPath = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const destination = object(parse(await readFile(destinationPath, "utf8")));
const operationPath = "/api/v1/material/batch/{batchId}/migration-details";
const operation = object(object(object(source.paths ?? null)[operationPath] ?? null).put ?? null);
for (const value of Array.isArray(operation.parameters) ? operation.parameters : []) {
  const parameter = object(value);
  if (parameter.in === "header" && (parameter.name === "Module" || parameter.name === "SubModule") && !parameter.schema) {
    parameter.schema = { type: "string" };
  }
}
const sourceSchemas = object(object(source.components ?? null).schemas ?? null);
const targetSchemas = object(object(destination.components ?? null).schemas ?? null);
const batch = "DOMAIN.Entities.Materials.Batch.";
const correction = batch + "UpdateMigrationBatchDetails";
const schema = object(sourceSchemas[correction] ?? null);
const fields = object(schema.properties ?? null);
const nullableFields = ["manufacturingDate", "expiryDate", "grnNumber", "expectedManufacturingDate", "expectedExpiryDate", "expectedGrnNumber"];
for (const field of nullableFields) {
  if (object(fields[field] ?? null).nullable !== true) throw new Error(`Expected nullable correction field ${field}.`);
}
// JsonRequired requires the field to be present even when the value is null.
schema.required = [...nullableFields, "reason"];
targetSchemas[correction] = schema;
for (const [name, property] of [["MaterialBatchDto", "migrationGrnNumber"], ["MaterialStockReportRow", "grnNumber"]] as const) {
  const sourceProperties = object(object(sourceSchemas[batch + name] ?? null).properties ?? null);
  const field = object(sourceProperties[property] ?? null);
  if (field.type !== "string" || field.nullable !== true) throw new Error(`Unexpected contract for ${property}.`);
  object(object(targetSchemas[batch + name] ?? null).properties ?? null)[property] = field;
}
object(destination.paths ?? null)[operationPath] = { put: operation };
const json = JSON.stringify(destination, null, 2).replace(/[^\x00-\x7f]/g, (character) =>
  `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);
await writeFile(destinationPath, json);
console.log("Imported the migrated batch correction and the two GRN read fields.");
