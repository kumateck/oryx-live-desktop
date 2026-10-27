import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { object, parse, type ObjectValue } from "../deploy/customer-server/data.ts";
import { checkCriticalContract, criticalOperations } from "../deploy/customer-docker/critical-contract.ts";
import { verifyCriticalCompatibility } from "../deploy/customer-docker/probe-checks.ts";
import { requirements } from "../deploy/customer-docker/requirements.ts";

const text = readFileSync("contracts/openapi/backend.v1.json", "utf8");
const baseline = object(parse(text));
const clone = () => object(parse(text));
function operation(document: ObjectValue, path = "/api/v1/auth/login", method = "post") {
  return object(object(object(document.paths ?? null)[path] ?? null)[method] ?? null);
}
function dto(document: ObjectValue, name = "DOMAIN.Entities.Auth.LoginResponse") {
  return object(object(object(document.components ?? null).schemas ?? null)[name] ?? null);
}

test("both preserved raw and typed Swagger pass critical checks without an approved fingerprint", async () => {
  const raw = object(parse(gunzipSync(readFileSync("contracts/openapi/reviewed/customer-c89615ea.swagger.json.gz")).toString("utf8")));
  for (const document of [raw, baseline]) {
    assert.deepEqual(checkCriticalContract(document, baseline), { breaking: [], warnings: [] });
    assert.deepEqual(await verifyCriticalCompatibility("http://127.0.0.1:8080", baseline, { fetcher: async () => Response.json(document) }), { verified: true, warnings: [] });
  }
});

test("unrelated removals, descriptions, added optional fields and renamed path placeholders are harmless", () => {
  const changed = clone();
  changed.info = { title: "New backend release", version: "next" };
  const paths = object(changed.paths ?? null);
  const retained = new Set(criticalOperations.map((item) => item.path));
  for (const path of Object.keys(paths)) if (!retained.has(path)) delete paths[path];
  object(dto(changed).properties ?? null).futureFeature = { type: "string" };
  const permission = paths["/api/v1/permission/user/{userId}"];
  if (!permission) throw new Error("Missing fixture path");
  paths["/api/v1/permission/user/{id}"] = permission;
  delete paths["/api/v1/permission/user/{userId}"];
  const parameters = operation(changed, "/api/v1/permission/user/{id}", "get").parameters;
  if (!Array.isArray(parameters)) throw new Error("Missing fixture parameters");
  for (const item of parameters) if (object(item).name === "userId") object(item).name = "id";
  object(object(changed.components ?? null).securitySchemes ?? null).SessionToken = { type: "http", scheme: "bearer" };
  changed.security = [{ SessionToken: [] }];
  const responses = object(operation(changed).responses ?? null);
  const success = responses["200"];
  if (!success) throw new Error("Missing fixture success");
  responses["201"] = success; delete responses["200"];
  assert.deepEqual(checkCriticalContract(changed, baseline), { breaking: [], warnings: [] });
});

test("confirmed removals and incompatible critical DTOs block candidate activation", async () => {
  const changes: [string, (document: ObjectValue) => void][] = [
    ["endpoint or method removed", (doc) => { delete object(doc.paths ?? null)["/api/v1/auth/login"]; }],
    ["accessToken removed", (doc) => { delete object(dto(doc).properties ?? null).accessToken; }],
    ["accessToken has an incompatible type", (doc) => { object(dto(doc).properties ?? null).accessToken = { type: "integer" }; }],
    ["parent type changed", (doc) => { const response = object(object(operation(doc).responses ?? null)["200"] ?? null); response.content = { "application/json": { schema: { type: "array", items: { type: "string" } } } }; }],
    ["requires unsupplied body field", (doc) => { dto(doc, "Microsoft.AspNetCore.Identity.Data.LoginRequest").required = ["email", "password", "newRequiredCode"]; }],
    ["new required query parameter", (doc) => { const op = operation(doc); if (Array.isArray(op.parameters)) op.parameters.push({ in: "query", name: "tenant", required: true, schema: { type: "string" } }); }],
    ["no-content response replaces", (doc) => { operation(doc).responses = { "204": { description: "No Content" } }; }],
    ["expected success response removed", (doc) => { operation(doc).responses = { "410": { description: "Retired" } }; }],
    ["authentication requires", (doc) => { operation(doc).security = [{ CustomKey: [] }]; object(object(doc.components ?? null).securitySchemes ?? null).CustomKey = { type: "apiKey", in: "header", name: "X-API-Key" }; }],
    ["authentication requires", (doc) => { object(object(doc.components ?? null).securitySchemes ?? null).Bearer = { type: "http", scheme: "basic" }; }],
    ["start/complete status", (doc) => { dto(doc, "DOMAIN.Entities.Base.ProductionStatus").enum = [0, 1]; }],
  ];
  for (const [message, change] of changes) {
    const changed = clone(); change(changed);
    assert.ok(checkCriticalContract(changed, baseline).breaking.some((detail) => detail.includes(message)), message);
    await assert.rejects(verifyCriticalCompatibility("http://127.0.0.1:8080", baseline, { fetcher: async () => Response.json(changed) }), /\[Compatibility:breaking\]/);
  }
});

test("incomplete and ambiguous schemas warn instead of claiming confirmed incompatibility", async () => {
  const changed = clone();
  object(object(operation(changed).responses ?? null)["200"] ?? null).content = {};
  const result = await verifyCriticalCompatibility("http://127.0.0.1:8080", baseline, { fetcher: async () => Response.json(changed) });
  assert.equal(result.verified, false); assert.match(result.warnings.join(), /response schema unavailable/);
});

test("allOf keeps inline fields and supports equivalent schema composition", () => {
  const changed = clone();
  const login = dto(changed);
  const properties = object(login.properties ?? null);
  const accessToken = properties.accessToken;
  if (!accessToken) throw new Error("Missing fixture token field");
  delete properties.accessToken;
  login.allOf = [{ type: "object", properties: { accessToken } }];
  assert.deepEqual(checkCriticalContract(changed, baseline), { breaking: [], warnings: [] });
});

test("Docker requirements retain shell/protocol checks independently of legacy backend hashes", () => {
  assert.deepEqual(requirements({ deploymentProtocol: 1, minimumShellVersion: "0.1.0" }), { deploymentProtocol: 1, minimumShellVersion: "0.1.0" });
  assert.throws(() => requirements({ deploymentProtocol: 2, minimumShellVersion: "0.1.0" }), /protocol/);
  assert.throws(() => requirements({ deploymentProtocol: 1, minimumShellVersion: "broken" }));
});
