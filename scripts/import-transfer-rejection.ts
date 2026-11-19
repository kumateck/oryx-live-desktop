import { readFile, writeFile } from "node:fs/promises";
import { object, parse, type Json } from "../deploy/customer-server/data.ts";

// Transfer rejection reasons and supplier units (2026-11-19). Imports only:
// - the reject PUT's new { reason } body and its request DTO;
// - optional supplier and rejection fields on DepartmentStockTransferDto;
// - the optional uomId query on department-stock.
const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Pass a metadata-only backend OpenAPI export.");
const source = object(parse(await readFile(sourcePath, "utf8")));
const target = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const document = object(parse(await readFile(target, "utf8")));
const paths = object(document.paths ?? null);
const schemas = object(object(document.components ?? null).schemas ?? null);
const sourcePaths = object(source.paths ?? null);
const sourceSchemas = object(object(source.components ?? null).schemas ?? null);

const rejectPath = "/api/v1/production-schedule/stock-transfer/reject/{stockTransferId}";
const reject = object(object(paths[rejectPath] ?? null).put ?? null);
const incomingReject = object(object(sourcePaths[rejectPath] ?? null).put ?? null);
if (!incomingReject.requestBody) throw new Error("The export's reject operation has no request body.");
reject.requestBody = incomingReject.requestBody;
const requestName = "DOMAIN.Entities.ProductionSchedules.StockTransfers.Request.RejectStockTransferRequest";
if (!sourceSchemas[requestName]) throw new Error(`Missing ${requestName}`);
schemas[requestName] = sourceSchemas[requestName];

const dtoName = "DOMAIN.Entities.ProductionSchedules.StockTransfers.DepartmentStockTransferDto";
const properties = object(object(schemas[dtoName] ?? null).properties ?? null);
const incoming = object(object(sourceSchemas[dtoName] ?? null).properties ?? null);
for (const key of ["supplierQuantity", "supplierUoM", "rejectionReason", "rejectedAt", "rejectedBy"]) {
  if (!incoming[key]) throw new Error(`Missing ${dtoName}.${key}`);
  properties[key] = incoming[key];
}

const stockPath = "/api/v1/material/{materialId}/department-stock/{quantity}";
const stock = object(object(paths[stockPath] ?? null).get ?? null);
const parameters = Array.isArray(stock.parameters) ? stock.parameters : [];
const incomingUnit = (object(object(sourcePaths[stockPath] ?? null).get ?? null).parameters as Json[] | undefined)?.find((item) => object(item).name === "uomId");
if (!incomingUnit) throw new Error("Missing department-stock uomId parameter");
if (!parameters.some((item) => object(item).name === "uomId")) parameters.splice(2, 0, incomingUnit);
stock.parameters = parameters;

await writeFile(target, JSON.stringify(document, null, 2));
