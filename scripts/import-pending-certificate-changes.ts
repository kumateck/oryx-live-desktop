import { readFile, writeFile } from "node:fs/promises";
import { object, parse } from "../deploy/customer-server/data.ts";

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Pass a pending certificate OpenAPI export.");
const source = object(parse(await readFile(sourcePath, "utf8")));
const target = new URL("../contracts/openapi/backend.v1.json", import.meta.url);
const document = object(parse(await readFile(target, "utf8")));
const paths = object(document.paths ?? null);
const sourcePaths = object(source.paths ?? null);

for (const subject of ["product", "raw-material", "packaging-material"]) {
  for (const [suffix, verb] of [["", "put"], ["/review-request", "post"], ["/correction-request", "post"]] as const) {
    const path = `/api/v1/pending-certificates/{responseId}/${subject}${suffix}`;
    const operation = object(object(sourcePaths[path] ?? null)[verb] ?? null);
    if (!Array.isArray(operation.parameters)) throw new Error(`Missing parameters for ${path}`);
    for (const value of operation.parameters) {
      const parameter = object(value);
      if (parameter.in === "header" && !parameter.schema) parameter.schema = { type: "string" };
    }
    paths[path] = { [verb]: operation };
  }
}

const schemas = object(object(document.components ?? null).schemas ?? null);
const sourceSchemas = object(object(source.components ?? null).schemas ?? null);
const prefix = "DOMAIN.Entities.Forms.";
for (const name of ["CertificateReturnKind", "RequestCertificateChange", "SavePendingCertificate"]) {
  schemas[prefix + name] = object(sourceSchemas[prefix + name] ?? null);
}
const detail = prefix + "ResponseDetailDto";
const fields = object(object(schemas[detail] ?? null).properties ?? null);
const sourceFields = object(object(sourceSchemas[detail] ?? null).properties ?? null);
for (const field of ["coaSubjectKind", "coaVersion", "coaReturnKind", "coaReturnReason", "certificateNotes"]) {
  fields[field] = object(sourceFields[field] ?? null);
}
const notificationType = "DOMAIN.Entities.Notifications.NotificationType";
schemas[notificationType] = object(sourceSchemas[notificationType] ?? null);

const json = JSON.stringify(document, null, 2).replace(/[^\x00-\x7f]/g, character => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);
await writeFile(target, json);
