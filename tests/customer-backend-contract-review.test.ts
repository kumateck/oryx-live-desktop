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

/** Finished goods adds only its owned paths, DTO fields and two allocation statuses. */
function stripFinishedGoods(document: ObjectValue) {
  stripVendorListDelete(document);
  const scope = object(parse(readFileSync("contracts/openapi/reviewed/finished-goods-scope.json", "utf8")));
  const paths = object(document.paths ?? null);
  const schemas = object(object(document.components ?? null).schemas ?? null);
  for (const path of Array.isArray(scope.addedPaths) ? scope.addedPaths : []) if (typeof path === "string") delete paths[path];
  for (const name of Array.isArray(scope.addedSchemas) ? scope.addedSchemas : []) if (typeof name === "string") delete schemas[name];
  for (const [name, fields] of Object.entries(object(scope.addedFields ?? null))) {
    const schema = object(schemas[name] ?? null);
    for (const field of Array.isArray(fields) ? fields : []) if (typeof field === "string") delete object(schema.properties ?? null)[field];
  }
  for (const [name, values] of Object.entries(object(scope.previousEnums ?? null))) object(schemas[name] ?? null).enum = values;
}

/** Product assay reporting adds only its owned operation/schemas and optional recorded-result fields. */
const assayReportingSchemas = ["DOMAIN.Entities.ProductSpecifications.AssayOutputDto", "DOMAIN.Entities.ProductSpecifications.AssayReportedResultDto", "DOMAIN.Entities.ProductSpecifications.AssayReportingConfigurationDto", "DOMAIN.Entities.ProductSpecifications.AssayReportingFieldDto", "DOMAIN.Entities.ProductSpecifications.AssayReportingRule", "DOMAIN.Entities.ProductSpecifications.SaveAssayReportingRequest"] as const;
function stripPendingCoaReview(document: ObjectValue) {
  const schemas = object(object(document.components ?? null).schemas ?? null);
  delete object(object(schemas["DOMAIN.Entities.Forms.ResponseDetailDto"] ?? null).properties ?? null).coaReportingToken;
  const operation = object(object(object(document.paths ?? null)["/api/v1/approval/approve/{modelType}/{modelId}"] ?? null).post ?? null);
  if (Array.isArray(operation.parameters)) operation.parameters = operation.parameters.filter(parameter => object(parameter).name !== "If-Match");
}

function stripClearMaterialDensity(document: ObjectValue) {
  const paths = object(document.paths ?? null);
  for (const kind of ["raw", "packaging"]) delete paths[`/api/v1/material/${kind}/{materialId}/density`];
}

function stripWarehouseVisibility(document: ObjectValue) {
  stripClearMaterialDensity(document);
  const paths = object(document.paths ?? null);
  delete paths["/api/v1/stock-issue/raw"];
  delete paths["/api/v1/stock-issue/packaging"];
  const schemas = object(object(document.components ?? null).schemas ?? null);
  delete schemas["API.Controllers.StockIssueQueueDto"];
  for (const field of ["productCode", "productStage", "materialName", "materialCode"])
    delete object(object(schemas["DOMAIN.Entities.Approvals.ApprovalEntity"] ?? null).properties ?? null)[field];
  delete object(object(schemas["DOMAIN.Entities.AnalyticalTestRequests.AnalyticalTestRequestDto"] ?? null).properties ?? null).coaStatus;
}

function stripAssayReporting(document: ObjectValue) {
  stripWarehouseVisibility(document);
  stripPendingCoaReview(document);
  delete object(document.paths ?? null)["/api/v1/product-specifications/{id}/assay-reporting"];
  const schemas = object(object(document.components ?? null).schemas ?? null);
  for (const name of assayReportingSchemas) delete schemas[name];
  const properties = object(object(schemas["DOMAIN.Entities.Forms.FormResponseDto"] ?? null).properties ?? null);
  delete properties.coaReportedResults;
  delete properties.coaReportingError;
}

/** Superseded vendor-list deletion adds one operation without changing existing document contracts. */
function stripVendorListDelete(document: ObjectValue) {
  stripAssayReporting(document);
  delete object(object(document.paths ?? null)["/api/v1/approved-vendor-list/{id}"] ?? null).delete;
}

/** Versioned division price sheets and optional saved-price provenance are additive. */
const costingSchemas = ["APP.Utils.Paginateable`1[[System.Collections.Generic.IEnumerable`1[[DOMAIN.Entities.Costing.CostingPackingOptionDto, DOMAIN, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null]], System.Private.CoreLib, Version=9.0.0.0, Culture=neutral, PublicKeyToken=7cec85d7bea7798e]]", "APP.Utils.Paginateable`1[[System.Collections.Generic.IEnumerable`1[[DOMAIN.Entities.Costing.CostingPriceListLineDto, DOMAIN, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null]], System.Private.CoreLib, Version=9.0.0.0, Culture=neutral, PublicKeyToken=7cec85d7bea7798e]]", "DOMAIN.Entities.Costing.CostingPackingOptionDto", "DOMAIN.Entities.Costing.CostingPriceListDetailDto", "DOMAIN.Entities.Costing.CostingPriceListLineDto", "DOMAIN.Entities.Costing.CostingPriceListPageDto", "DOMAIN.Entities.Costing.CostingPriceListPrintDto", "DOMAIN.Entities.Costing.CostingPriceListSignatoryDto", "DOMAIN.Entities.Costing.CostingPriceListStatus", "DOMAIN.Entities.Costing.CostingPriceListSummaryDto", "DOMAIN.Entities.Costing.PrepareCostingPriceListRequest", "DOMAIN.Entities.Costing.SaveCostingPriceListLineRequest", "DOMAIN.Entities.Costing.SubmitCostingPriceListRequest", "DOMAIN.Entities.Costing.UpdateCostingPriceListRequest"] as const;
const costingFields: Record<string, readonly string[]> = {"DOMAIN.Entities.ProductionOrders.AllocateProductionOrderProductDto": ["unitPrice", "priceCurrencyId", "priceListRevisionId"],"DOMAIN.Entities.ProformaInvoices.CreateProformaInvoiceProduct": ["productPackingId"], "DOMAIN.Entities.ProformaInvoices.ProformaInvoiceProductDto": ["productPackingId", "unitPrice", "priceCurrencyId", "priceListRevisionId"]};
function stripVersionedCosting(document: ObjectValue) {
  stripFinishedGoods(document);
  const paths = object(document.paths ?? null);
  for (const path of Object.keys(paths)) if (path.startsWith("/api/v1/costing/price-lists")) delete paths[path];
  const operation = object(object(paths["/api/v1/costing/list-prices"] ?? null).get ?? null);
  if (Array.isArray(operation.parameters)) operation.parameters = operation.parameters.filter((entry) => object(entry).name !== "division");
  const schemas = object(object(document.components ?? null).schemas ?? null);
  for (const name of costingSchemas) delete schemas[name];
  for (const [name,fields] of Object.entries(costingFields)) for (const field of fields) delete object(object(schemas[name] ?? null).properties ?? null)[field];
}

function stripCountingUnit(document: ObjectValue) {
  const paths = object(document.paths ?? null);
  for (const path of Object.keys(paths)) if (path.includes("/counting-unit")) delete paths[path];
  const schemas = object(object(document.components ?? null).schemas ?? null);
  for (const name of [
    "MaterialCountingUnitPreview",
    "CountingUnitValue",
    "CountingUnitRecord",
    "ChangeMaterialCountingUnit",
    "MaterialCountingUnitResult",
  ]) delete schemas[`DOMAIN.Entities.Materials.${name}`];
}

function stripBinCardPage(document: ObjectValue) {
  const paths = object(document.paths ?? null);
  const schemas = object(object(document.components ?? null).schemas ?? null);
  if (schemas["APP.Utils.BinCardPage"] === undefined) return;

  const oldPage = "APP.Utils.Paginateable`1[[System.Collections.Generic.IEnumerable`1[[DOMAIN.Entities.BinCards.BinCardInformationDto, DOMAIN, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null]], System.Private.CoreLib, Version=9.0.0.0, Culture=neutral, PublicKeyToken=7cec85d7bea7798e]]";
  const operation = object(object(paths["/api/v1/warehouse/bincardinformation/{materialId}/{departmentId}"] ?? null).get ?? null);
  const responses = object(operation.responses ?? null);
  const response = object(responses["200"] ?? null);
  for (const content of Object.values(object(response.content ?? null))) {
    const schema = object(content).schema;
    if (schema !== undefined && object(schema).$ref === "#/components/schemas/APP.Utils.BinCardPage")
      object(content).schema = { $ref: `#/components/schemas/${oldPage}` };
  }
  delete responses["409"];
  delete schemas["APP.Utils.BinCardPage"];
  schemas[oldPage] = {
    type: "object",
    properties: {
      data: { type: "array", items: { $ref: "#/components/schemas/DOMAIN.Entities.BinCards.BinCardInformationDto" }, nullable: true },
      pageIndex: { type: "integer", format: "int32" },
      pageCount: { type: "integer", format: "int32" },
      totalRecordCount: { type: "integer", format: "int32" },
      numberOfPagesToShow: { type: "integer", format: "int32" },
      startPageIndex: { type: "integer", format: "int32" },
      stopPageIndex: { type: "integer", format: "int32" },
    },
    additionalProperties: false,
  };
}

/** Structured STP revisions and specification tests citing them (2026-11-27): only their own paths and DOMAIN.Entities.StpRevisions.* schemas. */
function stripStpRevisions(document: ObjectValue) {
  const paths = object(document.paths ?? null);
  for (const path of Object.keys(paths)) if (path.startsWith("/api/v1/stp-revisions") || path.startsWith("/api/v1/stp-test-links")) delete paths[path];
  const schemas = object(object(document.components ?? null).schemas ?? null);
  for (const name of Object.keys(schemas)) if (name.startsWith("DOMAIN.Entities.StpRevisions.")) delete schemas[name];
}

/** Specification microbial template (2026-11-27): optional microbialFormId / microbialForm on specification requests, DTOs and entities. */
function stripSpecificationMicrobialTemplate(document: ObjectValue) {
  const schemas = object(object(document.components ?? null).schemas ?? null);
  for (const kind of ["Material", "Product"]) {
    const prefix = `DOMAIN.Entities.${kind}Specifications.`;
    for (const name of [`Create${kind}SpecificationRequest`, `Update${kind}SpecificationRequest`, `${kind}SpecificationDto`, `${kind}Specification`]) {
      const properties = object(object(schemas[prefix + name] ?? null).properties ?? null);
      delete properties.microbialFormId;
      delete properties.microbialForm;
    }
  }
}

/** Microbial testing (2026-11-27): question types 15–20, the specification microbial-limits paths and their owned schemas. */
function stripMicrobialTesting(document: ObjectValue) {
  const paths = object(document.paths ?? null);
  for (const path of ["/api/v1/material-specifications/{id}/microbial-limits", "/api/v1/product-specifications/{id}/microbial-limits"]) delete paths[path];
  const schemas = object(object(document.components ?? null).schemas ?? null);
  for (const name of ["MicrobialLimitDto", "MicrobialLimitFieldDto", "MicrobialLimitKind", "MicrobialLimitRequest", "SaveMicrobialLimitsRequest", "SpecificationMicrobialLimitsDto"])
    delete schemas[`DOMAIN.Entities.Forms.${name}`];
  const questionType = object(schemas["DOMAIN.Entities.Forms.QuestionType"] ?? null);
  if (Array.isArray(questionType.enum)) questionType.enum = questionType.enum.filter((value) => typeof value !== "number" || value < 15);
}

function beforeProductionBoardOrder() {
  const document = object(parse(readFileSync("contracts/openapi/backend.v1.json", "utf8")));
  stripStpRevisions(document);
  stripMicrobialTesting(document);
  stripSpecificationMicrobialTemplate(document);
  stripCountingUnit(document);
  stripBinCardPage(document);
  delete object(document.paths ?? null)["/api/v1/production-board-order/{departmentId}"];
  const schemas = object(object(document.components ?? null).schemas ?? null);
  for (const name of ["ProductionBoardOrderDto", "ProductionBoardOperationDto", "SaveProductionBoardOrder"])
    delete schemas["DOMAIN.Entities.Base." + name];
  return document;
}

function beforeMaterialStockTrace() {
  const document = beforeProductionBoardOrder();
  const paths = object(document.paths ?? null);
  for (const path of Object.keys(paths)) if (path.startsWith("/api/v1/material-stock-trace/")) delete paths[path];
  const schemas = object(object(document.components ?? null).schemas ?? null);
  for (const name of Object.keys(schemas)) if (name.startsWith("DOMAIN.Entities.Materials.Batch.MaterialStockTrace")) delete schemas[name];
  return document;
}

