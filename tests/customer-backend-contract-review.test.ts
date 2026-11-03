import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { spawnSync } from "node:child_process";
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
        return !(parameter.in === "query" && (parameter.name === "asOfDate" || (path === "/api/v1/attendance-records/general-summary" && parameter.name === "departmentId") || (path === "/api/v1/report/warehouse/materials-stock-batch-detail" && parameter.name === "materialId")
          || ((path === "/api/v1/material/batches/expired" || path === "/api/v1/material/batches/about-to-expire") && parameter.name === "searchQuery")
          // User directory filters (2026-11-01): optional role and department filters on the user list; additive only.
          || (path === "/api/v1/user" && (parameter.name === "roleId" || parameter.name === "departmentId"))));
      });
      const responses = object(operation.responses ?? null);
      if (!("409" in object(original.responses ?? null))) delete responses["409"];
      // Costing (2026-10-31): customer pricing-agreement operations declare their response types and error statuses, and the
      // 204 the server always sent for PUT/DELETE in place of an undeclared 200; requests are unchanged.
      if (path.startsWith("/api/v1/customers/{id}/pricing-agreements")) {
        const before = object(original.responses ?? null);
        if ("204" in responses && !("204" in before) && "200" in before) { delete responses["204"]; responses["200"] = before["200"] ?? null; }
        for (const code of Object.keys(responses)) if (!(code in object(original.responses ?? null))) delete responses[code];
        for (const value of Object.values(responses)) delete object(value).content;
      }
      assert.deepEqual(operation, original, `${verb.toUpperCase()} ${path}`);
    }
  }
  assert.deepEqual(Object.keys(paths).filter((path) => !(path in object(before.paths ?? null))), [
    // System alert recipients (2026-10-31): replaces an alert's roles and users only; additive only.
    "/api/v1/alert/{alertId}/recipients",
    // Admin user password reset (2026-10-31): one account sets another user's password; additive only.
    "/api/v1/auth/admin/user-password",
    "/api/v1/product/{productId}/packing/approved-product", "/api/v1/production-schedule/activity/{activityId}/step/{stepId}/records", "/api/v1/report/production-readiness", "/api/v1/report/history/capabilities", "/api/v1/report/history/vendors",
    // Opening-stock migration (2026-10-30): staged upload, row checks and approval; additive only.
    "/api/v1/stock-migrations", "/api/v1/stock-migrations/{id}", "/api/v1/stock-migrations/{id}/lines", "/api/v1/stock-migrations/{id}/lines/{lineId}",
    "/api/v1/stock-migrations/{id}/units", "/api/v1/stock-migrations/{id}/recheck", "/api/v1/stock-migrations/{id}/comparison", "/api/v1/stock-migrations/{id}/approve",
    // Finance costing (2026-10-31): list prices with their currency and agreements across customers; additive only.
    "/api/v1/costing/list-prices", "/api/v1/costing/list-prices/{productId}/history", "/api/v1/costing/list-prices/{productId}", "/api/v1/costing/pricing-agreements", "/api/v1/costing/pricing-agreements/{id}",
    // An explicit nullable assignment supplements the unchanged legacy URL.
    "/api/v1/user/switch-department",
    // Procedure repair (2026-11-01): re-applies a product's current procedure to one running batch's upcoming steps; additive only.
    "/api/v1/production-schedule/activity/{productionActivityId}/repair-procedure",
    // Stock requisition voucher (2026-11-01): reads the requisition of an issue for its warehouse check; additive only.
    "/api/v1/requisition/issue/{issueId}",
    // QA issued BMR report (2026-11-02): read-only issue-date query; additive only.
    "/api/v1/report/bmr-issued",
    // Material repairs (2026-11-02): read-only previews and explicit apply, one material kind at a time.
    "/api/v1/production-schedule/activity/{activityId}/repair-bom/preview", "/api/v1/production-schedule/activity/{activityId}/repair-bom",
    "/api/v1/production-schedule/activity/{activityId}/repair-packaging/preview", "/api/v1/production-schedule/activity/{activityId}/repair-packaging",
    // Migration validity correction and additive stock top-up drafts (2026-11-03).
    "/api/v1/material/batch/{batchId}/migration-retest-date",
    "/api/v1/stock-migrations/top-ups/upload", "/api/v1/stock-migrations/top-ups",
    "/api/v1/issued-bmrs", "/api/v1/issued-bmrs/{id}/history", "/api/v1/issued-bmrs/{id}/batch-number",
    "/api/v1/issued-bmrs/{id}/revisions", "/api/v1/issued-bmrs/{id}/revisions/{revisionId}/review"]);
  const schemas = object(object(current.components ?? null).schemas ?? null);
  for (const name of ["IssuedBmrPage", "IssuedBmrRow", "IssuedBmrHistory", "IssuedBmrChangeDto", "IssuedBmrRevisionDto",
    "IssuedBmrRevisionStatus", "CorrectIssuedBmrNumber", "RequestIssuedBmrRevision", "ReviewIssuedBmrRevision"])
    delete schemas[`DOMAIN.Entities.Products.Production.${name}`];
  delete schemas["DOMAIN.Entities.Materials.Batch.UpdateMigrationRetestDate"];
  for (const name of ["MaterialBatchDto", "MaterialBatchListDto", "MaterialBatchReducedDto", "DistributedMaterialBatchDto"]) {
    const properties = object(object(schemas[`DOMAIN.Entities.Materials.Batch.${name}`] ?? null).properties ?? null);
    delete properties.effectiveExpiryDate;
    if (name === "MaterialBatchDto") delete properties.isOpeningBalanceBatch;
  }
  delete object(object(schemas["DOMAIN.Entities.Reports.Warehouse.ReservedMaterialReportDto"] ?? null).properties ?? null).effectiveExpiryDate;

  for (const name of ["IssuedBmrReportDto", "IssuedBmrReportRowDto"])
    delete schemas[`DOMAIN.Entities.Reports.${name}`];
  delete schemas["DOMAIN.Entities.Reports.ReportHistoryCapabilitiesDto"];
  for (const name of ["ProductionStepAnalysisDto", "ProductionStepExtraMaterialDto", "ProductionStepRecordsDto"])
    delete schemas[`DOMAIN.Entities.Products.Production.${name}`];
  for (const name of ["DefinitionReadiness", "PlannedProductReadinessDto", "ProductConfigurationDto", "ProductReadiness",
    "ProductionReadinessGroupDto", "ProductionReadinessReportDto", "ProductionReadinessRowDto", "ProductionReadinessTotalsDto", "ReadinessMarketDto"])
    delete schemas[`DOMAIN.Entities.Reports.${name}`];
  for (const name of Object.keys(schemas)) if (name.includes("DOMAIN.Entities.Materials.StockMigrations.")) delete schemas[name];
  delete schemas["DOMAIN.Entities.Auth.AdminResetUserPasswordRequest"];
  delete schemas["DOMAIN.Entities.Users.Request.SwitchDepartmentRequest"];
  delete schemas["DOMAIN.Entities.Alerts.UpdateAlertRecipientsRequest"];
  // Procedure repair and voucher signatures (2026-11-01): new response schemas; the requisition gains one optional property below.
  delete schemas["DOMAIN.Entities.Products.Production.ProductionProcedureRepairResult"];
  delete schemas["DOMAIN.Entities.Requisitions.VoucherSignatoryDto"];
  delete schemas["DOMAIN.Entities.Requisitions.StockIssueSignatoriesDto"];
  for (const name of ["ProductionMaterialRepairPreview", "ProductionMaterialRepairLine", "ProductionMaterialRepairResult", "ApplyProductionMaterialRepair"])
    delete schemas[`DOMAIN.Entities.Products.Production.${name}`];
  // Repaired stock requisitions bind approvals to a content revision; all three fields are additive and optional on transport.
  for (const name of ["Approvals.ApprovalEntity", "Approvals.ApprovalRequestBody", "Requisitions.RequisitionDto"])
    delete object(object(schemas[`DOMAIN.Entities.${name}`] ?? null).properties ?? null).contentRevision;
  // Finance costing (2026-10-31): new costing schemas, and one optional currency property on each list-price and report schema.
  for (const name of Object.keys(schemas)) if (name.includes("DOMAIN.Entities.Costing.") || name.includes("DOMAIN.Entities.Customers.CustomerPricingAgreementDto")) delete schemas[name];
  const added: Readonly<Record<string, string>> = { "Products.CreateProductRequest": "priceCurrencyId", "Products.UpdateProductRequest": "priceCurrencyId", "Products.Product": "priceCurrencyId",
    "Products.ProductDto": "priceCurrencyId", "Products.ProductListDto": "priceCurrencyId", "Products.ProductPrices": "currencyId", "ProductionSchedules.ProductionScheduleReportDto": "currency",
    "ProductionSchedules.ProductionScheduleDetailedReportDto": "currency", "Reports.FinishedGoodsTransferNotes.InvoicedProductsSummaryReportDto": "currency", "Reports.FinishedGoodsTransferNotes.InvoicedProductsDetailedReportDto": "currency",
    // Stock requisition voucher (2026-11-01): who signs the voucher, optional on the requisition.
    "Requisitions.RequisitionDto": "signatories" };
  for (const [name, property] of Object.entries(added)) delete object(object(schemas[`DOMAIN.Entities.${name}`] ?? null).properties ?? null)[property];
  // Costing (2026-10-31): a product's price became optional on create and update (list prices are set in Costing), so its minimum is now 0.
  for (const name of ["CreateProductRequest", "UpdateProductRequest"]) {
    const properties = object(object(schemas[`DOMAIN.Entities.Products.${name}`] ?? null).properties ?? null);
    const reviewed = object(object(object(object(before.components ?? null).schemas ?? null)[`DOMAIN.Entities.Products.${name}`] ?? null).properties ?? null);
    properties.price = reviewed.price ?? null;
  }
  assert.deepEqual(current.components, before.components);
  assert.deepEqual(current.security, before.security);
});

