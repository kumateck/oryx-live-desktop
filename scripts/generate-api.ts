import { generateEndpoints } from "@rtk-query/codegen-openapi";
import { readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createContractInspector, owningTag, type Contract } from "./api-contract.ts";
import { apiDomains } from "./api-domains.ts";

const projectRoot = resolve(import.meta.dirname, "..");
const webRoot = resolve(projectRoot, "apps/web");
const outputRoot = resolve(webRoot, "src/shared/api/generated");
const gapReport = resolve(projectRoot, "docs/api-untyped-operations.md");
const check = process.argv.includes("--check");
process.chdir(webRoot);

const contract: Contract = JSON.parse(await readFile(resolve(projectRoot, "contracts/openapi/backend.v1.json"), "utf8"));
const inspector = createContractInspector(contract);

const domainOfTag = new Map<string, string>();
for (const domain of apiDomains) for (const tag of domain.tags) {
  if (domainOfTag.has(tag)) throw new Error(`Tag ${tag} is assigned to both ${domainOfTag.get(tag)} and ${domain.id}.`);
  domainOfTag.set(tag, domain.id);
}
const gaps = new Map<string, string[]>();
const unassigned = new Set<string>();
for (const { verb, path, operation } of inspector.operations()) {
  const tag = owningTag(operation);
  const domain = tag ? domainOfTag.get(tag) : undefined;
  if (!tag || !domain) { unassigned.add(tag ?? `${verb.toUpperCase()} ${path} (no tag)`); continue; }
  const gap = inspector.operationGap(operation);
  if (gap) gaps.set(domain, [...(gaps.get(domain) ?? []), `| ${tag} | \`${verb.toUpperCase()} ${path}\` | ${gap} |`]);
}
if (unassigned.size) throw new Error(`Assign these backend tags to a domain in scripts/api-domains.ts: ${[...unassigned].join(", ")}`);

async function readOrEmpty(file: string): Promise<string> {
  try { return await readFile(file, "utf8"); } catch { return ""; }
}

const stale: string[] = [];
async function publish(file: string, content: string): Promise<void> {
  const before = await readOrEmpty(file);
  if (check) { if (before !== content) stale.push(file); if (before) await writeFile(file, before); else await rm(file, { force: true }); }
  else await writeFile(file, content);
}

let generatedOperations = 0;
for (const domain of apiDomains) {
  const outputFile = resolve(outputRoot, `${domain.id}.ts`);
  const before = await readOrEmpty(outputFile);
  let included = 0;
  await generateEndpoints({
    apiFile: "./src/shared/api/base-api.ts",
    schemaFile: "../../contracts/openapi/backend.v1.json",
    outputFile: `./src/shared/api/generated/${domain.id}.ts`,
    exportName: domain.exportName,
    filterEndpoints: (_name, definition) => {
      // Classify the contract's own operation: the generator hands over a dereferenced copy.
      const operation = contract.paths[definition.path]?.[definition.verb];
      if (!operation) throw new Error(`${definition.verb} ${definition.path} is missing from the contract.`);
      const tag = owningTag(operation);
      const keep = tag !== null && domain.tags.includes(tag) && inspector.operationGap(operation) === null;
      if (keep) included += 1;
      return keep;
    },
    hooks: { queries: true, lazyQueries: true, mutations: true },
    tag: false,
    useUnknown: false,
  });
  // Every remaining bodyless response is a 204: operations with an undeclared body were filtered out.
  let generated = (await readFile(outputFile, "utf8"))
    .replace(/^(export type \w+ApiResponse =)\s+unknown;$/gm, "$1 void;");
  // ProblemDetails.Extensions is arbitrary JSON; keep its recursive JSON shape instead of any.
  if (generated.includes("  [key: string]: any;")) generated = generated
    .replace("  [key: string]: any;", "  [key: string]: JsonValue | undefined;")
    .replace("export type MicrosoftAspNetCoreMvcProblemDetails = {",
      "export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue | undefined };\nexport type MicrosoftAspNetCoreMvcProblemDetails = {");
  if (before) await writeFile(outputFile, before); else await rm(outputFile, { force: true });
  const lines = generated.split("\n");
  const untyped = lines.flatMap((line, index) => /\b(?:any|unknown)\b/.test(line.replace(/\/\*\*.*?\*\//g, ""))
    ? [`${lines[index - 1]?.trim() ?? ""} ${line.trim()}`] : []);
  if (untyped.length) throw new Error(`${domain.id} still contains untyped output:\n${untyped.slice(0, 10).join("\n")}`);
  await publish(outputFile, generated);
  generatedOperations += included;
  console.log(`${domain.id}: ${included} typed operations, ${gaps.get(domain.id)?.length ?? 0} skipped.`);
}

const known = new Set(apiDomains.map((domain) => `${domain.id}.ts`));
const orphans = (await readdir(outputRoot)).filter((file) => !known.has(file));
if (orphans.length) throw new Error(`Remove generated files without a domain: ${orphans.join(", ")}`);

const skipped = [...gaps.values()].reduce((sum, rows) => sum + rows.length, 0);
await publish(gapReport, [
  "# Backend operations without a strict contract",
  "",
  "Generated by `bun run api:generate`. Do not edit. These operations are left out of the generated hooks because",
  "their OpenAPI contract would produce `any` or `unknown`. Declare the response or request type on the backend",
  "controller (for example `[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(...))]`), run",
  "`bun run api:export` and `bun run api:generate`, and the hook appears.",
  "",
  `Typed operations: ${generatedOperations}. Skipped: ${skipped}.`,
  "",
  ...apiDomains.flatMap((domain) => gaps.has(domain.id)
    ? [`## ${domain.id}`, "", "| Tag | Operation | Reason |", "| --- | --- | --- |", ...(gaps.get(domain.id) ?? []), ""] : []),
].join("\n"));

if (stale.length) throw new Error(`Generated API output is stale. Run bun run api:generate.\n${stale.join("\n")}`);
console.log(check ? "Generated API output is current." : `Generated ${generatedOperations} typed operations; ${skipped} skipped (docs/api-untyped-operations.md).`);
