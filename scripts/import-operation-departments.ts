import { readFile, writeFile } from "node:fs/promises";
import { object, parse } from "../deploy/customer-server/data.ts";

// Import only the operation–department link/unlink paths and the four optional department fields.
const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Pass a metadata-only backend OpenAPI export.");
const source = object(parse(await readFile(sourcePath, "utf8")));
const target = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const document = object(parse(await readFile(target, "utf8")));
const paths = object(document.paths ?? null);
const sourcePaths = object(source.paths ?? null);
const schemas = object(object(document.components ?? null).schemas ?? null);
const sourceSchemas = object(object(source.components ?? null).schemas ?? null);

for (const path of ["/api/v1/collection/operations/{operationId}/department/{departmentId}", "/api/v1/collection/operations/{operationId}/department"]) {
  const operation = object(sourcePaths[path] ?? null);
  if (Object.keys(operation).length !== 1) throw new Error(`Unexpected operation department path ${path}`);
  for (const method of Object.values(operation)) {
    const parameters = object(method).parameters;
    if (Array.isArray(parameters)) for (const item of parameters) {
      const parameter = object(item);
      if (parameter.in === "header" && (parameter.name === "Module" || parameter.name === "SubModule") && !parameter.schema) parameter.schema = { type: "string" };
    }
  }
  paths[path] = operation;
}
const fields: Record<string, readonly string[]> = {
  "SHARED.CollectionItemDto": ["linkedDepartmentId", "linkedDepartmentName"],
  "DOMAIN.Entities.Base.OperationDto": ["departmentId", "departmentName"],
};
for (const [name, keys] of Object.entries(fields)) {
  const from = object(object(sourceSchemas[name] ?? null).properties ?? null);
  const to = object(object(schemas[name] ?? null).properties ?? null);
  for (const key of keys) {
    const field = from[key];
    if (!field) throw new Error(`Missing ${name}.${key}`);
    to[key] = field;
  }
}
await writeFile(target, JSON.stringify(document, null, 2));
console.log("Imported operation department link/unlink and the department fields.");
