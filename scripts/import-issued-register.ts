import { readFile, writeFile } from "node:fs/promises";
import { object, parse, type Json } from "../deploy/customer-server/data.ts";

// Issued BMR/BPR register (2026-11-20). Imports only:
// - the optional departmentId, productId, issuedFrom and issuedTo queries on GET issued-bmrs;
// - GET issued-bmrs/register with its IssuedBmrRegister and IssuedBmrProductTotal schemas.
const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Pass a metadata-only backend OpenAPI export.");
const source = object(parse(await readFile(sourcePath, "utf8")));
const target = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const document = object(parse(await readFile(target, "utf8")));
const paths = object(document.paths ?? null);
const schemas = object(object(document.components ?? null).schemas ?? null);
const sourcePaths = object(source.paths ?? null);
const sourceSchemas = object(object(source.components ?? null).schemas ?? null);

const list = object(object(paths["/api/v1/issued-bmrs"] ?? null).get ?? null);
const incoming = (object(object(sourcePaths["/api/v1/issued-bmrs"] ?? null).get ?? null).parameters as Json[] | undefined) ?? [];
const parameters = Array.isArray(list.parameters) ? list.parameters : [];
const at = parameters.findIndex((item) => object(item).name === "searchQuery") + 1;
const added = ["departmentId", "productId", "issuedFrom", "issuedTo"].map((name) => {
  const parameter = incoming.find((item) => object(item).name === name);
  if (!parameter) throw new Error(`Missing issued-bmrs ${name}`);
  return parameter;
}).filter((parameter) => !parameters.some((item) => object(item).name === object(parameter).name));
parameters.splice(at, 0, ...added);
list.parameters = parameters;

const register = sourcePaths["/api/v1/issued-bmrs/register"];
if (!register) throw new Error("Missing issued-bmrs/register");
paths["/api/v1/issued-bmrs/register"] = register;
// The backend declares its audit headers without a type; record them as strings, as scripts/export-openapi.ts does.
for (const parameter of (object(object(register).get ?? null).parameters as Json[] | undefined) ?? []) {
  const header = object(parameter);
  if (header.in === "header" && (header.name === "Module" || header.name === "SubModule") && !header.schema) header.schema = { type: "string" };
}
for (const name of ["IssuedBmrRegister", "IssuedBmrProductTotal"].map((type) => `DOMAIN.Entities.Products.Production.${type}`)) {
  if (!sourceSchemas[name]) throw new Error(`Missing ${name}`);
  schemas[name] = sourceSchemas[name];
}
await writeFile(target, JSON.stringify(document, null, 2));
