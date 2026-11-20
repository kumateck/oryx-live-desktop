import { readFile, writeFile } from "node:fs/promises";
import { object, parse } from "../deploy/customer-server/data.ts";

// Substitute reasons (2026-11-20). Imports only the optional substituteUnavailableReason on the batch material
// DTOs (raw and packaging) and on ForecastMaterialDto.
const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Pass a metadata-only backend OpenAPI export.");
const source = object(parse(await readFile(sourcePath, "utf8")));
const target = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const document = object(parse(await readFile(target, "utf8")));
const schemas = object(object(document.components ?? null).schemas ?? null);
const sourceSchemas = object(object(source.components ?? null).schemas ?? null);
for (const name of ["ProductionScheduleProcurementDto", "ProductionScheduleProcurementPackageDto", "ForecastMaterialDto"].map((dto) => `DOMAIN.Entities.ProductionSchedules.${dto}`)) {
  const incoming = object(object(sourceSchemas[name] ?? null).properties ?? null).substituteUnavailableReason;
  if (!incoming) throw new Error(`Missing ${name}.substituteUnavailableReason`);
  object(object(schemas[name] ?? null).properties ?? null).substituteUnavailableReason = incoming;
}
await writeFile(target, JSON.stringify(document, null, 2));
