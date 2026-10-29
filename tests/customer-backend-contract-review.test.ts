import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { contractDigest, object, parse, type ObjectValue } from "../deploy/customer-server/data.ts";
import { compatibility, checkCompatibility } from "../deploy/customer-server/release.ts";
import { readConfig } from "../deploy/customer-server/config.ts";
const hostConfig = readConfig({ ORYX_SITE_URL: "http://customer.test", ORYX_API_ORIGIN: "http://backend.test" });

const approvedFingerprint = "4727f9d426d4fa53cdf6ee93f2b5df1edb959d6fa83d705ebdfc7fb2ca9648ae";
const customerFingerprint = "c89615ea1e0050bbb0ed5f61f9308ee87e5398e79b3972b00e4dee33587abdc1";
const raw = gunzipSync(readFileSync("contracts/openapi/reviewed/customer-c89615ea.swagger.json.gz")).toString("utf8");
const customer = object(parse(raw));
// Preserve the dated review independently of later additive source contracts.
const reviewedImport = () => auditHeaderReview(customer).normalized;
const policy = compatibility(parse(readFileSync("deploy/customer-server/release.json", "utf8")));
const verbs = new Set(["get", "post", "put", "patch", "delete", "options", "head", "trace"]);

// Reproduce only the exporter's documented audit-header typing adjustment. Any other
// endpoint, request/response, security, permission DTO or schema drift fails whole-document equality.
function auditHeaderReview(document: ObjectValue) {
  const normalized = object(parse(JSON.stringify(document)));
  const paths = object(normalized.paths ?? null);
  let operations = 0; let headers = 0;
  for (const item of Object.values(paths)) {
    for (const [verb, value] of Object.entries(object(item))) {
      if (!verbs.has(verb)) continue;
      operations += 1;
      const operation = object(value);
      const parameters = operation.parameters;
      if (!Array.isArray(parameters)) throw new Error("Reviewed operation has no parameter list");
      for (const entry of parameters) {
        const parameter = object(entry);
        if (parameter.in === "header" && (parameter.name === "Module" || parameter.name === "SubModule") && parameter.schema === undefined) {
          parameter.schema = { type: "string" }; headers += 1;
        }
      }
    }
  }
  return { normalized, paths: Object.keys(paths).length, operations, headers };
}

test("the preserved customer export matches the reported digest and retains both exact approved contracts", () => {
  assert.equal(contractDigest(customer), customerFingerprint);
  assert.equal(contractDigest(reviewedImport()), approvedFingerprint);
  assert.ok(policy.backendContracts.includes(approvedFingerprint));
  assert.ok(policy.backendContracts.includes(customerFingerprint));
});

test("all 1,358 operations and schemas match after only 2,716 audit-header schema additions", () => {
  const review = auditHeaderReview(customer);
  assert.equal(review.paths, 1056); assert.equal(review.operations, 1358); assert.equal(review.headers, 2716);
  assert.equal(Object.keys(object(object(customer.components ?? null).schemas ?? null)).length, 1531);
  assert.equal(contractDigest(review.normalized), approvedFingerprint);
});