function beforePendingCertificateChanges() {
  const document = beforeMaterialStockTrace();
  const paths = object(document.paths ?? null);
  for (const path of Object.keys(paths)) {
    if (path.startsWith("/api/v1/pending-certificates/")) delete paths[path];
  }
  const schemas = object(object(document.components ?? null).schemas ?? null);
  const prefix = "DOMAIN.Entities.Forms.";
  for (const name of ["CertificateReturnKind", "RequestCertificateChange", "SavePendingCertificate"]) delete schemas[prefix + name];
  const detail = object(object(schemas[prefix + "ResponseDetailDto"] ?? null).properties ?? null);
  for (const field of ["coaSubjectKind", "coaVersion", "coaReturnKind", "coaReturnReason", "certificateNotes"]) delete detail[field];
  const notification = object(schemas["DOMAIN.Entities.Notifications.NotificationType"] ?? null);
  if (!Array.isArray(notification.enum)) throw new Error("Notification enum is missing.");
  notification.enum = notification.enum.filter(value => value !== 21);
  return document;
}

/** Earlier contract reviews predate the vendor-list draft workflow. */
function beforeVendorListDrafts() {
  const document = beforePendingCertificateChanges();
  const paths = object(document.paths ?? null);
  const root = "/api/v1/approved-vendor-list/{id}";
  delete paths[`${root}/draft`];
  delete paths[`${root}/submit`];
  const deletion = object(object(paths[root] ?? null).delete ?? null);
  if (Array.isArray(deletion.parameters)) deletion.parameters = deletion.parameters.filter(parameter => object(parameter).name !== "reason");
  const schemas = object(object(document.components ?? null).schemas ?? null);
  const prefix = "DOMAIN.Entities.ApprovedVendorLists.";
  delete schemas[prefix + "SaveApprovedVendorListDraftRequest"];
  delete schemas[prefix + "SubmitApprovedVendorListRequest"];
  object(schemas[prefix + "ApprovedVendorListStatus"] ?? null).enum = [0, 1, 2, 3];
  delete object(object(schemas[prefix + "ApprovedVendorListDto"] ?? null).properties ?? null).draftVersion;
  const fields = object(object(schemas[prefix + "ApprovedVendorListLineDto"] ?? null).properties ?? null);
  for (const field of ["newManufacturer", "newSupplier", "newSupplierAddress", "newSupplierType"]) delete fields[field];
  for (const field of ["manufacturerId", "supplierId"]) delete object(fields[field] ?? null).nullable;
  return document;
}

/** Historical contract reviews exclude only the two optional material-lookup context parameters. */
const materialLookupPaths = ["/api/v1/material/department", "/api/v1/material/{materialId}/uom"] as const;
function stripMaterialLookupContext(document: ObjectValue) {
  stripVersionedCosting(document);
  for (const path of materialLookupPaths) {
    const operation = object(object(object(document.paths ?? null)[path] ?? null).get ?? null);
    if (Array.isArray(operation.parameters)) operation.parameters = operation.parameters.filter((entry) => object(entry).name !== "context");
  }
}
function beforeMaterialLookupContext() {
  const document = beforeVendorListDrafts();
  stripMaterialLookupContext(document);
  return document;
}

/** BOM substitute quantities and the store's material choice (2026-11-14): one path, five owned schemas, eight optional fields. */
const bomSubstituteFields: Record<string, readonly string[]> = {
  "DOMAIN.Entities.BillOfMaterials.BillOfMaterialItemSubstitute": ["baseQuantity", "baseUoMId", "baseUoM", "prescribedQuantity"],
  "DOMAIN.Entities.BillOfMaterials.BillOfMaterialItemSubstituteDto": ["baseQuantity", "baseUoM", "prescribedQuantity"],
  "DOMAIN.Entities.BillOfMaterials.Request.CreateBoMItemsRequest": ["substitutes"],
  "DOMAIN.Entities.Requisitions.RequisitionItemDto": ["substituteFor"],
};
const bomSubstituteSchemas = ["DOMAIN.Entities.BillOfMaterials.Request.CreateBoMSubstituteRequest", "DOMAIN.Entities.Requisitions.ChooseStockRequisitionMaterialRequest",
  "DOMAIN.Entities.Requisitions.StockRequisitionMaterialOptionBatchDto", "DOMAIN.Entities.Requisitions.StockRequisitionMaterialOptionDto",
  "DOMAIN.Entities.Requisitions.StockRequisitionMaterialOptionsDto"];
function stripBomSubstituteQuantities(document: ObjectValue) {
  const schemas = object(object(document.components ?? null).schemas ?? null);
  delete object(document.paths ?? null)["/api/v1/requisition/{requisitionId}/material-options"];
  for (const name of bomSubstituteSchemas) delete schemas[name];
  delete schemas["DOMAIN.Entities.Products.CreateProductPackageSubstituteRequest"];
  for (const [name, fields] of Object.entries(bomSubstituteFields)) {
    const properties = object(object(schemas[name] ?? null).properties ?? null);
    for (const field of fields) delete properties[field];
  }
}
/** Specification revision reason (2026-11-16): required on both edit requests, optional on the DTOs; history rows add reason and effective date. */
const specificationReasonFields: Record<string, readonly string[]> = {
  "DOMAIN.Entities.MaterialSpecifications.UpdateMaterialSpecificationRequest": ["revisionReason"],
  "DOMAIN.Entities.ProductSpecifications.UpdateProductSpecificationRequest": ["revisionReason"],
  "DOMAIN.Entities.MaterialSpecifications.MaterialSpecificationDto": ["revisionReason"],
  "DOMAIN.Entities.ProductSpecifications.ProductSpecificationDto": ["revisionReason"],
  "DOMAIN.Entities.Specifications.SpecificationPrintRevision": ["reason", "effectiveDate"],
};
function stripSpecificationRevisionReason(document: ObjectValue) {
  const schemas = object(object(document.components ?? null).schemas ?? null);
  delete schemas["DOMAIN.Entities.Products.CreateProductPackageSubstituteRequest"];
  for (const [name, fields] of Object.entries(specificationReasonFields)) {
    const schema = object(schemas[name] ?? null);
    for (const field of fields) delete object(schema.properties ?? null)[field];
    if (Array.isArray(schema.required)) schema.required = schema.required.filter((entry) => typeof entry !== "string" || !fields.includes(entry));
  }
}

/** Requisition issued filter (2026-11-17): one optional boolean query parameter on the store's requisition list. */
const requisitionListPath = "/api/v1/requisition/department";
function stripRequisitionIssuedFilter(document: ObjectValue) {
  const operation = object(object(object(document.paths ?? null)[requisitionListPath] ?? null).get ?? null);
  if (Array.isArray(operation.parameters)) operation.parameters = operation.parameters.filter((entry) => object(entry).name !== "issued");
}

/** Packaging issue quantity (2026-11-17): one typed PUT, its request schema, and four optional fields on the requisition line. */
const issuedQuantityPath = "/api/v1/requisition/{requisitionId}/items/{itemId}/issued-quantity";
const issuedQuantityFields = ["issuedQuantity", "issueAdjustmentReason", "issueAdjustedBy", "issueAdjustedAt"] as const;
function stripPackagingIssueQuantity(document: ObjectValue) {
  const schemas = object(object(document.components ?? null).schemas ?? null);
  delete object(document.paths ?? null)[issuedQuantityPath];
  delete schemas["DOMAIN.Entities.Requisitions.AdjustIssuedQuantityRequest"];
  const properties = object(object(schemas["DOMAIN.Entities.Requisitions.RequisitionItemDto"] ?? null).properties ?? null);
  for (const field of issuedQuantityFields) delete properties[field];
}

/** IT approval transfer (2026-11-17): one typed read listing everyone named on an approval document. */
const usersOnRecordPath = "/api/v1/approval/users-on-record";
function stripApprovalUsersOnRecord(document: ObjectValue) {
  delete object(document.paths ?? null)[usersOnRecordPath];
}

/** Material retest on the material test (2026-11-18): an AR number on the sample, read-only retest fields and three statuses. */
const retestDetailFields = ["arNumber", "materialSamplingId", "batchStatus", "materialName", "materialCode"] as const;
function stripMaterialRetestAtr(document: ObjectValue) {
  const schemas = object(object(document.components ?? null).schemas ?? null);
  const sample = object(schemas["DOMAIN.Entities.Materials.Batch.RecordMaterialRetestSample"] ?? null);
  delete object(sample.properties ?? null).arNumber;
  if (Array.isArray(sample.required)) sample.required = sample.required.filter((name) => name !== "arNumber");
  const detail = object(object(schemas["APP.Services.Materials.MaterialRetestDetailDto"] ?? null).properties ?? null);
  for (const field of retestDetailFields) delete detail[field];
  object(schemas["DOMAIN.Entities.Materials.Batch.MaterialRetestStatus"] ?? null).enum = [0, 1, 2, 3, 4, 5, 6];
}

/** Template repair (2026-11-18): four new forms-domain operations and owned schemas only. */
function stripTemplateRepairs(document: ObjectValue) {
  const paths = object(document.paths ?? null);
  for (const path of Object.keys(paths)) if (path.startsWith("/api/v1/template-repairs/") || path.startsWith("/api/v1/test-field-reassignments/")) delete paths[path];
  const schemas = object(object(document.components ?? null).schemas ?? null);
  for (const name of Object.keys(schemas)) if (name.startsWith("APP.Services.Forms.") && /TemplateRepair|TestFieldReassignment|ReassignTestFields/.test(name)) delete schemas[name];
  delete schemas["DOMAIN.Entities.Products.CreateProductPackageSubstituteRequest"];
  for (const [name, fields] of Object.entries({ "DOMAIN.Entities.AnalyticalTestRequests.AnalyticalTestRequestDto": ["testedAt", "testedBy"], "DOMAIN.Entities.Forms.ResponseDetailDto": ["approvedBy", "approvedAt"], "DOMAIN.Entities.Products.CreateProductPackageRequest": ["substitutes"], "DOMAIN.Entities.Products.ProductPackageSubstituteDto": ["prescribedQuantity"] })) {
    const properties = object(object(schemas[name] ?? null).properties ?? null);
    for (const field of fields) delete properties[field];
  }
}

/** Upcoming batch issues (2026-11-18): two typed reads, their schemas, and the started batch a swap may name. */
const upcomingPaths = ["/api/v1/upcoming-batch-issues", "/api/v1/upcoming-batch-issues/{productionScheduleProductId}/alternative-batches"] as const;
const upcomingSchemas = ["UpcomingBatchIssue", "UpcomingBatchIssuePage", "UpcomingBatchMaterial"].map((name) => `DOMAIN.Entities.Products.Production.${name}`);
function stripUpcomingBatchIssues(document: ObjectValue) {
  const paths = object(document.paths ?? null);
  for (const path of upcomingPaths) delete paths[path];
  const schemas = object(object(document.components ?? null).schemas ?? null);
  for (const name of upcomingSchemas) delete schemas[name];
  delete object(object(schemas["DOMAIN.Entities.Warehouses.CreateSwapRequest"] ?? null).properties ?? null).productionScheduleProductId;
}

const sharedDensityFields = {
  "DOMAIN.Entities.Materials.Material": ["densityGramsPerMilliliter"],
  "DOMAIN.Entities.Materials.MaterialDto": ["densityGramsPerMilliliter"],
  "DOMAIN.Entities.Materials.MaterialWithWarehouseStockDto": ["densityGramsPerMilliliter"],
  "DOMAIN.Entities.Materials.Batch.MaterialBatchReservedQuantity": ["densityGramsPerMilliliter"],
  "DOMAIN.Entities.Materials.Batch.BatchToSupply": ["sourceQuantityToTake"],
  "DOMAIN.Entities.Materials.HoldingMaterialTransferBatchDto": ["destinationQuantity", "destinationUoM", "receivedAt"],
};
function stripSharedDensity(document: ObjectValue) {
  const schemas = object(object(document.components ?? null).schemas ?? null);
  for (const [name, fields] of Object.entries(sharedDensityFields))
    for (const field of fields) delete object(object(schemas[name] ?? null).properties ?? null)[field];
}

/** Pre-COA correction return imports only three variant paths and their three owned DTOs. */
function stripTestCorrections(document: ObjectValue) {
  const paths = object(document.paths ?? null);
  for (const path of Object.keys(paths)) if (path.startsWith("/api/v1/test-corrections/")) delete paths[path];
  const schemas = object(object(document.components ?? null).schemas ?? null);
  for (const name of ["TestCorrectionStateDto", "TestCorrectionHistoryItemDto", "ReturnTestForCorrectionRequest"])
    delete schemas[`APP.Services.Forms.${name}`];
}

