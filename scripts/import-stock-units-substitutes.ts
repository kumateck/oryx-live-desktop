import { readFile, writeFile } from "node:fs/promises";
import { object, parse, type Json } from "../deploy/customer-server/data.ts";

// Cross-store units, product COA printing and substitutes (2026-11-19). Imports only:
// - the optional uomId query and the optional uoM field on stock/across-warehouses;
// - the optional isSubstitute / substituteFor fields on ForecastMaterialDto;
// - the optional StartProductionRequest body (materialChoices) on activity/start, with its two schemas.
const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Pass a metadata-only backend OpenAPI export.");
const source = object(parse(await readFile(sourcePath, "utf8")));
const target = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const document = object(parse(await readFile(target, "utf8")));
const paths = object(document.paths ?? null);
const schemas = object(object(document.components ?? null).schemas ?? null);
const sourcePaths = object(source.paths ?? null);
const sourceSchemas = object(object(source.components ?? null).schemas ?? null);
const operation = (from: Record<string, Json>, path: string, method: string) => object(object(from[path] ?? null)[method] ?? null);

const stockPath = "/api/v1/material/{materialId}/stock/across-warehouses";
const stock = operation(paths, stockPath, "get");
const parameters = Array.isArray(stock.parameters) ? stock.parameters : [];
const unit = (operation(sourcePaths, stockPath, "get").parameters as Json[] | undefined)?.find((item) => object(item).name === "uomId");
if (!unit) throw new Error("Missing across-warehouses uomId parameter");
if (!parameters.some((item) => object(item).name === "uomId")) parameters.splice(1, 0, unit);
stock.parameters = parameters;

function addFields(name: string, keys: string[]) {
  const properties = object(object(schemas[name] ?? null).properties ?? null);
  const incoming = object(object(sourceSchemas[name] ?? null).properties ?? null);
  for (const key of keys) { if (!incoming[key]) throw new Error(`Missing ${name}.${key}`); properties[key] = incoming[key]; }
}
addFields("DOMAIN.Entities.Warehouses.WarehouseStockDto", ["uoM"]);
addFields("DOMAIN.Entities.ProductionSchedules.ForecastMaterialDto", ["isSubstitute", "substituteFor"]);

const startPath = "/api/v1/production-schedule/activity/start/{productionScheduleProductId}";
const start = operation(paths, startPath, "post");
const incomingStart = operation(sourcePaths, startPath, "post");
if (!incomingStart.requestBody) throw new Error("The export's start operation has no request body.");
start.requestBody = incomingStart.requestBody;
for (const name of ["DOMAIN.Entities.ProductionSchedules.StartProductionRequest", "DOMAIN.Entities.ProductionSchedules.StartProductionMaterialChoice"]) {
  if (!sourceSchemas[name]) throw new Error(`Missing ${name}`);
  schemas[name] = sourceSchemas[name];
}

await writeFile(target, JSON.stringify(document, null, 2));
