import { readFile, writeFile } from "node:fs/promises";
import { object, parse, type Json } from "../deploy/customer-server/data.ts";

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Pass an absolute metadata-only OpenAPI export path.");
const source = object(parse(await readFile(sourcePath, "utf8")));
const target = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const destination = object(parse(await readFile(target, "utf8")));
const paths = object(destination.paths ?? null);
const sourcePaths = object(source.paths ?? null);
const schemas = object(object(destination.components ?? null).schemas ?? null);
const sourceSchemas = object(object(source.components ?? null).schemas ?? null);
const seen = new Set<string>();
function collect(value: Json): void {
  if (Array.isArray(value)) { value.forEach(collect); return; }
  if (!value || typeof value !== "object") return;
  if (typeof value.$ref === "string" && value.$ref.startsWith("#/components/schemas/")) {
    const name = value.$ref.slice("#/components/schemas/".length);
    if (!seen.has(name) && (!(name in schemas) || /FormulaRepair|RepairedFormula/.test(name))) {
      seen.add(name);
      const schema = sourceSchemas[name];
      if (!schema) throw new Error(`Missing schema ${name}`);
      schemas[name] = schema; collect(schema);
    }
  }
  Object.values(value).forEach(collect);
}
for (const [path, operation] of Object.entries(sourcePaths)) {
  if (!path.startsWith("/api/v1/formula-repairs/")) continue;
  for (const method of Object.values(object(operation))) {
    const parameters = object(method).parameters;
    if (Array.isArray(parameters)) for (const item of parameters) {
      const parameter = object(item);
      if (parameter.in === "header" && (parameter.name === "Module" || parameter.name === "SubModule") && !parameter.schema)
        parameter.schema = { type: "string" };
    }
  }
  collect(operation); paths[path] = operation;
}
for (const [name, properties] of Object.entries({
  "DOMAIN.Entities.Forms.FormFieldDto": ["formulaConfigurationHash"],
  "DOMAIN.Entities.Forms.FormResponseDto": ["formulaRepairPending", "formulaRepairEvaluated"],
  "DOMAIN.Entities.Forms.ResponseDetailDto": ["effectiveForm"],
  "DOMAIN.Entities.Forms.Request.SaveResponseDraftRequest": ["formulaConfigurationHash"],
})) {
  const destinationProperties = object(object(schemas[name] ?? null).properties ?? null);
  const sourceProperties = object(object(sourceSchemas[name] ?? null).properties ?? null);
  for (const property of properties) {
    if (!sourceProperties[property]) throw new Error(`Missing ${name}.${property}`);
    destinationProperties[property] = sourceProperties[property]; collect(sourceProperties[property]);
  }
}
const formPath = "/api/v1/form/{formId}";
const sourceGet = object(object(sourcePaths[formPath] ?? null).get ?? null);
const query = Array.isArray(sourceGet.parameters) ? sourceGet.parameters.find(p => object(p).name === "responseId") : null;
if (!query) throw new Error("The response-aware form query is missing.");
const get = object(object(paths[formPath] ?? null).get ?? null);
get.parameters = [...(Array.isArray(get.parameters) ? get.parameters.filter(p => object(p).name !== "responseId") : []), query];
await writeFile(target, JSON.stringify(destination, null, 2));
console.log("Imported formula repair operations and response-aware configuration fields.");
