import { readFile, writeFile } from "node:fs/promises";
import { object, parse } from "../deploy/customer-server/data.ts";

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Pass an OpenAPI export from the vendor-list draft backend.");
const source = object(parse(await readFile(sourcePath, "utf8")));
const target = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const document = object(parse(await readFile(target, "utf8")));
const paths = object(document.paths ?? null);
const sourcePaths = object(source.paths ?? null);
const root = "/api/v1/approved-vendor-list";

for (const [suffix, verb] of [["draft", "put"], ["submit", "post"]] as const) {
  const path = `${root}/{id}/${suffix}`;
  const operation = object(object(sourcePaths[path] ?? null)[verb] ?? null);
  if (!Array.isArray(operation.parameters)) throw new Error(`Missing parameters for ${path}`);
  for (const value of operation.parameters) {
    const parameter = object(value);
    if (parameter.in === "header" && !parameter.schema) parameter.schema = { type: "string" };
  }
  paths[path] = { [verb]: operation };
}

const deletion = `${root}/{id}`;
const oldDelete = object(object(paths[deletion] ?? null).delete ?? null);
const exportedDelete = object(object(sourcePaths[deletion] ?? null).delete ?? null);
const reason = Array.isArray(exportedDelete.parameters)
  ? exportedDelete.parameters.find(parameter => object(parameter).name === "reason")
  : undefined;
if (!reason || !Array.isArray(oldDelete.parameters)) throw new Error("Missing vendor-list deletion parameters.");
oldDelete.parameters = [...oldDelete.parameters.filter(parameter => object(parameter).name !== "reason"), reason];

const schemas = object(object(document.components ?? null).schemas ?? null);
const sourceSchemas = object(object(source.components ?? null).schemas ?? null);
const prefix = "DOMAIN.Entities.ApprovedVendorLists.";
for (const name of ["SaveApprovedVendorListDraftRequest", "SubmitApprovedVendorListRequest", "ApprovedVendorListStatus"]) {
  schemas[prefix + name] = object(sourceSchemas[prefix + name] ?? null);
}
for (const [name, fields] of [
  ["ApprovedVendorListDto", ["draftVersion"]],
  ["ApprovedVendorListLineDto", ["manufacturerId", "supplierId", "newManufacturer", "newSupplier", "newSupplierAddress", "newSupplierType"]],
] as const) {
  const props = object(object(schemas[prefix + name] ?? null).properties ?? null);
  const incoming = object(object(sourceSchemas[prefix + name] ?? null).properties ?? null);
  for (const field of fields) props[field] = object(incoming[field] ?? null);
}

const json = JSON.stringify(document, null, 2).replace(/[^\x00-\x7f]/g, character => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);
await writeFile(target, json);
