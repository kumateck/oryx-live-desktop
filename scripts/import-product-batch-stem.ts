import { readFile, writeFile } from "node:fs/promises";
import { object, parse } from "../deploy/customer-server/data.ts";

const exportPath = process.argv[2];
if (!exportPath) throw new Error("Pass a metadata-only backend OpenAPI export.");
const contractPath = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const source = object(parse(await readFile(exportPath, "utf8")));
const contract = object(parse(await readFile(contractPath, "utf8")));
const sourceSchemas = object(object(source.components ?? null).schemas ?? null);
const targetSchemas = object(object(contract.components ?? null).schemas ?? null);

for (const dto of ["Product", "ProductDto", "ProductListDto", "CreateProductRequest", "UpdateProductRequest"]) {
  const name = `DOMAIN.Entities.Products.${dto}`;
  const sourceFields = object(object(sourceSchemas[name] ?? null).properties ?? null);
  const stem = object(sourceFields.batchStem ?? null);
  if (stem.type !== "string" || stem.nullable !== true) throw new Error(`Unexpected batch stem on ${name}.`);
  object(object(targetSchemas[name] ?? null).properties ?? null).batchStem = stem;
}

const json = JSON.stringify(contract, null, 2).replace(/[^\x00-\x7f]/g, (character) =>
  `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);
await writeFile(contractPath, json);
console.log("Imported optional product batch stem fields.");