/** Unstart reservation release adds only material-scoped repair endpoints and DTOs. */
function stripUnstartReservations(document: ObjectValue) {
  const paths = object(document.paths ?? null);
  for (const path of Object.keys(paths)) if (path.startsWith("/api/v1/unstart-reservations/")) delete paths[path];
  const schemas = object(object(document.components ?? null).schemas ?? null);
  for (const name of Object.keys(schemas)) if (name.startsWith("DOMAIN.Entities.Products.Production.") && /\.(UnstartReservationPreviewDto|UnstartReservationRowDto|ReleaseUnstartReservationsRequest|ReleaseUnstartReservationsResultDto)$/.test(name)) delete schemas[name];
}

/** Unstart leftovers: two variant paths and their repair-only DTOs. */
function stripUnstartLeftovers(document: ObjectValue) {
  const paths = object(document.paths ?? null);
  for (const path of Object.keys(paths)) if (path.startsWith("/api/v1/unstart-leftovers/")) delete paths[path];
  const schemas = object(object(document.components ?? null).schemas ?? null);
  for (const name of Object.keys(schemas)) if (name.startsWith("DOMAIN.Entities.Requisitions.") && /UnstartLeftover/.test(name)) delete schemas[name];
}

/** Cross-store units and substitutes (2026-11-19): across-warehouses uomId/uoM, forecast substitute fields, the start body. */
function stripStockUnitsSubstitutes(document: ObjectValue) {
  const paths = object(document.paths ?? null);
  const stock = object(object(paths["/api/v1/material/{materialId}/stock/across-warehouses"] ?? null).get ?? null);
  if (Array.isArray(stock.parameters)) stock.parameters = stock.parameters.filter((item) => object(item).name !== "uomId");
  delete object(object(paths["/api/v1/production-schedule/activity/start/{productionScheduleProductId}"] ?? null).post ?? null).requestBody;
  const schemas = object(object(document.components ?? null).schemas ?? null);
  delete object(object(schemas["DOMAIN.Entities.Warehouses.WarehouseStockDto"] ?? null).properties ?? null).uoM;
  const forecast = object(object(schemas["DOMAIN.Entities.ProductionSchedules.ForecastMaterialDto"] ?? null).properties ?? null);
  delete forecast.isSubstitute; delete forecast.substituteFor;
  delete schemas["DOMAIN.Entities.ProductionSchedules.StartProductionRequest"];
  delete schemas["DOMAIN.Entities.ProductionSchedules.StartProductionMaterialChoice"];
}

/** Issued register (2026-11-20): issued-bmrs filters, the register operation and its two schemas. */
function stripIssuedRegister(document: ObjectValue) {
  const paths = object(document.paths ?? null);
  const list = object(object(paths["/api/v1/issued-bmrs"] ?? null).get ?? null);
  if (Array.isArray(list.parameters)) list.parameters = list.parameters.filter((item) => !["departmentId", "productId", "issuedFrom", "issuedTo"].includes(String(object(item).name)));
  delete paths["/api/v1/issued-bmrs/register"];
  const schemas = object(object(document.components ?? null).schemas ?? null);
  delete schemas["DOMAIN.Entities.Products.Production.IssuedBmrRegister"];
  delete schemas["DOMAIN.Entities.Products.Production.IssuedBmrProductTotal"];
}

/** Substitute reasons (2026-11-20): substituteUnavailableReason on the batch material DTOs and ForecastMaterialDto. */
function stripSubstituteReasons(document: ObjectValue) {
  const schemas = object(object(document.components ?? null).schemas ?? null);
  for (const dto of ["ProductionScheduleProcurementDto", "ProductionScheduleProcurementPackageDto", "ForecastMaterialDto"])
    delete object(object(schemas[`DOMAIN.Entities.ProductionSchedules.${dto}`] ?? null).properties ?? null).substituteUnavailableReason;
}

/** Approved vendor list (2026-11-19): its nine operations, its owned schemas and the DocumentReviewStatus enum. */
function stripApprovedVendorList(document: ObjectValue) {
  const paths = object(document.paths ?? null);
  for (const path of Object.keys(paths)) if (path.startsWith("/api/v1/approved-vendor-list")) delete paths[path];
  const schemas = object(object(document.components ?? null).schemas ?? null);
  for (const name of Object.keys(schemas)) if (name.startsWith("DOMAIN.Entities.ApprovedVendorLists.")) delete schemas[name];
  delete schemas["DOMAIN.Entities.Reviews.DocumentReviewStatus"];
}

/** Transfer rejection reasons (2026-11-19): the reject body and its DTO, supplier/rejection fields and department-stock uomId. */
function stripTransferRejection(document: ObjectValue) {
  const paths = object(document.paths ?? null);
  delete object(object(paths["/api/v1/production-schedule/stock-transfer/reject/{stockTransferId}"] ?? null).put ?? null).requestBody;
  const stock = object(object(paths["/api/v1/material/{materialId}/department-stock/{quantity}"] ?? null).get ?? null);
  if (Array.isArray(stock.parameters)) stock.parameters = stock.parameters.filter((item) => object(item).name !== "uomId");
  const schemas = object(object(document.components ?? null).schemas ?? null);
  delete schemas["DOMAIN.Entities.ProductionSchedules.StockTransfers.Request.RejectStockTransferRequest"];
  const dto = object(object(schemas["DOMAIN.Entities.ProductionSchedules.StockTransfers.DepartmentStockTransferDto"] ?? null).properties ?? null);
  for (const key of ["supplierQuantity", "supplierUoM", "rejectionReason", "rejectedAt", "rejectedBy"]) delete dto[key];
}

/** Operation departments (2026-11-18): link/unlink paths and four optional department fields. */
function stripOperationDepartments(document: ObjectValue) {
  const paths = object(document.paths ?? null);
  delete paths["/api/v1/collection/operations/{operationId}/department/{departmentId}"];
  delete paths["/api/v1/collection/operations/{operationId}/department"];
  const schemas = object(object(document.components ?? null).schemas ?? null);
  const item = object(object(schemas["SHARED.CollectionItemDto"] ?? null).properties ?? null);
  delete item.linkedDepartmentId; delete item.linkedDepartmentName;
  const operation = object(object(schemas["DOMAIN.Entities.Base.OperationDto"] ?? null).properties ?? null);
  delete operation.departmentId; delete operation.departmentName;
}

/** The current contract without the latest additions, which the earlier reviews below compare against. */
function reviewedHead() {
  const document = beforeMaterialLookupContext();
  stripStpRevisions(document);
  stripCountingUnit(document);
  stripBinCardPage(document);
  stripIssuedRegister(document);
  stripSubstituteReasons(document);
  stripApprovedVendorList(document);
  stripStockUnitsSubstitutes(document);
  stripTransferRejection(document);
  stripProductionFollowups(document);
  stripOperationDepartments(document);
  stripTestCorrections(document);
  stripSharedDensity(document);
  stripUnstartReservations(document);
  stripUnstartLeftovers(document);
  stripUpcomingBatchIssues(document);
  stripTemplateRepairs(document);
  stripMaterialRetestAtr(document);
  stripApprovalUsersOnRecord(document);
  stripPackagingIssueQuantity(document);
  stripRequisitionIssuedFilter(document);
  stripSpecificationRevisionReason(document);
  stripBomSubstituteQuantities(document);
  return document;
}

/** White Placebo preparation (2026-11-06): its owned schemas and the optional material/requisition markers. */
function stripWhitePlacebo(schemas: ObjectValue) {
  for (const name of Object.keys(schemas)) if (name.startsWith("DOMAIN.Entities.Materials.WhitePlacebo.")) delete schemas[name];
  for (const name of ["Material", "MaterialDto", "MaterialWithWarehouseStockDto"])
    delete object(object(schemas[`DOMAIN.Entities.Materials.${name}`] ?? null).properties ?? null).isWhitePlacebo;
  delete object(object(schemas["DOMAIN.Entities.Requisitions.RequisitionDto"] ?? null).properties ?? null).whitePlaceboPreparationId;
}

const stockLocationFields: Record<string, readonly string[]> = {
  "DOMAIN.Entities.Materials.Batch.BatchToSupply": ["warehouseLocationShelf"],
  "DOMAIN.Entities.Warehouses.SwapShelfMaterialBatchDto": ["warehouseLocationShelf"],
  "DOMAIN.Entities.Requisitions.AlternativeBatchDto": ["warehouseLocationShelf"],
  "DOMAIN.Entities.Reports.Warehouse.ReservedMaterialReportDto": ["rackName", "shelfName"],
  "DOMAIN.Entities.Materials.WhitePlacebo.WhitePlaceboStockDto": ["rack"],
  "DOMAIN.Entities.Materials.WhitePlacebo.WhitePlaceboInputDto": ["warehouseLocationShelf"],
};
function stripStockLocations(schemas: ObjectValue) {
  delete schemas["DOMAIN.Entities.Products.CreateProductPackageSubstituteRequest"];
  for (const [name, fields] of Object.entries(stockLocationFields)) {
    if (schemas[name] === undefined) continue;
    const properties = object(object(schemas[name] ?? null).properties ?? null);
    for (const field of fields) delete properties[field];
  }
}

function stripBomDensityConversion(schemas: ObjectValue) {
  for (const name of ["BillOfMaterialItemDto", "Request.CreateBoMItemsRequest"])
    delete object(object(schemas[`DOMAIN.Entities.BillOfMaterials.${name}`] ?? null).properties ?? null).useDensityConversion;
}

function stripMigrationBatchDetails(document: ObjectValue) {
  const schemas = object(object(document.components ?? null).schemas ?? null);
  delete object(document.paths ?? null)["/api/v1/material/batch/{batchId}/migration-details"];
  delete schemas["DOMAIN.Entities.Materials.Batch.UpdateMigrationBatchDetails"];
  delete object(object(schemas["DOMAIN.Entities.Materials.Batch.MaterialBatchDto"] ?? null).properties ?? null).migrationGrnNumber;
  delete object(object(schemas["DOMAIN.Entities.Materials.Batch.MaterialStockReportRow"] ?? null).properties ?? null).grnNumber;
}

const worksheetFields = ["worksheetResponseId", "worksheetFormId"] as const;
const worksheetSchema = "DOMAIN.Entities.MaterialARD.MaterialBatchArd";

function stripWorksheetFields(schemas: ObjectValue) {
  const properties = object(object(schemas[worksheetSchema] ?? null).properties ?? null);
  for (const field of worksheetFields) delete properties[field];
}

const specificationPrintOperations = {
  "raw-material": "GetRawMaterialSpecificationPrintHistory",
  "packaging-material": "GetPackagingMaterialSpecificationPrintHistory",
  product: "GetProductSpecificationPrintHistory",
} as const;

function stripFormulaRepairResponseId(document: ObjectValue) {
  const schemas = object(object(document.components ?? null).schemas ?? null);
  const schema = object(schemas["APP.Services.Formulas.FormulaRepairTestDto"] ?? null);
  delete object(object(schema.properties ?? null).responseId ?? null).nullable;
}

test("unsaved formula repair allows a null response ID and preserves the reviewed predecessor", () => {
  const current = reviewedHead();
  const schemas = object(object(current.components ?? null).schemas ?? null);
  const properties = object(object(schemas["APP.Services.Formulas.FormulaRepairTestDto"] ?? null).properties ?? null);
  assert.deepEqual(properties.responseId, { type: "string", format: "uuid", nullable: true });
  checkCompatibility(hostConfig, policy, contractDigest(current));
  stripFormulaRepairResponseId(current);
  assert.equal(contractDigest(current), "b25205abc57a22c778b7d1d54adde27e529a30a149a9d2c2c287a53e6af7d755");
});

test("material stock trace adds only kind-specific full snapshot view and print operations", () => {
  const current = beforeProductionBoardOrder();
  const paths = object(current.paths ?? null);
  for (const kind of ["raw", "packaging"]) for (const suffix of ["", "/print"]) {
    const operation = object(paths[`/api/v1/material-stock-trace/${kind}/{materialId}${suffix}`] ?? null);
    assert.deepEqual(Object.keys(operation), ["get"]);
    assert.ok(object(operation.get ?? null).operationId);
  }
  const digest = contractDigest(current);
  assert.equal(digest, "ed5a4dba5d3d9e8ff51a650289ef4ec833d8b457a9f859be7fd205af072faa93");
  checkCompatibility(hostConfig, policy, digest);
  assert.equal(contractDigest(beforeMaterialStockTrace()), "f98896c0e66ab885fdcaf8049301dad3bb0476ed46f26e85566e97474ba0b643");
});

function stripSpecificationPrint(document: ObjectValue) {
  const paths = object(document.paths ?? null);
  for (const category of Object.keys(specificationPrintOperations)) delete paths[`/api/v1/specification-print/${category}/{id}`];
  const schemas = object(object(document.components ?? null).schemas ?? null);
  delete schemas["DOMAIN.Entities.Specifications.SpecificationPrintHistory"];
  delete schemas["DOMAIN.Entities.Specifications.SpecificationPrintRevision"];
}

