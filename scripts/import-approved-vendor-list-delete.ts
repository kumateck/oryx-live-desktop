import { readFile, writeFile } from "node:fs/promises";
import { object, parse } from "../deploy/customer-server/data.ts";

// Import only deletion of a superseded vendor-list revision; retain every existing operation and schema.
const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Pass a metadata-only backend OpenAPI export.");
const source = object(parse(await readFile(sourcePath, "utf8")));
const target = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const document = object(parse(await readFile(target, "utf8")));
const path = "/api/v1/approved-vendor-list/{id}";
const operation = object(object(object(source.paths ?? null)[path] ?? null).delete ?? null);
if (!object(operation.responses ?? null)["204"]) throw new Error("Missing vendor-list delete success response.");
const parameters = operation.parameters;
if (Array.isArray(parameters)) for (const item of parameters) {
  const parameter = object(item);
  if (parameter.in === "header" && (parameter.name === "Module" || parameter.name === "SubModule") && !parameter.schema)
    parameter.schema = { type: "string" };
}
object(object(document.paths ?? null)[path] ?? null).delete = operation;
await writeFile(target, JSON.stringify(document, null, 2) + "\n");
