import { readFile, writeFile } from "node:fs/promises";
import { object, parse } from "../deploy/customer-server/data.ts";

// Material COA reported tests (2026-11-27). Imports only the GET/PUT material specification coa-reporting path; its
// schemas are the ones the product path already brought in.
const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Pass a metadata-only backend OpenAPI export.");
const source = object(parse(await readFile(sourcePath, "utf8")));
const target = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const document = object(parse(await readFile(target, "utf8")));
const paths = object(document.paths ?? null);
const sourcePaths = object(source.paths ?? null);
export const materialCoaReportingPaths = ["/api/v1/material-specifications/{id}/coa-reporting/{analysisType}"];
for (const path of materialCoaReportingPaths) {
  if (!sourcePaths[path]) throw new Error(`Missing ${path}`);
  paths[path] = sourcePaths[path];
  // The same audit-header typing scripts/export-openapi.ts applies.
  for (const operation of Object.values(object(paths[path] ?? null)))
    for (const parameter of (object(operation).parameters as { in?: string; name?: string; schema?: object }[] | undefined) ?? [])
      if (parameter.in === "header" && (parameter.name === "Module" || parameter.name === "SubModule") && !parameter.schema) parameter.schema = { type: "string" };
}
await writeFile(target, JSON.stringify(document, null, 2));
