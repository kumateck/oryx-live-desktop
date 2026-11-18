import { readFile, writeFile } from "node:fs/promises";
import { object, parse } from "../deploy/customer-server/data.ts";

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Pass a metadata-only backend OpenAPI export.");
const source = object(object(object(parse(await readFile(sourcePath, "utf8"))).components ?? null).schemas ?? null);
const target = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const document = object(parse(await readFile(target, "utf8")));
const schemas = object(object(document.components ?? null).schemas ?? null);
const additions = {
  "DOMAIN.Entities.Materials.Material": ["densityGramsPerMilliliter"],
  "DOMAIN.Entities.Materials.MaterialDto": ["densityGramsPerMilliliter"],
  "DOMAIN.Entities.Materials.MaterialWithWarehouseStockDto": ["densityGramsPerMilliliter"],
  "DOMAIN.Entities.Materials.Batch.MaterialBatchReservedQuantity": ["densityGramsPerMilliliter"],
  "DOMAIN.Entities.Materials.Batch.BatchToSupply": ["sourceQuantityToTake"],
  "DOMAIN.Entities.Materials.HoldingMaterialTransferBatchDto": ["destinationQuantity", "destinationUoM", "receivedAt"],
};
for (const [name, fields] of Object.entries(additions)) {
  const properties = object(object(schemas[name] ?? null).properties ?? null);
  const exported = object(object(source[name] ?? null).properties ?? null);
  for (const field of fields) {
    if (!exported[field]) throw new Error(`Missing ${name}.${field}`);
    properties[field] = exported[field];
  }
}
await writeFile(target, JSON.stringify(document, null, 2));