test("historical reporting adds optional read parameters without changing existing contracts or security", () => {
  const current = object(parse(readFileSync("contracts/openapi/backend.v1.json", "utf8")));
  const before = reviewedImport();
  const paths = object(current.paths ?? null);
  for (const [path, item] of Object.entries(object(before.paths ?? null))) {
    for (const [verb, oldValue] of Object.entries(object(item))) {
      const original = object(oldValue);
      const operation = object(object(paths[path] ?? null)[verb] ?? null);
      const parameters = operation.parameters;
      if (Array.isArray(parameters)) operation.parameters = parameters.filter((entry) => {
        const parameter = object(entry);
        return !(parameter.in === "query" && (parameter.name === "asOfDate" || (path === "/api/v1/attendance-records/general-summary" && parameter.name === "departmentId") || (path === "/api/v1/report/warehouse/materials-stock-batch-detail" && parameter.name === "materialId")));
      });
      const responses = object(operation.responses ?? null);
      if (!("409" in object(original.responses ?? null))) delete responses["409"];
      assert.deepEqual(operation, original, `${verb.toUpperCase()} ${path}`);
    }
  }
  assert.deepEqual(Object.keys(paths).filter((path) => !(path in object(before.paths ?? null))), ["/api/v1/production-schedule/activity/{activityId}/step/{stepId}/records", "/api/v1/report/production-readiness", "/api/v1/report/history/capabilities", "/api/v1/report/history/vendors"]);
  const schemas = object(object(current.components ?? null).schemas ?? null);
  delete schemas["DOMAIN.Entities.Reports.ReportHistoryCapabilitiesDto"];
  for (const name of ["ProductionStepAnalysisDto", "ProductionStepExtraMaterialDto", "ProductionStepRecordsDto"])
    delete schemas[`DOMAIN.Entities.Products.Production.${name}`];
  for (const name of ["DefinitionReadiness", "PlannedProductReadinessDto", "ProductConfigurationDto", "ProductReadiness",
    "ProductionReadinessGroupDto", "ProductionReadinessReportDto", "ProductionReadinessRowDto", "ProductionReadinessTotalsDto", "ReadinessMarketDto"])
    delete schemas[`DOMAIN.Entities.Reports.${name}`];
  assert.deepEqual(current.components, before.components);
  assert.deepEqual(current.security, before.security);
});

test("production readiness adds one typed, authenticated, parameterized operation", () => {
  const current = object(parse(readFileSync("contracts/openapi/backend.v1.json", "utf8")));
  const operation = object(object(object(current.paths ?? null)["/api/v1/report/production-readiness"] ?? null).get ?? null);
  assert.equal(operation.operationId, "GetProductionReadinessReport");
  assert.deepEqual(operation.tags, ["Report"]);
  const parameters = operation.parameters;
  assert.ok(Array.isArray(parameters));
  assert.deepEqual(parameters.map((entry) => object(entry)).filter((entry) => entry.in === "query")
    .map((entry) => ({ name: entry.name, required: entry.required })), [
      { name: "departmentId", required: true }, { name: "startDate", required: true }, { name: "endDate", required: true },
    ]);
  const response = object(object(operation.responses ?? null)["200"] ?? null);
  assert.deepEqual(object(object(response.content ?? null)["application/json"] ?? null).schema,
    { $ref: "#/components/schemas/DOMAIN.Entities.Reports.ProductionReadinessReportDto" });
  assert.deepEqual(current.security, reviewedImport().security);
});

test("the separate legacy host-Nginx verifier retains both reviewed exact documents", async () => {
  for (const document of [customer, reviewedImport()]) {
    checkCompatibility(hostConfig, policy, contractDigest(document));
  }
});

test("the separate legacy host-Nginx verifier still blocks unreviewed document changes", async () => {
  const changes: ((document: ObjectValue) => void)[] = [
    (document) => { delete object(document.paths ?? null)["/api/v1/auth/login"]; },
    (document) => { object(object(object(document.paths ?? null)["/api/v1/auth/login"] ?? null).post ?? null).requestBody = { required: true, content: {} }; },
    (document) => { object(object(object(document.paths ?? null)["/api/v1/auth/login"] ?? null).post ?? null).responses = { "204": { description: "Changed response" } }; },
    (document) => { document.security = []; },
    (document) => { object(document.components ?? null).securitySchemes = {}; },
    (document) => { object(object(document.components ?? null).schemas ?? null)["DOMAIN.Entities.Permissions.PermissionDto"] = { type: "object", properties: {} }; },
  ];
  for (const change of changes) {
    const changed = object(parse(raw)); change(changed);
    assert.throws(() => checkCompatibility(hostConfig, policy, contractDigest(changed)), /has not been approved/);
  }
});
