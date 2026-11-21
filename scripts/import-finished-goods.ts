// Import only the reviewed finished-goods additions and changed DTOs; retain other approved contracts.
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Contract, JsonSchema } from "./api-contract.ts";
const file = process.argv[2];
if (!file) throw new Error("Usage: bun scripts/import-finished-goods.ts EXPORT.json");
const target = resolve(import.meta.dirname, "../contracts/openapi/backend.v1.json");
const source: Contract = JSON.parse(await readFile(file, "utf8"));
const destination: Contract = JSON.parse(await readFile(target, "utf8"));
const roots = new Set(["FinishedGoodsTransferNoteDto", "ApprovedProductDto", "ApprovedProductStockDto", "AllocateProductionOrderDto", "ProductionOrderWaybillDto", "CreateProductionOrderWaybill", "AllocateProductionOrderRequest", "AllocateProductionOrderStatus", "CreateInvoice", "InvoiceDto", "ProformaInvoiceDto"]);
const copied = new Set<string>();
for (const [name, schema] of Object.entries(source.components.schemas)) {
  if (name.includes(".FinishedGoods.") || roots.has(name.split(".").at(-1) ?? "")) {
    destination.components.schemas[name] = schema; copied.add(name);
  }
}
for (const [path, item] of Object.entries(source.paths)) if (path.startsWith("/api/v1/finished-goods")) {
  for (const operation of Object.values(item)) for (const parameter of operation.parameters ?? []) {
    if ((parameter.name === "Module" || parameter.name === "SubModule") && !parameter.schema) parameter.schema = { type: "string" };
  }
  destination.paths[path] = item;
}
const references = (schema: JsonSchema): string[] => [schema.$ref?.split("/").at(-1) ?? "", ...Object.values(schema.properties ?? {}).flatMap(references),
  ...(schema.items ? references(schema.items) : []), ...[...(schema.allOf ?? []), ...(schema.oneOf ?? []), ...(schema.anyOf ?? [])].flatMap(references)].filter(Boolean);
let added = true;
while (added) {
  added = false;
  for (const schema of Object.values(destination.components.schemas)) for (const name of references(schema)) {
    if (!destination.components.schemas[name]) {
      const incoming = source.components.schemas[name]; if (!incoming) throw new Error(`Missing schema ${name}`);
      destination.components.schemas[name] = incoming; copied.add(name); added = true;
    }
  }
  for (const [path, item] of Object.entries(destination.paths)) if (path.startsWith("/api/v1/finished-goods")) {
    for (const operation of Object.values(item)) for (const body of [operation.requestBody, ...Object.values(operation.responses)]) {
      for (const media of Object.values(body?.content ?? {})) if (media.schema) for (const name of references(media.schema)) {
        if (!destination.components.schemas[name]) {
          const incoming = source.components.schemas[name]; if (!incoming) throw new Error(`Missing schema ${name}`);
          destination.components.schemas[name] = incoming; added = true;
        }
      }
    }
  }
}
await writeFile(target, `${JSON.stringify(destination, null, 2)}\n`);
console.log(`Imported finished-goods contract (${copied.size} schemas).`);
