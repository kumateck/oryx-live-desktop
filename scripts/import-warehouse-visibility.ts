import { readFile, writeFile } from "node:fs/promises";
import { object, parse, type Json } from "../deploy/customer-server/data.ts";

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Pass a metadata-only backend OpenAPI export.");
const source = object(parse(await readFile(sourcePath, "utf8")));
const target = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const document = object(parse(await readFile(target, "utf8")));
const paths = object(document.paths ?? null);
const schemas = object(object(document.components ?? null).schemas ?? null);
const sourceSchemas = object(object(source.components ?? null).schemas ?? null);
const queue = "API.Controllers.StockIssueQueueDto";
function collect(value: Json): void {
  if (Array.isArray(value)) { value.forEach(collect); return; }
  if (!value || typeof value !== "object") return;
  if (typeof value.$ref === "string") {
    const name = value.$ref.replace("#/components/schemas/", "");
    if (!(name in schemas)) {
      if (name !== queue || !sourceSchemas[name]) throw new Error(`Unreviewed dependency ${name}`);
      schemas[name] = sourceSchemas[name]; collect(schemas[name]);
    }
  }
  Object.values(value).forEach(collect);
}
for (const kind of ["raw", "packaging"]) {
  const path = `/api/v1/stock-issue/${kind}`;
  const operation = object(object(source.paths ?? null)[path] ?? null);
  if (!operation.get) throw new Error(`Missing ${path}`);
  const parameters = object(operation.get).parameters;
  if (Array.isArray(parameters)) for (const value of parameters) {
    const parameter = object(value);
    if (parameter.in === "header" && (parameter.name === "Module" || parameter.name === "SubModule") && !parameter.schema)
      parameter.schema = { type: "string" };
  }
  collect(operation); paths[path] = operation;
}
const fields: Record<string, readonly string[]> = {
  "DOMAIN.Entities.Approvals.ApprovalEntity": ["productCode", "productStage", "materialName", "materialCode"],
  "DOMAIN.Entities.AnalyticalTestRequests.AnalyticalTestRequestDto": ["coaStatus"],
};
for (const [name, additions] of Object.entries(fields)) {
  const properties = object(object(schemas[name] ?? null).properties ?? null);
  const sourceProperties = object(object(sourceSchemas[name] ?? null).properties ?? null);
  for (const field of additions) {
    const value = sourceProperties[field];
    if (!value) throw new Error(`Missing ${name}.${field}`);
    collect(value); properties[field] = value;
  }
}
await writeFile(target, JSON.stringify(document, null, 2) + "\n");
