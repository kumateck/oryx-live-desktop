// Saves the backend's published OpenAPI document as the versioned contract.
// The desktop uses the same backend as Oryx Next and needs no backend changes: start the
// backend (or point ORYX_OPENAPI_URL at any running instance) and run `bun run api:export`.
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const source = process.env.ORYX_OPENAPI_URL ?? "http://localhost:5299/swagger/v1/swagger.json";
const destination = resolve(import.meta.dirname, "../contracts/openapi/backend.v1.json");

interface Parameter { name?: string; in?: string; schema?: object }
interface Operation { parameters?: Parameter[] }
interface Document { openapi?: string; paths?: Record<string, Record<string, Operation>> }

let response: Response;
try {
  response = await fetch(source, { signal: AbortSignal.timeout(60_000) });
} catch {
  throw new Error(`Cannot reach ${source}. Start the backend or set ORYX_OPENAPI_URL.`);
}
if (!response.ok) throw new Error(`${source} answered ${response.status}.`);
const contract: Document = await response.json();
if (!contract.openapi || !contract.paths || !("/api/v1/auth/login" in contract.paths)) {
  throw new Error(`${source} did not return the Oryx backend OpenAPI document.`);
}

// The backend declares its audit headers (Module, SubModule) without a type. They are plain
// strings; record that here so the generated hooks stay strictly typed.
let patched = 0;
for (const item of Object.values(contract.paths)) for (const operation of Object.values(item)) {
  for (const parameter of operation.parameters ?? []) {
    if (parameter.in === "header" && (parameter.name === "Module" || parameter.name === "SubModule") && !parameter.schema) {
      parameter.schema = { type: "string" };
      patched += 1;
    }
  }
}

await writeFile(destination, JSON.stringify(contract, null, 2));
console.log(`Saved ${Object.keys(contract.paths).length} paths from ${source} (${patched} audit header types added).`);
