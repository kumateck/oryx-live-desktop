import { readFile, writeFile } from "node:fs/promises";
import { object, parse } from "../deploy/customer-server/data.ts";

const path = process.argv[2];
if (!path) throw new Error("Pass a metadata-only backend OpenAPI export.");
const source = object(parse(await readFile(path, "utf8")));
const target = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const document = object(parse(await readFile(target, "utf8")));
for (const kind of ["raw", "packaging"]) {
  const path = `/api/v1/material/${kind}/{materialId}/density`;
  const operation = object(object(source.paths ?? null)[path] ?? null);
  const deletion = object(operation.delete ?? null);
  if (!deletion.operationId) throw new Error(`Missing typed DELETE ${path}`);
  const parameters = deletion.parameters;
  if (Array.isArray(parameters)) for (const value of parameters) {
    const parameter = object(value);
    if (parameter.in === "header" && (parameter.name === "Module" || parameter.name === "SubModule") && !parameter.schema)
      parameter.schema = { type: "string" };
  }
  object(document.paths ?? null)[path] = operation;
}
await writeFile(target, JSON.stringify(document, null, 2) + "\n");
