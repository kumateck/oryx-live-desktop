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
const seen = new Set<string>();
function collect(value: Json): void {
  if (Array.isArray(value)) { value.forEach(collect); return; }
  if (!value || typeof value !== "object") return;
  if (typeof value.$ref === "string" && value.$ref.startsWith("#/components/schemas/")) {
    const name = value.$ref.slice("#/components/schemas/".length);
    if (!seen.has(name) && !(name in schemas)) {
      seen.add(name);
      if (!sourceSchemas[name]) throw new Error(`Missing schema ${name}`);
      schemas[name] = sourceSchemas[name]; collect(schemas[name]);
    }
  }
  Object.values(value).forEach(collect);
}
let count = 0;
for (const [path, operation] of Object.entries(object(source.paths ?? null))) {
  if (!path.startsWith("/api/v1/unstart-reservations/")) continue;
  for (const method of Object.values(object(operation))) {
    const parameters = object(method).parameters;
    if (Array.isArray(parameters)) for (const item of parameters) {
      const parameter = object(item);
      if (parameter.in === "header" && (parameter.name === "Module" || parameter.name === "SubModule") && !parameter.schema) parameter.schema = { type: "string" };
    }
  }
  collect(operation); paths[path] = operation; count++;
}
if (count !== 2) throw new Error(`Expected raw and packaging repair paths; found ${count}`);
await writeFile(target, JSON.stringify(document, null, 2));