test("department switching requires an explicit nullable assignment and keeps the legacy URL", () => {
  const contract = object(parse(readFileSync("contracts/openapi/backend.v1.json", "utf8")));
  const paths = object(contract.paths ?? null);
  const operation = object(object(paths["/api/v1/user/switch-department"] ?? null).post ?? null);
  assert.ok(object(operation.responses ?? null)["204"]);
  const schema = object(object(object(contract.components ?? null).schemas ?? null)["DOMAIN.Entities.Users.Request.SwitchDepartmentRequest"] ?? null);
  assert.deepEqual(schema.required, ["departmentId"]);
  const department = object(object(schema.properties ?? null).departmentId ?? null);
  assert.equal(department.nullable, true);
  assert.equal(department.format, "uuid");
  assert.ok(paths["/api/v1/user/switch-department/{departmentId}"]);
});

test("alert recipients have their own endpoint that takes only roles and users", () => {
  const contract = object(parse(readFileSync("contracts/openapi/backend.v1.json", "utf8")));
  const operation = object(object(object(contract.paths ?? null)["/api/v1/alert/{alertId}/recipients"] ?? null).put ?? null);
  assert.ok(object(operation.responses ?? null)["204"]);
  const schema = object(object(object(contract.components ?? null).schemas ?? null)["DOMAIN.Entities.Alerts.UpdateAlertRecipientsRequest"] ?? null);
  assert.deepEqual(Object.keys(object(schema.properties ?? null)).sort(), ["roleIds", "userIds"]);
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

test("issued BMR reporting adds only a typed date-range query under the existing security contract", () => {
  const current = object(parse(readFileSync("contracts/openapi/backend.v1.json", "utf8")));
  const operation = object(object(object(current.paths ?? null)["/api/v1/report/bmr-issued"] ?? null).get ?? null);
  assert.equal(operation.operationId, "GetIssuedBmrReport");
  assert.deepEqual(operation.tags, ["Report"]);
  assert.ok(Array.isArray(operation.parameters));
  assert.deepEqual(operation.parameters.map((entry) => object(entry)).filter((entry) => entry.in === "query")
    .map((entry) => ({ name: entry.name, required: entry.required ?? false })), [
      { name: "startDate", required: true }, { name: "endDate", required: true }, { name: "departmentId", required: false },
    ]);
  assert.deepEqual(current.security, reviewedImport().security);
});

test("the separate legacy host-Nginx verifier retains both reviewed exact documents", async () => {
  for (const document of [customer, reviewedImport()]) {
    checkCompatibility(hostConfig, policy, contractDigest(document));
  }
});

test("the reviewed report, repair and migration contract passes release validation", () => {
  const current = parse(readFileSync("contracts/openapi/backend.v1.json", "utf8"));
  const digest = contractDigest(current);
  assert.ok(policy.backendContracts.includes("a485b5e6830f1102c312ad08b9ddd4a9992ce64109018a5b59961294b47496fe"));
  assert.equal(digest, "72b0d96542fd4728f86f4dc0f80986021abed7569010420a0734296e12bb219f");
  checkCompatibility(hostConfig, policy, digest);
  const check = spawnSync(process.execPath, ["deploy/customer-server/check-release.ts"], { encoding: "utf8" });
  assert.equal(check.status, 0, check.stderr);
  assert.match(check.stdout, new RegExp(`Approved backend contract: ${digest}`));
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
  for (const source of [raw, readFileSync("contracts/openapi/backend.v1.json", "utf8")]) {
    for (const change of changes) {
      const changed = object(parse(source)); change(changed);
      assert.throws(() => checkCompatibility(hostConfig, policy, contractDigest(changed)), /has not been approved/);
    }
  }
});