test("specification printing adds three typed reads and preserves the prior release contract", () => {
  const current = reviewedHead();
  const paths = object(current.paths ?? null);
  for (const [category, operationId] of Object.entries(specificationPrintOperations)) {
    const path = object(paths[`/api/v1/specification-print/${category}/{id}`] ?? null);
    assert.deepEqual(Object.keys(path), ["get"]);
    assert.equal(object(path.get ?? null).operationId, operationId);
  }
  checkCompatibility(hostConfig, policy, contractDigest(current));
  stripFormulaRepairResponseId(current);
  stripSpecificationPrint(current);
  assert.equal(contractDigest(current), "607760d98226801bff574edf1f8009307a230d2237f85a9126c8043e3af5511f");
});

function stripProductBatchStem(schemas: ObjectValue) {
  for (const dto of ["Product", "ProductDto", "ProductListDto", "CreateProductRequest", "UpdateProductRequest"])
    delete object(object(schemas[`DOMAIN.Entities.Products.${dto}`] ?? null).properties ?? null).batchStem;
}

function stripMigrationMaterialLinks(document: ObjectValue) {
  delete object(document.paths ?? null)["/api/v1/stock-migrations/{id}/material-links/{kind}"];
  const schemas = object(object(document.components ?? null).schemas ?? null);
  for (const name of ["StockMigrationMaterialLinkDto", "CreateStockMigrationMaterialLinksRequest", "StockMigrationMaterialLinksResult"])
    delete schemas[`DOMAIN.Entities.Materials.StockMigrations.${name}`];
}

test("material worksheet details add only two optional response identifiers", () => {
  const current = reviewedHead();
  stripFormulaRepairResponseId(current);
  stripSpecificationPrint(current);
  const schemas = object(object(current.components ?? null).schemas ?? null);
  const schema = object(schemas[worksheetSchema] ?? null);
  const properties = object(schema.properties ?? null);
  for (const field of worksheetFields) {
    assert.deepEqual(properties[field], { type: "string", format: "uuid", nullable: true });
    assert.ok(!Array.isArray(schema.required) || !schema.required.includes(field));
  }
  const digest = contractDigest(current);
  assert.equal(digest, "607760d98226801bff574edf1f8009307a230d2237f85a9126c8043e3af5511f");
  checkCompatibility(hostConfig, policy, digest);
  stripWorksheetFields(schemas);
  assert.equal(contractDigest(current), "7fbbda4c84600f4344f97f286f092d2635854986928fac39f61bf9376e75a2cc");
  checkCompatibility(hostConfig, policy, contractDigest(current));
});

test("draft material linking adds only typed preview/create operations and preserves the approved predecessor", () => {
  const current = reviewedHead();
  stripFormulaRepairResponseId(current);
  stripSpecificationPrint(current);
  stripWorksheetFields(object(object(current.components ?? null).schemas ?? null));
  stripProductBatchStem(object(object(current.components ?? null).schemas ?? null));
  stripMigrationBatchDetails(current);
  stripBomDensityConversion(object(object(current.components ?? null).schemas ?? null));
  const digest = contractDigest(current);
  assert.equal(digest, "bca17eb640a0223896ecc0fe8cee0e29d33ebd2d76221c369bda34b54e6a9b58");
  const path = object(object(current.paths ?? null)["/api/v1/stock-migrations/{id}/material-links/{kind}"] ?? null);
  assert.deepEqual(Object.keys(path).sort(), ["get", "post"]);
  assert.equal(object(path.get ?? null).operationId, "PreviewStockMigrationMaterialLinks");
  assert.equal(object(path.post ?? null).operationId, "CreateStockMigrationMaterialLinks");
  checkCompatibility(hostConfig, policy, digest);
  stripMigrationMaterialLinks(current);
  assert.equal(contractDigest(current), "4cd376b6624dfe633457cb79f7bf8592cd283590d7a6bc855ccb7afa196bd64c");
});

test("stock picking adds only seven optional read fields and preserves the approved contract", () => {
  const current = reviewedHead();
  stripFormulaRepairResponseId(current);
  stripSpecificationPrint(current);
  stripWorksheetFields(object(object(current.components ?? null).schemas ?? null));
  stripProductBatchStem(object(object(current.components ?? null).schemas ?? null));
  stripMigrationBatchDetails(current);
  stripMigrationMaterialLinks(current);
  const schemas = object(object(current.components ?? null).schemas ?? null);
  stripBomDensityConversion(schemas);
  const digest = contractDigest(current);
  assert.equal(digest, "4cd376b6624dfe633457cb79f7bf8592cd283590d7a6bc855ccb7afa196bd64c");
  delete schemas["DOMAIN.Entities.Products.CreateProductPackageSubstituteRequest"];
  for (const [name, fields] of Object.entries(stockLocationFields)) {
    const schema = object(schemas[name] ?? null);
    const properties = object(schema.properties ?? null);
    for (const field of fields) {
      assert.ok(!Array.isArray(schema.required) || !schema.required.includes(field));
      assert.deepEqual(properties[field], field === "warehouseLocationShelf"
        ? { $ref: "#/components/schemas/DOMAIN.Entities.Warehouses.MaterialWarehouseLocationShelfDto" }
        : { type: "string", nullable: true });
    }
  }
  stripStockLocations(schemas);
  assert.equal(contractDigest(current), "5211b900a46aff5d1ece7c3e4f73c8ef9ae3127969ffb0945bfca034d3aefe35");
  checkCompatibility(hostConfig, policy, digest);
  checkCompatibility(hostConfig, policy, contractDigest(current));
});

test("the preserved customer export matches the reported digest and retains both exact approved contracts", () => {
  assert.equal(contractDigest(customer), customerFingerprint);
  assert.equal(contractDigest(reviewedImport()), approvedFingerprint);
  assert.ok(policy.backendContracts.includes(approvedFingerprint));
  assert.ok(policy.backendContracts.includes(customerFingerprint));
});

test("BOM density conversion is an optional additive marker on the request and saved item", () => {
  const current = reviewedHead();
  stripFormulaRepairResponseId(current);
  stripSpecificationPrint(current);
  stripWorksheetFields(object(object(current.components ?? null).schemas ?? null));
  stripProductBatchStem(object(object(current.components ?? null).schemas ?? null));
  stripMigrationBatchDetails(current);
  const digest = contractDigest(current);
  assert.equal(digest, "4eabf615f3d9c244ca4086698d4a4845a96c64edeb1e69bf649863f76494f726");
  assert.ok(policy.backendContracts.includes(digest));
  const schemas = object(object(current.components ?? null).schemas ?? null);
  for (const name of ["DOMAIN.Entities.BillOfMaterials.Request.CreateBoMItemsRequest", "DOMAIN.Entities.BillOfMaterials.BillOfMaterialItemDto"]) {
    const schema = object(schemas[name] ?? null);
    const property = object(object(schema.properties ?? null).useDensityConversion ?? null);
    assert.equal(property.type, "boolean");
    assert.equal(Array.isArray(schema.required) && schema.required.includes("useDensityConversion"), false);
  }
});

test("all 1,358 operations and schemas match after only 2,716 audit-header schema additions", () => {
  const review = auditHeaderReview(customer);
  assert.equal(review.paths, 1056); assert.equal(review.operations, 1358); assert.equal(review.headers, 2716);
  assert.equal(Object.keys(object(object(customer.components ?? null).schemas ?? null)).length, 1531);
  assert.equal(contractDigest(review.normalized), approvedFingerprint);
});

