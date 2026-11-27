import { readFile, writeFile } from "node:fs/promises";
import { object, parse } from "../deploy/customer-server/data.ts";

// Specification microbial template (2026-11-27). Imports only the optional microbialFormId on the material and product
// specification create/update requests, and microbialFormId + microbialForm on their DTOs and entities.
const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Pass a metadata-only backend OpenAPI export.");
const source = object(parse(await readFile(sourcePath, "utf8")));
const target = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const document = object(parse(await readFile(target, "utf8")));
const schemas = object(object(document.components ?? null).schemas ?? null);
const sourceSchemas = object(object(source.components ?? null).schemas ?? null);
export const specificationMicrobialFields: Record<string, readonly string[]> = Object.fromEntries((["Material", "Product"] as const).flatMap((kind) => {
  const prefix = `DOMAIN.Entities.${kind}Specifications.`;
  return [
    [`${prefix}Create${kind}SpecificationRequest`, ["microbialFormId"]],
    [`${prefix}Update${kind}SpecificationRequest`, ["microbialFormId"]],
    [`${prefix}${kind}SpecificationDto`, ["microbialFormId", "microbialForm"]],
    [`${prefix}${kind}Specification`, ["microbialFormId", "microbialForm"]],
  ];
}));
for (const [name, fields] of Object.entries(specificationMicrobialFields)) {
  if (schemas[name] === undefined) continue;
  for (const field of fields) {
    const incoming = object(object(sourceSchemas[name] ?? null).properties ?? null)[field];
    if (!incoming) throw new Error(`Missing ${name}.${field}`);
    object(object(schemas[name] ?? null).properties ?? null)[field] = incoming;
  }
}
await writeFile(target, JSON.stringify(document, null, 2));
