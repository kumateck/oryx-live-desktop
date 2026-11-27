import { readFile, writeFile } from "node:fs/promises";
import { object, parse } from "../deploy/customer-server/data.ts";

// Material sampling id (2026-11-27). Imports only `id` on the material sampling DTO, which names the material test when the
// GRN test page opens formula repair.
const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Pass a metadata-only backend OpenAPI export.");
const source = object(parse(await readFile(sourcePath, "utf8")));
const target = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const document = object(parse(await readFile(target, "utf8")));
const schemas = object(object(document.components ?? null).schemas ?? null);
const sourceSchemas = object(object(source.components ?? null).schemas ?? null);
export const materialSamplingSchema = "DOMAIN.Entities.MaterialSampling.MaterialSamplingDto";
const incoming = object(object(sourceSchemas[materialSamplingSchema] ?? null).properties ?? null).id;
if (!incoming) throw new Error(`Missing ${materialSamplingSchema}.id`);
object(object(schemas[materialSamplingSchema] ?? null).properties ?? null).id = incoming;
await writeFile(target, JSON.stringify(document, null, 2));