test("historical reporting adds optional read parameters without changing existing contracts or security", () => {
  const current = reviewedHead();
  stripFormulaRepairResponseId(current);
  stripSpecificationPrint(current);
  const before = reviewedImport();
  const paths = object(current.paths ?? null);
  for (const [path, item] of Object.entries(object(before.paths ?? null))) {
    for (const [verb, oldValue] of Object.entries(object(item))) {
      const original = object(oldValue);
      const operation = object(object(paths[path] ?? null)[verb] ?? null);
      const parameters = operation.parameters;
      if (Array.isArray(parameters)) operation.parameters = parameters.filter((entry) => {
        const parameter = object(entry);
        return !(parameter.in === "query" && (parameter.name === "asOfDate" || ((path === "/api/v1/material/department" || path === "/api/v1/material/{materialId}/uom") && parameter.name === "productId") || (path === "/api/v1/attendance-records/general-summary" && parameter.name === "departmentId") || (path === "/api/v1/report/warehouse/materials-stock-batch-detail" && parameter.name === "materialId")
          || ((path === "/api/v1/material/batches/expired" || path === "/api/v1/material/batches/about-to-expire") && parameter.name === "searchQuery")
          // User directory filters (2026-11-01): optional role and department filters on the user list; additive only.
          || (path === "/api/v1/user" && (parameter.name === "roleId" || parameter.name === "departmentId"))
          // Formula repair (2026-11-05): optional response whose pinned formula configuration the form is read with; additive only.
          || (path === "/api/v1/form/{formId}" && parameter.name === "responseId")
          // Product permissions (2026-11-05): optional context (qa) on product writes picks the QA keys; additive only.
          || ((path.startsWith("/api/v1/product") || path.startsWith("/api/v1/bom")) && parameter.name === "context")));
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
  assert.deepEqual(Object.keys(paths).filter((path) => !(path in object(before.paths ?? null))).sort(), [
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
    "/api/v1/material/batch/{batchId}/migration-details",
    "/api/v1/material/batch/{batchId}/migration-retest-date",
    "/api/v1/material/batches/stock-report",
    "/api/v1/stock-migrations/top-ups/upload", "/api/v1/stock-migrations/top-ups",
    "/api/v1/production-schedule/{batchId}/issued-material-repair/{kind}",
    "/api/v1/production-schedule/activity/{activityId}/unstart",
    "/api/v1/production-schedule/{scheduleId}/product/{productId}/repair/{kind}",
    "/api/v1/issued-bmrs", "/api/v1/issued-bmrs/{id}/history", "/api/v1/issued-bmrs/{id}/batch-number",
    "/api/v1/issued-bmrs/{id}/revisions", "/api/v1/issued-bmrs/{id}/revisions/{revisionId}/review",
    // Formula repair (2026-11-05): separately permissioned legacy formula repair and server recalculation; additive only.
    "/api/v1/formula-repairs/questions/{questionId}", "/api/v1/formula-repairs/questions/{questionId}/preview",
    "/api/v1/formula-repairs/questions/{questionId}/apply", "/api/v1/formula-repairs/questions/{questionId}/history",
    "/api/v1/formula-repairs/tests/{atrId}/fields/{formFieldId}/evaluate",
    // Reservation repair: additive, independently permissioned batch preview/apply.
    "/api/v1/production-schedule/{batchId}/reservation-repair",
    // Production material forecast (2026-11-05): read-only, separately permissioned warehouse report; additive only.
    "/api/v1/report/production-material-forecast",
    // White Placebo preparation (2026-11-06): one key per task, additive only.
    "/api/v1/stock-migrations/{id}/material-links/{kind}",
    "/api/v1/white-placebo/workspace", "/api/v1/white-placebo/recipe", "/api/v1/white-placebo",
    "/api/v1/white-placebo/{id}", "/api/v1/white-placebo/{id}/issue", "/api/v1/white-placebo/{id}/output"].sort());
  const schemas = object(object(current.components ?? null).schemas ?? null);
  delete schemas["DOMAIN.Entities.Materials.Batch.UpdateMigrationBatchDetails"];
  stripWorksheetFields(schemas);
  stripProductBatchStem(schemas);
  delete object(object(schemas["DOMAIN.Entities.Materials.Batch.MaterialBatchDto"] ?? null).properties ?? null).migrationGrnNumber;
  stripMigrationMaterialLinks(current);
  for (const name of Object.keys(schemas)) if (name.startsWith("DOMAIN.Entities.Reports.ProductionMaterialForecast")) delete schemas[name];
  for (const name of Object.keys(schemas)) if (name.startsWith("DOMAIN.Entities.Products.Production.ReservationRepair")) delete schemas[name];
  stripStockLocations(schemas);
  stripWhitePlacebo(schemas);
  for (const name of ["ScheduleRepairKind", "ScheduleRepairPreview", "ScheduleRepairBatchPreview", "ApplyScheduleRepair", "ScheduleRepairResult"])
    delete schemas[`DOMAIN.Entities.Products.Production.${name}`];
  for (const name of Object.keys(schemas)) if (name.startsWith("DOMAIN.Entities.Materials.Batch.MaterialStockReport")) delete schemas[name];
  for (const name of Object.keys(schemas)) if (name.startsWith("DOMAIN.Entities.Products.Production.ProductionUnstart") || name.startsWith("DOMAIN.Entities.Products.Production.IssuedMaterialRepair") || name === "DOMAIN.Entities.Products.Production.ApplyIssuedMaterialRepairRequest") delete schemas[name];
  delete object(object(schemas["DOMAIN.Entities.Requisitions.RequisitionItemDto"] ?? null).properties ?? null).approvedQuantity;
  for (const name of ["IssuedBmrPage", "IssuedBmrRow", "IssuedBmrHistory", "IssuedBmrChangeDto", "IssuedBmrRevisionDto",
    "IssuedBmrRevisionStatus", "CorrectIssuedBmrNumber", "RequestIssuedBmrRevision", "ReviewIssuedBmrRevision"])
    delete schemas[`DOMAIN.Entities.Products.Production.${name}`];
  delete schemas["DOMAIN.Entities.Materials.Batch.UpdateMigrationRetestDate"];
  for (const name of ["MaterialBatchDto", "MaterialBatchListDto", "MaterialBatchReducedDto", "DistributedMaterialBatchDto"]) {
    const properties = object(object(schemas[`DOMAIN.Entities.Materials.Batch.${name}`] ?? null).properties ?? null);
    delete properties.effectiveExpiryDate;
    if (name === "MaterialBatchDto") { delete properties.isOpeningBalanceBatch; delete properties.stockDepartments; }
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
  for (const name of Object.keys(schemas)) if (/FormulaRepair|RepairedFormula/.test(name)) delete schemas[name];
  for (const [name, properties] of Object.entries({ FormFieldDto: ["formulaConfigurationHash"], FormResponseDto: ["formulaRepairPending", "formulaRepairEvaluated"],
    ResponseDetailDto: ["effectiveForm"], "Request.SaveResponseDraftRequest": ["formulaConfigurationHash"] }))
    for (const property of properties) delete object(object(schemas[`DOMAIN.Entities.Forms.${name}`] ?? null).properties ?? null)[property];
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
  stripBomDensityConversion(schemas);
  assert.deepEqual(current.components, before.components);
  assert.deepEqual(current.security, before.security);
});

test("department switching requires an explicit nullable assignment and keeps the legacy URL", () => {
  const contract = reviewedHead();
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
  const contract = reviewedHead();
  const operation = object(object(object(contract.paths ?? null)["/api/v1/alert/{alertId}/recipients"] ?? null).put ?? null);
  assert.ok(object(operation.responses ?? null)["204"]);
  const schema = object(object(object(contract.components ?? null).schemas ?? null)["DOMAIN.Entities.Alerts.UpdateAlertRecipientsRequest"] ?? null);
  assert.deepEqual(Object.keys(object(schema.properties ?? null)).sort(), ["roleIds", "userIds"]);
});

test("production readiness adds one typed, authenticated, parameterized operation", () => {
  const current = reviewedHead();
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
  const current = reviewedHead();
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

test("the merged forecast and migration contracts preserve the approved predecessor and pass release validation", () => {
  const head = reviewedHead();
  // The release check reports the published file, including the latest addition stripped above.
  const publishedDigest = contractDigest(object(parse(readFileSync("contracts/openapi/backend.v1.json", "utf8"))));
  stripFormulaRepairResponseId(head);
  stripSpecificationPrint(head);
  stripWorksheetFields(object(object(head.components ?? null).schemas ?? null));
  stripProductBatchStem(object(object(head.components ?? null).schemas ?? null));
  assert.equal(contractDigest(head), "474090995ed29dc1fccf7f204706e9127181e120b1ee0014fb6e6e852f5d2d23");
  stripMigrationBatchDetails(head);
  assert.equal(contractDigest(head), "4eabf615f3d9c244ca4086698d4a4845a96c64edeb1e69bf649863f76494f726");
  stripMigrationMaterialLinks(head);
  // Keep this historical predecessor review independent of the later stock-location fields.
  stripStockLocations(object(object(head.components ?? null).schemas ?? null));
  // BOM density conversion adds optional source/response markers without changing existing operations.
  stripBomDensityConversion(object(object(head.components ?? null).schemas ?? null));
  assert.equal(contractDigest(head), "5211b900a46aff5d1ece7c3e4f73c8ef9ae3127969ffb0945bfca034d3aefe35");
  // White Placebo preparation (2026-11-06) adds six paths, their owned schemas and three optional markers.
  const placeboPredecessor = structuredClone(head);
  const placeboPaths = object(placeboPredecessor.paths ?? null);
  for (const path of Object.keys(placeboPaths)) if (path === "/api/v1/white-placebo" || path.startsWith("/api/v1/white-placebo/")) delete placeboPaths[path];
  stripWhitePlacebo(object(object(placeboPredecessor.components ?? null).schemas ?? null));
  assert.equal(contractDigest(placeboPredecessor), "7598763c860877a64d36bce3f9e730bf08cd7ac3b072384a7ae30afc235b6414");
  checkCompatibility(hostConfig, policy, contractDigest(placeboPredecessor));
  // Product permissions (2026-11-05) add an optional context query parameter to product and BOM writes.
  const current = structuredClone(placeboPredecessor);
  for (const [path, item] of Object.entries(object(current.paths ?? null))) {
    if (!path.startsWith("/api/v1/product") && !path.startsWith("/api/v1/bom")) continue;
    for (const operation of Object.values(object(item))) {
      const parameters = object(operation).parameters;
      if (Array.isArray(parameters)) object(operation).parameters = parameters.filter((entry) => object(entry).name !== "context");
    }
  }
  checkCompatibility(hostConfig, policy, contractDigest(current));
  const digest = contractDigest(current);
  assert.ok(policy.backendContracts.includes("a485b5e6830f1102c312ad08b9ddd4a9992ce64109018a5b59961294b47496fe"));
  assert.ok(policy.backendContracts.includes("72b0d96542fd4728f86f4dc0f80986021abed7569010420a0734296e12bb219f"));
  assert.ok(policy.backendContracts.includes("d26ad659839ddc4ec2e1fb26aadeaac692c19e27c7e075a7cc2fe56b8d4ff4ed"));
  assert.ok(policy.backendContracts.includes("35c00c063402f8cf1248db7ca3a9093ce997e66858311b4864de7890a50d3dad"));
  assert.equal(digest, "ba9b4556768dbaf418600e907610ec613e52b3e6a89aadc2bd675c367f503f75");
  // Migration batch-number corrections (2026-11-05) add two optional fields to the correction request.
  const batchPredecessor = structuredClone(current);
  const batchRequest = object(object(object(object(batchPredecessor.components ?? null).schemas ?? null)
    ["DOMAIN.Entities.Materials.Batch.UpdateMigrationRetestDate"] ?? null).properties ?? null);
  delete batchRequest.batchNumber; delete batchRequest.expectedBatchNumber;
  // Manual migration top-ups (2026-11-05) add optional retest and full-date fields to stock migration rows.
  const topUpPredecessor = structuredClone(batchPredecessor);
  const topUpSchemas = object(object(topUpPredecessor.components ?? null).schemas ?? null);
  for (const [name, properties] of Object.entries({ StockMigrationLineDto: ["retestDate", "exactDates"],
    UpdateStockMigrationLineRequest: ["retestDate", "clearRetestDate"], CreateStockTopUpRequest: ["exactDates"] }))
    for (const property of properties) delete object(object(topUpSchemas[`DOMAIN.Entities.Materials.StockMigrations.${name}`] ?? null).properties ?? null)[property];
  // The production material forecast (2026-11-05) is one additive read path and its owned schemas.
  const forecastPredecessor = structuredClone(topUpPredecessor);
  delete object(forecastPredecessor.paths ?? null)["/api/v1/report/production-material-forecast"];
  const forecastSchemas = object(object(forecastPredecessor.components ?? null).schemas ?? null);
  for (const name of Object.keys(forecastSchemas))
    if (name.startsWith("DOMAIN.Entities.Reports.ProductionMaterialForecast")) delete forecastSchemas[name];
  assert.equal(contractDigest(forecastPredecessor), "fa46de385e587bca0821ff164522fedda3dca60d5e0b044336bd7093fe87d238");
  checkCompatibility(hostConfig, policy, contractDigest(forecastPredecessor));
  const reservationPredecessor = structuredClone(forecastPredecessor);
  delete object(reservationPredecessor.paths ?? null)["/api/v1/production-schedule/{batchId}/reservation-repair"];
  const reservationSchemas = object(object(reservationPredecessor.components ?? null).schemas ?? null);
  for (const name of Object.keys(reservationSchemas))
    if (name.startsWith("DOMAIN.Entities.Products.Production.ReservationRepair")) delete reservationSchemas[name];
  assert.equal(contractDigest(reservationPredecessor), "d31b1bc59265cc6a98c995e9c3b3249dc8f73d948701228e1573cf31d01e888f");
  checkCompatibility(hostConfig, policy, contractDigest(reservationPredecessor));
  // Formula repair and migration AR corrections (2026-11-05) are additive over the bulk repair contract.
  const bulk = structuredClone(reservationPredecessor);
  const bulkPaths = object(bulk.paths ?? null);
  for (const path of Object.keys(bulkPaths)) if (path.startsWith("/api/v1/formula-repairs/")) delete bulkPaths[path];
  const formGet = object(object(bulkPaths["/api/v1/form/{formId}"] ?? null).get ?? null);
  assert.ok(Array.isArray(formGet.parameters));
  formGet.parameters = formGet.parameters.filter((entry) => object(entry).name !== "responseId");
  const bulkSchemas = object(object(bulk.components ?? null).schemas ?? null);
  for (const name of Object.keys(bulkSchemas)) if (/FormulaRepair|RepairedFormula/.test(name)) delete bulkSchemas[name];
  for (const [name, properties] of Object.entries({ "Forms.FormFieldDto": ["formulaConfigurationHash"], "Forms.FormResponseDto": ["formulaRepairPending", "formulaRepairEvaluated"],
    "Forms.ResponseDetailDto": ["effectiveForm"], "Forms.Request.SaveResponseDraftRequest": ["formulaConfigurationHash"],
    "Materials.Batch.UpdateMigrationRetestDate": ["arNumber", "expectedArNumber"] }))
    for (const property of properties) delete object(object(bulkSchemas[`DOMAIN.Entities.${name}`] ?? null).properties ?? null)[property];
  assert.equal(contractDigest(bulk), "bfaa319fb93979896947892ba9f3e665f1cbdff24700647b6a126c60a3a90f47");
  checkCompatibility(hostConfig, policy, contractDigest(bulk));
  const predecessor = structuredClone(bulk);
  delete object(predecessor.paths ?? null)["/api/v1/production-schedule/{scheduleId}/product/{productId}/repair/{kind}"];
  const schemas = object(object(predecessor.components ?? null).schemas ?? null);
  for (const name of ["ScheduleRepairKind", "ScheduleRepairPreview", "ScheduleRepairBatchPreview", "ApplyScheduleRepair", "ScheduleRepairResult"])
    delete schemas[`DOMAIN.Entities.Products.Production.${name}`];
  const priorDigest = contractDigest(predecessor);
  assert.equal(priorDigest, "f38dceee6e53dc16783197bce0ceb9d36b902f2d1d0b5185a77a1698adec5e9f");
  checkCompatibility(hostConfig, policy, priorDigest);
  checkCompatibility(hostConfig, policy, digest);
  const check = spawnSync(process.execPath, ["deploy/customer-server/check-release.ts"], { encoding: "utf8" });
  assert.equal(check.status, 0, check.stderr);
  assert.match(check.stdout, new RegExp(`Approved backend contract: ${publishedDigest}`));
});

test("expiry department metadata is an optional read addition, with no client-controlled department parameter", () => {
  const current = reviewedHead();
  const batch = object(object(object(current.components ?? null).schemas ?? null)["DOMAIN.Entities.Materials.Batch.MaterialBatchDto"] ?? null);
  const field = object(object(batch.properties ?? null).stockDepartments ?? null);
  assert.equal(field.type, "array");
  assert.deepEqual(field.items, { $ref: "#/components/schemas/SHARED.CollectionItemDto" });
  assert.ok(!Array.isArray(batch.required) || !batch.required.includes("stockDepartments"));
  for (const path of ["/api/v1/material/batches/expired", "/api/v1/material/batches/about-to-expire"]) {
    const parameters = object(object(object(current.paths ?? null)[path] ?? null).get ?? null).parameters;
    assert.ok(Array.isArray(parameters));
    assert.ok(!parameters.some((value) => ["departmentId", "userId"].includes(String(object(value).name))));
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
  for (const source of [raw, readFileSync("contracts/openapi/backend.v1.json", "utf8")]) {
    for (const change of changes) {
      const changed = object(parse(source)); change(changed);
      assert.throws(() => checkCompatibility(hostConfig, policy, contractDigest(changed)), /has not been approved/);
    }
  }
});

test("stock count reporting adds only a typed read with department, kind and expiry filters", () => {
  const current = reviewedHead();
  const path = object(object(current.paths ?? null)["/api/v1/material/batches/stock-report"] ?? null);
  assert.deepEqual(Object.keys(path), ["get"]);
  const operation = object(path.get ?? null);
  assert.ok(Array.isArray(operation.parameters));
  assert.deepEqual(operation.parameters.map((entry) => object(entry)).filter((entry) => entry.in === "query").map((entry) => entry.name), ["departmentId", "materialKind", "expiredOnly"]);
  const response = object(object(operation.responses ?? null)["200"] ?? null);
  assert.deepEqual(object(object(response.content ?? null)["application/json"] ?? null).schema, { $ref: "#/components/schemas/DOMAIN.Entities.Materials.Batch.MaterialStockReportDto" });
  assert.deepEqual(current.security, reviewedImport().security);
});

test("BOM substitute quantities add one typed read/choose path and optional fields, preserving the approved predecessor", () => {
  const current = beforeMaterialLookupContext();
  stripIssuedRegister(current);
  stripSubstituteReasons(current);
  stripApprovedVendorList(current);
  stripStockUnitsSubstitutes(current);
  stripTransferRejection(current);
  stripProductionFollowups(current);
  stripOperationDepartments(current);
  stripTestCorrections(current);
  stripSharedDensity(current);
  stripUnstartReservations(current);
  stripUnstartLeftovers(current);
  stripUpcomingBatchIssues(current);
  stripTemplateRepairs(current);
  stripMaterialRetestAtr(current);
  stripApprovalUsersOnRecord(current);
  stripPackagingIssueQuantity(current);
  stripRequisitionIssuedFilter(current);
  stripSpecificationRevisionReason(current);
  const digest = contractDigest(current);
  assert.equal(digest, "6c84e6f93d57882923dc0cc61a6e7df1649371ab08a8b34ccd287150105b9806");
  checkCompatibility(hostConfig, policy, digest);
  const path = object(object(current.paths ?? null)["/api/v1/requisition/{requisitionId}/material-options"] ?? null);
  assert.deepEqual(Object.keys(path).sort(), ["get", "post"]);
  const schemas = object(object(current.components ?? null).schemas ?? null);
  delete schemas["DOMAIN.Entities.Products.CreateProductPackageSubstituteRequest"];
  for (const [name, fields] of Object.entries(bomSubstituteFields)) {
    const schema = object(schemas[name] ?? null);
    for (const field of fields) {
      assert.ok(object(schema.properties ?? null)[field] !== undefined, `${name}.${field}`);
      assert.ok(!Array.isArray(schema.required) || !schema.required.includes(field));
    }
  }
  stripBomSubstituteQuantities(current);
  assert.equal(contractDigest(current), "3e3337d5f86a3b62669a337aeb6a6fff29ad802a10fc82a86ccede6389143b33");
});

test("a specification revision requires a reason and returns it on the specification and its history", () => {
  const current = beforeMaterialLookupContext();
  stripIssuedRegister(current);
  stripSubstituteReasons(current);
  stripApprovedVendorList(current);
  stripStockUnitsSubstitutes(current);
  stripTransferRejection(current);
  stripProductionFollowups(current);
  stripOperationDepartments(current);
  stripTestCorrections(current);
  stripSharedDensity(current);
  stripUnstartReservations(current);
  stripUnstartLeftovers(current);
  stripUpcomingBatchIssues(current);
  stripTemplateRepairs(current);
  stripMaterialRetestAtr(current);
  stripApprovalUsersOnRecord(current);
  stripPackagingIssueQuantity(current);
  stripRequisitionIssuedFilter(current);
  const digest = contractDigest(current);
  assert.equal(digest, "f2960caf053dd6bb3c943cc82c774328f21f6ae8409528741ba119a631dfc6f9");
  checkCompatibility(hostConfig, policy, digest);
  const schemas = object(object(current.components ?? null).schemas ?? null);
  delete schemas["DOMAIN.Entities.Products.CreateProductPackageSubstituteRequest"];
  for (const [name, fields] of Object.entries(specificationReasonFields)) {
    const schema = object(schemas[name] ?? null);
    for (const field of fields) {
      assert.ok(object(schema.properties ?? null)[field] !== undefined, `${name}.${field}`);
      const required = Array.isArray(schema.required) && schema.required.includes(field);
      assert.equal(required, name.includes(".Update"), `${name}.${field} required`);
    }
  }
  stripSpecificationRevisionReason(current);
  assert.equal(contractDigest(current), "6c84e6f93d57882923dc0cc61a6e7df1649371ab08a8b34ccd287150105b9806");
});

test("the store's requisition list adds only an optional issued filter, preserving the approved predecessor", () => {
  const current = beforeMaterialLookupContext();
  stripIssuedRegister(current);
  stripSubstituteReasons(current);
  stripApprovedVendorList(current);
  stripStockUnitsSubstitutes(current);
  stripTransferRejection(current);
  stripProductionFollowups(current);
  stripOperationDepartments(current);
  stripTestCorrections(current);
  stripSharedDensity(current);
  stripUnstartReservations(current);
  stripUnstartLeftovers(current);
  stripUpcomingBatchIssues(current);
  stripTemplateRepairs(current);
  stripMaterialRetestAtr(current);
  stripApprovalUsersOnRecord(current);
  stripPackagingIssueQuantity(current);
  const digest = contractDigest(current);
  assert.equal(digest, "e4bf7bc3756169634fc42cc65d9de3e0c0c00fb245ccf90c8b8f8a381bf6a42a");
  checkCompatibility(hostConfig, policy, digest);
  const operation = object(object(object(current.paths ?? null)[requisitionListPath] ?? null).get ?? null);
  assert.ok(Array.isArray(operation.parameters));
  const issued = operation.parameters.map((entry) => object(entry)).find((entry) => entry.name === "issued");
  assert.deepEqual(issued && { in: issued.in, required: issued.required, schema: issued.schema }, { in: "query", required: undefined, schema: { type: "boolean" } });
  stripRequisitionIssuedFilter(current);
  assert.equal(contractDigest(current), "f2960caf053dd6bb3c943cc82c774328f21f6ae8409528741ba119a631dfc6f9");
});

test("packaging issue quantity adds one typed PUT and optional line fields, preserving the approved predecessor", () => {
  const current = beforeMaterialLookupContext();
  stripIssuedRegister(current);
  stripSubstituteReasons(current);
  stripApprovedVendorList(current);
  stripStockUnitsSubstitutes(current);
  stripTransferRejection(current);
  stripProductionFollowups(current);
  stripOperationDepartments(current);
  stripTestCorrections(current);
  stripSharedDensity(current);
  stripUnstartReservations(current);
  stripUnstartLeftovers(current);
  stripUpcomingBatchIssues(current);
  stripTemplateRepairs(current);
  stripMaterialRetestAtr(current);
  stripApprovalUsersOnRecord(current);
  const digest = contractDigest(current);
  assert.equal(digest, "2cc7b3a5a969853d122ab625816f1440a33be0d8a62a74574b845a438d9c5cf5");
  checkCompatibility(hostConfig, policy, digest);
  assert.deepEqual(Object.keys(object(object(current.paths ?? null)[issuedQuantityPath] ?? null)), ["put"]);
  const schemas = object(object(current.components ?? null).schemas ?? null);
  const item = object(schemas["DOMAIN.Entities.Requisitions.RequisitionItemDto"] ?? null);
  for (const field of issuedQuantityFields) {
    assert.ok(object(item.properties ?? null)[field] !== undefined, field);
    assert.ok(!Array.isArray(item.required) || !item.required.includes(field));
  }
  stripPackagingIssueQuantity(current);
  assert.equal(contractDigest(current), "e4bf7bc3756169634fc42cc65d9de3e0c0c00fb245ccf90c8b8f8a381bf6a42a");
});

test("IT approval transfer adds only a typed read of the users on approval documents, preserving the approved predecessor", () => {
  const current = beforeMaterialLookupContext();
  stripIssuedRegister(current);
  stripSubstituteReasons(current);
  stripApprovedVendorList(current);
  stripStockUnitsSubstitutes(current);
  stripTransferRejection(current);
  stripProductionFollowups(current);
  stripOperationDepartments(current);
  stripTestCorrections(current);
  stripSharedDensity(current);
  stripUnstartReservations(current);
  stripUnstartLeftovers(current);
  stripUpcomingBatchIssues(current);
  stripTemplateRepairs(current);
  stripMaterialRetestAtr(current);
  const digest = contractDigest(current);
  assert.equal(digest, "dca46e49d205cc65b0572d43a710dcc6c6e0ac79e0de1412e5de1d5bacf61f6f");
  checkCompatibility(hostConfig, policy, digest);
  assert.deepEqual(Object.keys(object(object(current.paths ?? null)[usersOnRecordPath] ?? null)), ["get"]);
  stripApprovalUsersOnRecord(current);
  assert.equal(contractDigest(current), "2cc7b3a5a969853d122ab625816f1440a33be0d8a62a74574b845a438d9c5cf5");
});

test("material retests add an AR number, read-only retest fields and three statuses, preserving the approved predecessor", () => {
  const current = beforeMaterialLookupContext();
  stripIssuedRegister(current);
  stripSubstituteReasons(current);
  stripApprovedVendorList(current);
  stripStockUnitsSubstitutes(current);
  stripTransferRejection(current);
  stripProductionFollowups(current);
  stripOperationDepartments(current);
  stripTestCorrections(current);
  stripSharedDensity(current);
  stripUnstartReservations(current);
  stripUnstartLeftovers(current);
  stripUpcomingBatchIssues(current);
  stripTemplateRepairs(current);
  const digest = contractDigest(current);
  assert.equal(digest, "7a00169a25431d5dd0424332097da09b423ef4271a12908bfeedb4e3694220d6");
  checkCompatibility(hostConfig, policy, digest);
  const schemas = object(object(current.components ?? null).schemas ?? null);
  assert.deepEqual(object(schemas["DOMAIN.Entities.Materials.Batch.MaterialRetestStatus"] ?? null).enum, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  stripMaterialRetestAtr(current);
  assert.equal(contractDigest(current), "dca46e49d205cc65b0572d43a710dcc6c6e0ac79e0de1412e5de1d5bacf61f6f");
});

 test("QC repair, partial reassignment and packaging quantities preserve the approved predecessor", () => {
  const current = beforeMaterialLookupContext();
  stripIssuedRegister(current);
  stripSubstituteReasons(current);
  stripApprovedVendorList(current);
  stripStockUnitsSubstitutes(current);
  stripTransferRejection(current);
  stripProductionFollowups(current);
  stripOperationDepartments(current);
  stripTestCorrections(current);
  stripSharedDensity(current);
  stripUnstartReservations(current);
  stripUnstartLeftovers(current);
  stripUpcomingBatchIssues(current);
  const paths = object(current.paths ?? null);
  const operations = Object.entries(paths).filter(([path]) => path.startsWith("/api/v1/template-repairs/"));
  assert.equal(operations.length, 4);
  assert.deepEqual(operations.flatMap(([, item]) => Object.values(object(item)).map(op => object(op).operationId)).sort(),
    ["ApplyTemplateRepair", "GetTemplateRepairContext", "GetTemplateRepairHistory", "PreviewTemplateRepair"]);
  const transfers = Object.entries(paths).filter(([path]) => path.startsWith("/api/v1/test-field-reassignments/"));
  assert.equal(transfers.length, 3);
  assert.deepEqual(transfers.flatMap(([, item]) => Object.values(object(item)).map(op => object(op).operationId)).sort(),
    ["ReassignPackagingMaterialTestFields", "ReassignProductTestFields", "ReassignRawMaterialTestFields"]);
  stripTemplateRepairs(current);
  assert.equal(contractDigest(current), "7a00169a25431d5dd0424332097da09b423ef4271a12908bfeedb4e3694220d6");
});

test("upcoming batch issues add two typed reads and the started batch a swap may name, preserving the approved predecessor", () => {
  const current = beforeMaterialLookupContext();
  stripIssuedRegister(current);
  stripSubstituteReasons(current);
  stripApprovedVendorList(current);
  stripStockUnitsSubstitutes(current);
  stripTransferRejection(current);
  stripProductionFollowups(current);
  stripOperationDepartments(current);
  stripTestCorrections(current);
  stripSharedDensity(current);
  stripUnstartReservations(current);
  stripUnstartLeftovers(current);
  stripTemplateRepairs(current);
  const digest = contractDigest(current);
  assert.equal(digest, "0feb3b56925a1248f279fbce9668b02ffb18c50d06249be0f0fd1468de812bb5");
  checkCompatibility(hostConfig, policy, digest);
  for (const path of upcomingPaths) assert.deepEqual(Object.keys(object(object(current.paths ?? null)[path] ?? null)), ["get"]);
  stripUpcomingBatchIssues(current);
  assert.equal(contractDigest(current), "7a00169a25431d5dd0424332097da09b423ef4271a12908bfeedb4e3694220d6");
});

test("the combined QC repair and upcoming-issues contract is reviewed without dropping either addition", () => {
  const current = beforeMaterialLookupContext();
  stripIssuedRegister(current);
  stripSubstituteReasons(current);
  stripApprovedVendorList(current);
  stripStockUnitsSubstitutes(current);
  stripTransferRejection(current);
  stripProductionFollowups(current);
  stripOperationDepartments(current);
  stripTestCorrections(current);
  stripSharedDensity(current);
  stripUnstartReservations(current);
  stripUnstartLeftovers(current);
  const digest = contractDigest(current);
  assert.equal(digest, "3bf7e9598e05b34f624541f573204aad101320f66b0ace2a56342ea067a33f0b");
  checkCompatibility(hostConfig, policy, digest);
  stripTemplateRepairs(current);
  assert.equal(contractDigest(current), "0feb3b56925a1248f279fbce9668b02ffb18c50d06249be0f0fd1468de812bb5");
  stripUpcomingBatchIssues(current);
  assert.equal(contractDigest(current), "7a00169a25431d5dd0424332097da09b423ef4271a12908bfeedb4e3694220d6");
});

test("Unstart leftovers add only two typed variant repair paths and owned DTOs", () => {
  const current = beforeMaterialLookupContext();
  stripIssuedRegister(current);
  stripSubstituteReasons(current);
  stripApprovedVendorList(current);
  stripStockUnitsSubstitutes(current);
  stripTransferRejection(current);
  stripProductionFollowups(current);
  stripOperationDepartments(current);
  stripTestCorrections(current);
  stripSharedDensity(current);
  stripUnstartReservations(current);
  const digest = contractDigest(current);
  assert.equal(digest, "8740d29923b194db052c53a97aff5fcdf863b619e8317a3b5c1c95bb7b433f4b");
  checkCompatibility(hostConfig, policy, digest);
  const paths = object(current.paths ?? null);
  for (const variant of ["raw", "packaging"]) assert.deepEqual(Object.keys(object(paths[`/api/v1/unstart-leftovers/${variant}`] ?? null)), ["get", "post"]);
  stripUnstartLeftovers(current);
  assert.equal(contractDigest(current), "3bf7e9598e05b34f624541f573204aad101320f66b0ace2a56342ea067a33f0b");
});


test("shared density combines with the reviewed Unstart reservation contract", () => {
  const current = beforeMaterialLookupContext();
  stripIssuedRegister(current);
  stripSubstituteReasons(current);
  stripApprovedVendorList(current);
  stripStockUnitsSubstitutes(current);
  stripTransferRejection(current);
  stripProductionFollowups(current);
  stripOperationDepartments(current);
  stripTestCorrections(current);
  checkCompatibility(hostConfig, policy, contractDigest(current));
  stripSharedDensity(current);
  assert.equal(contractDigest(current), "492bb17cb7c98b859259ae356d670a091c1045483600bdf2e4137e79751bc1d4");
  stripUnstartReservations(current);
  assert.equal(contractDigest(current), "8740d29923b194db052c53a97aff5fcdf863b619e8317a3b5c1c95bb7b433f4b");
});
test("Unstart reservations combine with the reviewed shared-density contract", () => {
  const current = beforeMaterialLookupContext();
  stripIssuedRegister(current);
  stripSubstituteReasons(current);
  stripApprovedVendorList(current);
  stripStockUnitsSubstitutes(current);
  stripTransferRejection(current);
  stripProductionFollowups(current);
  stripOperationDepartments(current);
  stripTestCorrections(current);
  const paths = object(current.paths ?? null);
  for (const variant of ["raw", "packaging"]) assert.deepEqual(Object.keys(object(paths[`/api/v1/unstart-reservations/{materialId}/${variant}`] ?? null)), ["get", "post"]);
  stripUnstartReservations(current);
  assert.equal(contractDigest(current), "54d15fbce18e5e1cf519c483f27d83da4960f8f6e41863cad71992a213d7d326");
});

function stripProductionFollowups(document: ObjectValue) {
  const paths = object(document.paths ?? null);
  for (const path of Object.keys(paths)) if (path.startsWith("/api/v1/production-stock-requisitions/")) delete paths[path];
  const schemas = object(object(document.components ?? null).schemas ?? null);
  delete schemas["APP.Services.Approvals.RejectProductionStockRequisitionRequest"];
  const properties = object(object(schemas["DOMAIN.Entities.Warehouses.ShelfMaterialBatchDto"] ?? null).properties ?? null);
  delete properties.warehouseQuantity; delete properties.warehouseUoM;
}

test("production follow-ups add two rejection operations and optional warehouse quantities only", () => {
  const current = beforeMaterialLookupContext();
  stripIssuedRegister(current);
  stripSubstituteReasons(current);
  stripApprovedVendorList(current);
  checkCompatibility(hostConfig, policy, contractDigest(current));
  const paths = object(current.paths ?? null);
  for (const variant of ["raw", "packaging"]) {
    assert.deepEqual(Object.keys(object(paths[`/api/v1/production-stock-requisitions/{requisitionId}/${variant}/reject`] ?? null)), ["post"]);
  }
  assert.deepEqual(current.security, reviewedImport().security);
  stripStockUnitsSubstitutes(current);
  stripTransferRejection(current);
  stripProductionFollowups(current);
  stripOperationDepartments(current);
  stripTestCorrections(current);
  assert.equal(contractDigest(current), "e9f0e6838046b0db5121ed1611371bd6f8096c611c37a2eb22c0a9649e4bdcaa");
});

test("pre-COA correction imports three typed variant paths, a required reason and history only", () => {
  const current = beforeMaterialLookupContext();
  stripIssuedRegister(current);
  stripSubstituteReasons(current);
  stripApprovedVendorList(current);
  stripStockUnitsSubstitutes(current);
  stripTransferRejection(current);
  stripProductionFollowups(current);
  stripOperationDepartments(current);
  checkCompatibility(hostConfig, policy, contractDigest(current));
  const paths = object(current.paths ?? null);
  for (const kind of ["product", "raw-material", "packaging-material"])
    assert.deepEqual(Object.keys(object(paths[`/api/v1/test-corrections/{responseId}/${kind}`] ?? null)), ["get", "post"]);
  const schemas = object(object(current.components ?? null).schemas ?? null);
  assert.deepEqual(object(schemas["APP.Services.Forms.ReturnTestForCorrectionRequest"] ?? null).required, ["reason"]);
  stripTestCorrections(current);
  assert.equal(contractDigest(current), "e9f0e6838046b0db5121ed1611371bd6f8096c611c37a2eb22c0a9649e4bdcaa");
});

test("operation departments add a typed link and unlink and optional department fields only", () => {
  const current = beforeMaterialLookupContext();
  stripIssuedRegister(current);
  stripSubstituteReasons(current);
  stripApprovedVendorList(current);
  stripStockUnitsSubstitutes(current);
  stripTransferRejection(current);
  stripProductionFollowups(current);
  const digest = contractDigest(current);
  assert.equal(digest, "dfc02620ae1fddd96dfe39228840ce8089f17d177ebe701aa0086518ce14198b");
  checkCompatibility(hostConfig, policy, digest);
  const paths = object(current.paths ?? null);
  assert.deepEqual(Object.keys(object(paths["/api/v1/collection/operations/{operationId}/department/{departmentId}"] ?? null)), ["put"]);
  assert.deepEqual(Object.keys(object(paths["/api/v1/collection/operations/{operationId}/department"] ?? null)), ["delete"]);
  stripOperationDepartments(current);
  assert.equal(contractDigest(current), "aa0c7ce5baebd3ef474598cf8ebf10520dc44f08aa7eb9f19b22e2c137ace5af");
});

test("transfer rejection adds a required reason body, optional supplier and rejection fields and a department-stock unit only", () => {
  const current = beforeMaterialLookupContext();
  stripIssuedRegister(current);
  stripSubstituteReasons(current);
  stripApprovedVendorList(current);
  stripStockUnitsSubstitutes(current);
  const digest = contractDigest(current);
  assert.equal(digest, "131197bfcb2cebd380f15e839d01f8326f7c403c175e234de342e67a176a0281");
  checkCompatibility(hostConfig, policy, digest);
  const reject = object(object(object(current.paths ?? null)["/api/v1/production-schedule/stock-transfer/reject/{stockTransferId}"] ?? null).put ?? null);
  assert.ok(reject.requestBody);
  assert.deepEqual(current.security, reviewedImport().security);
  stripStockUnitsSubstitutes(current);
  stripTransferRejection(current);
  assert.equal(contractDigest(current), "5125e67ffa628c1514db817e9006369e43e105c9ddf2efca7daa58a531f19bc1");
});

test("cross-store units and substitutes add an optional unit, optional substitute fields and an optional start body only", () => {
  const current = beforeMaterialLookupContext();
  stripIssuedRegister(current);
  stripSubstituteReasons(current);
  stripApprovedVendorList(current);
  const digest = contractDigest(current);
  assert.equal(digest, "08c2823c661cab08eb9f3106b2e859eec2799b52a4bec5a55c46a4c1a69ad231");
  checkCompatibility(hostConfig, policy, digest);
  const start = object(object(object(current.paths ?? null)["/api/v1/production-schedule/activity/start/{productionScheduleProductId}"] ?? null).post ?? null);
  assert.equal(object(start.requestBody ?? null).required ?? false, false);
  assert.deepEqual(current.security, reviewedImport().security);
  stripStockUnitsSubstitutes(current);
  assert.equal(contractDigest(current), "131197bfcb2cebd380f15e839d01f8326f7c403c175e234de342e67a176a0281");
});

test("the approved vendor list adds typed list, read, print, options, mapping, eligibility, create, revise and correct operations only", () => {
  const current = beforeMaterialLookupContext();
  stripIssuedRegister(current);
  stripSubstituteReasons(current);
  const digest = contractDigest(current);
  assert.equal(digest, "c38ebab2b55ea78797f4e8b971fe86e98b0253b0473f256ceba80fef5e34d79b");
  checkCompatibility(hostConfig, policy, digest);
  const paths = object(current.paths ?? null);
  assert.deepEqual(Object.keys(object(paths["/api/v1/approved-vendor-list"] ?? null)).sort(), ["get", "post"]);
  assert.deepEqual(Object.keys(object(paths["/api/v1/approved-vendor-list/{id}"] ?? null)).sort(), ["get", "put"]);
  assert.deepEqual(Object.keys(object(paths["/api/v1/approved-vendor-list/revise"] ?? null)), ["post"]);
  assert.deepEqual(Object.keys(object(paths["/api/v1/approved-vendor-list/eligibility"] ?? null)), ["post"]);
  assert.deepEqual(current.security, reviewedImport().security);
  stripIssuedRegister(current);
  stripSubstituteReasons(current);
  stripApprovedVendorList(current);
  assert.equal(contractDigest(current), "08c2823c661cab08eb9f3106b2e859eec2799b52a4bec5a55c46a4c1a69ad231");
});

test("substitute reasons add one optional field to the batch material and forecast rows only", () => {
  const current = beforeMaterialLookupContext();
  stripIssuedRegister(current);
  const digest = contractDigest(current);
  assert.equal(digest, "a49aa7b16b9748debe24ac90081168a61c465fce5087be12c18bdf8b5034860e");
  checkCompatibility(hostConfig, policy, digest);
  assert.deepEqual(current.security, reviewedImport().security);
  stripIssuedRegister(current);
  stripSubstituteReasons(current);
  assert.equal(contractDigest(current), "c38ebab2b55ea78797f4e8b971fe86e98b0253b0473f256ceba80fef5e34d79b");
});

test("the issued register adds optional list filters and one typed read operation only", () => {
  const current = beforeMaterialLookupContext();
  const digest = contractDigest(current);
  assert.equal(digest, "6fb1587bcddbb7f4765ec5903a49a185a15794d6a0dbf2bbb7d1f1c7d183b520");
  checkCompatibility(hostConfig, policy, digest);
  assert.deepEqual(Object.keys(object(object(current.paths ?? null)["/api/v1/issued-bmrs/register"] ?? null)), ["get"]);
  assert.deepEqual(current.security, reviewedImport().security);
  stripIssuedRegister(current);
  assert.equal(contractDigest(current), "a49aa7b16b9748debe24ac90081168a61c465fce5087be12c18bdf8b5034860e");
});

test("material lookups add only optional page context, preserving all preceding contracts", () => {
  const current = beforeVendorListDrafts();
  for (const path of materialLookupPaths) {
    const operation = object(object(object(current.paths ?? null)[path] ?? null).get ?? null);
    assert.ok(Array.isArray(operation.parameters));
    const context = operation.parameters.map((entry) => object(entry)).filter((entry) => entry.name === "context");
    assert.equal(context.length, 1);
    assert.deepEqual(context[0], { name: "context", in: "query", schema: { type: "string" } });
  }
  stripMaterialLookupContext(current);
  assert.equal(contractDigest(current), "6fb1587bcddbb7f4765ec5903a49a185a15794d6a0dbf2bbb7d1f1c7d183b520");
});

test("versioned costing adds scoped pack-price documents without changing previous contracts", () => {
  const current = beforeVendorListDrafts();
  const paths = object(current.paths ?? null);
  assert.equal(Object.keys(paths).filter(path => path.startsWith("/api/v1/costing/price-lists")).length,7);
  stripVersionedCosting(current);
  assert.equal(contractDigest(current), "014f1ea1bd6abb85ec092620319d7e3f9655e2d9717355b0a381be07a5a15bd7");
});

test("finished goods has typed workflow endpoints and preserves the reviewed costing predecessor", () => {
  const current = beforeVendorListDrafts();
  const paths = object(current.paths ?? null);
  assert.equal(Object.keys(paths).filter(path => path.startsWith("/api/v1/finished-goods/")).length, 28);
  const schemas = object(object(current.components ?? null).schemas ?? null);
  assert.deepEqual(object(schemas["DOMAIN.Entities.ProductionOrders.AllocateProductionOrderStatus"] ?? null).enum, [0, 1, 2, 3, 4, 5]);
  stripFinishedGoods(current);
  assert.equal(contractDigest(current), "86104d8759092ceec330de43d3aded8420dda15a869d600c8c71a47d28fbf119");
});

test("superseded vendor-list deletion adds only a typed delete operation", () => {
  const current = beforeVendorListDrafts();
  const path = object(object(current.paths ?? null)["/api/v1/approved-vendor-list/{id}"] ?? null);
  assert.deepEqual(Object.keys(path).sort(), ["delete", "get", "put"]);
  const operation = object(path.delete ?? null);
  assert.ok(object(operation.responses ?? null)["204"]);
  assert.ok(object(operation.responses ?? null)["403"]);
  assert.ok(object(operation.responses ?? null)["409"]);
  stripVendorListDelete(current);
  assert.equal(contractDigest(current), "4de3b27dd44baafb881ae47d3cfd4489fb3023fb0db7a3090764eadd83539083");
});

test("per-product assay reporting is additive and leaves every previously reviewed operation intact", () => {
  const current = beforeVendorListDrafts();
  checkCompatibility(hostConfig, policy, contractDigest(current));
  const path = object(object(current.paths ?? null)["/api/v1/product-specifications/{id}/assay-reporting"] ?? null);
  assert.deepEqual(Object.keys(path).sort(), ["get", "put"]);
  assert.ok(object(object(path.put ?? null).responses ?? null)["409"]);
  assert.deepEqual(current.security, reviewedImport().security);
  stripAssayReporting(current);
  assert.equal(contractDigest(current), "1d528fdcdfa83245abf471694dd7a95ced8e47aafa3c4e2f05a11a8df7a091a8");
});

test("pending COA review adds only an optional evidence token and conditional approval header", () => {
  const current = beforeVendorListDrafts();
  stripWarehouseVisibility(current);
  const schemas = object(object(current.components ?? null).schemas ?? null);
  assert.ok(object(object(schemas["DOMAIN.Entities.Forms.ResponseDetailDto"] ?? null).properties ?? null).coaReportingToken);
  const operation = object(object(object(current.paths ?? null)["/api/v1/approval/approve/{modelType}/{modelId}"] ?? null).post ?? null);
  assert.ok(Array.isArray(operation.parameters) && operation.parameters.some(parameter => object(parameter).name === "If-Match"));
  stripPendingCoaReview(current);
  assert.equal(contractDigest(current), "6fd6d54f02a89cf876f59bdb801e585884b0d6b3c02e65e1bf7d0122f0290150");
});

test("warehouse queue visibility adds only scoped queue reads and optional certificate identity/status fields", () => {
  const current = beforeVendorListDrafts();
  checkCompatibility(hostConfig, policy, contractDigest(current));
  for (const kind of ["raw", "packaging"]) {
    const path = object(object(current.paths ?? null)[`/api/v1/stock-issue/${kind}`] ?? null);
    assert.deepEqual(Object.keys(path), ["get"]);
    const parameters = object(path.get ?? null).parameters;
    assert.ok(Array.isArray(parameters));
    assert.ok(parameters.some(parameter => object(parameter).name === "productId"));
  }
  stripWarehouseVisibility(current);
  assert.equal(contractDigest(current), "0ea14c2cec5f976c94d1d8c924404e9c4df677ab1896aa09bd26a4f705674382");
});

test("combined queue and pending-COA contracts preserve both independently reviewed predecessors", () => {
  const current = beforeVendorListDrafts();
  stripClearMaterialDensity(current);
  const queueOnly = object(parse(JSON.stringify(current)));
  stripPendingCoaReview(queueOnly);
  assert.equal(contractDigest(queueOnly), "c086962947f8bd43225d8a487f07ffd7c0afc150b4b65964e408fc39410465b3");
  stripWarehouseVisibility(current);
  assert.equal(contractDigest(current), "0ea14c2cec5f976c94d1d8c924404e9c4df677ab1896aa09bd26a4f705674382");
});

test("combined density and queue contracts preserve the reviewed queue contract", () => {
  const current = beforeVendorListDrafts();
  assert.equal(contractDigest(current), "a9df0b96e20cea76d95d5e1f35b1bf01db171111c879c35ea17dff1ecc141f86");
  checkCompatibility(hostConfig, policy, contractDigest(current));
  for (const kind of ["raw", "packaging"]) {
    const path = object(object(current.paths ?? null)[`/api/v1/material/${kind}/{materialId}/density`] ?? null);
    assert.deepEqual(Object.keys(path), ["delete"]);
    assert.ok(object(object(path.delete ?? null).responses ?? null)["204"]);
  }
  stripClearMaterialDensity(current);
  assert.equal(contractDigest(current), "ac2f9bb848dbf7bfac8288eed035c43d3c15f1a7a35d699818b33169e48d4d49");
});


test("vendor-list draft changes preserve the previous reviewed contract", () => {
  const current = beforePendingCertificateChanges();
  const paths = object(current.paths ?? null);
  const root = "/api/v1/approved-vendor-list/{id}";
  assert.ok(object(paths[`${root}/draft`] ?? null).put);
  assert.ok(object(paths[`${root}/submit`] ?? null).post);
  const digest = contractDigest(current);
  assert.equal(digest, "c52621b3f8d8ebc6c969be4afd1cbe0719e95a9712d0beea3283166b7a473757");
  checkCompatibility(hostConfig, policy, digest);
  assert.equal(contractDigest(beforeVendorListDrafts()), "a9df0b96e20cea76d95d5e1f35b1bf01db171111c879c35ea17dff1ecc141f86");
});


test("pending certificate changes add only typed subject-specific actions and certificate state", () => {
  const current = beforeMaterialStockTrace();
  const paths = object(current.paths ?? null);
  for (const subject of ["product", "raw-material", "packaging-material"]) {
    const root = `/api/v1/pending-certificates/{responseId}/${subject}`;
    assert.ok(object(paths[root] ?? null).put);
    assert.ok(object(paths[`${root}/review-request`] ?? null).post);
    assert.ok(object(paths[`${root}/correction-request`] ?? null).post);
  }
  const digest = contractDigest(current);
  assert.equal(digest, "f98896c0e66ab885fdcaf8049301dad3bb0476ed46f26e85566e97474ba0b643");
  checkCompatibility(hostConfig, policy, digest);
  assert.equal(contractDigest(beforePendingCertificateChanges()), "c52621b3f8d8ebc6c969be4afd1cbe0719e95a9712d0beea3283166b7a473757");
});


test("production board ordering adds only its department-scoped read and write contract", () => {
  const current = object(parse(readFileSync("contracts/openapi/backend.v1.json", "utf8")));
  const path = object(object(current.paths ?? null)["/api/v1/production-board-order/{departmentId}"] ?? null);
  assert.deepEqual(Object.keys(path).sort(), ["get", "put"]);
  assert.equal(object(path.get ?? null).operationId, "GetDepartmentProductionBoardOrder");
  assert.equal(object(path.put ?? null).operationId, "SaveDepartmentProductionBoardOrder");
  checkCompatibility(hostConfig, policy, contractDigest(current));
  assert.equal(contractDigest(beforeProductionBoardOrder()), "ed5a4dba5d3d9e8ff51a650289ef4ec833d8b457a9f859be7fd205af072faa93");
});

test("structured STP revisions and STP test links add only their own operations and schemas", () => {
  const current = object(parse(readFileSync("contracts/openapi/backend.v1.json", "utf8")));
  checkCompatibility(hostConfig, policy, contractDigest(current));
  const paths = Object.keys(object(current.paths ?? null)).filter(path => path.startsWith("/api/v1/stp-revisions") || path.startsWith("/api/v1/stp-test-links"));
  assert.deepEqual(paths.sort(), [
    "/api/v1/stp-revisions", "/api/v1/stp-revisions/import", "/api/v1/stp-revisions/import/document", "/api/v1/stp-revisions/numbers",
    "/api/v1/stp-revisions/revise", "/api/v1/stp-revisions/{id}", "/api/v1/stp-revisions/{id}/docx", "/api/v1/stp-revisions/{id}/draft",
    "/api/v1/stp-revisions/{id}/print", "/api/v1/stp-revisions/{id}/submit",
    "/api/v1/stp-test-links/material-specification/{materialSpecificationId}", "/api/v1/stp-test-links/material-specification/{materialSpecificationId}/{formSectionId}",
    "/api/v1/stp-test-links/product-specification/{productSpecificationId}", "/api/v1/stp-test-links/product-specification/{productSpecificationId}/{formSectionId}",
  ]);
  stripStpRevisions(current);
  // Removing only these additions (and the microbial specification additions also in this contract) restores the previously approved contract.
  stripMicrobialTesting(current);
  stripSpecificationMicrobialTemplate(current);
  assert.equal(contractDigest(current), "8c11b59e53c09375328ce898ab3e6f96034990f0683a7125cef186fe62746961");
});

test("specification microbial template adds only the optional microbial template on specifications", () => {
  const current = object(parse(readFileSync("contracts/openapi/backend.v1.json", "utf8")));
  const schemas = object(object(current.components ?? null).schemas ?? null);
  for (const kind of ["Material", "Product"]) {
    const prefix = `DOMAIN.Entities.${kind}Specifications.`;
    for (const name of [`Create${kind}SpecificationRequest`, `Update${kind}SpecificationRequest`]) {
      const schema = object(schemas[prefix + name] ?? null);
      assert.deepEqual(object(object(schema.properties ?? null).microbialFormId ?? null), { type: "string", format: "uuid", nullable: true });
      assert.ok(!(Array.isArray(schema.required) && schema.required.includes("microbialFormId")));
    }
    assert.ok(object(object(schemas[`${prefix}${kind}SpecificationDto`] ?? null).properties ?? null).microbialForm);
  }
  checkCompatibility(hostConfig, policy, contractDigest(current));
  stripMicrobialTesting(current);
  stripSpecificationMicrobialTemplate(current);
  stripStpRevisions(current);
  assert.equal(contractDigest(current), "8c11b59e53c09375328ce898ab3e6f96034990f0683a7125cef186fe62746961");
});

test("microbial testing adds only its question types and specification limit paths", () => {
  const current = object(parse(readFileSync("contracts/openapi/backend.v1.json", "utf8")));
  const paths = object(current.paths ?? null);
  for (const subject of ["material", "product"])
    assert.deepEqual(Object.keys(object(paths[`/api/v1/${subject}-specifications/{id}/microbial-limits`] ?? null)).sort(), ["get", "put"]);
  const schemas = object(object(current.components ?? null).schemas ?? null);
  assert.deepEqual(object(schemas["DOMAIN.Entities.Forms.QuestionType"] ?? null).enum, Array.from({ length: 21 }, (_, index) => index));
  // The combined STP revisions + microbial testing contract of this release.
  const digest = contractDigest(current);
  assert.equal(digest, "d4e3613c13eac5db34e18c33c544e858c842696227c5fef0ff708f149e415abe");
  checkCompatibility(hostConfig, policy, digest);
  stripMicrobialTesting(current);
  assert.equal(contractDigest(current), "a4c38356a13b862fbec3ef7eb5f369b2c2acc8d4b6d3beb20d11a99a9875af05");
});
