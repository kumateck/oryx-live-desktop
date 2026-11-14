Specification printing adds three read operations under `/api/v1/specification-print`
for raw material, packaging material, and product specifications. The print preview
uses the recorded specification revisions and requires the corresponding export
permission. Deploy the backend and its `GrantSpecificationPrintPermissions` data
migration before the frontend. The typed contract digest is
`b25205abc57a22c778b7d1d54adde27e529a30a149a9d2c2c287a53e6af7d755`.

QC worksheet progress (2026-11-12) adds the optional nullable UUID fields
`worksheetResponseId` and `worksheetFormId` to the existing material batch
worksheet details response. These identify the worksheet for the current sample.
The reviewed typed contract has digest `607760d98226801bff574edf1f8009307a230d2237f85a9126c8043e3af5511f`.
Removing only those two fields reproduces `7fbbda4c84600f4344f97f286f092d2635854986928fac39f61bf9376e75a2cc`.
The legacy release policy retains its prior fingerprints and includes this source contract.

Draft migration material linking (2026-11-09) adds typed GET/POST at
`/api/v1/stock-migrations/{id}/material-links/{kind}` and three owned
`DOMAIN.Entities.Materials.StockMigrations.*MaterialLink*` DTOs. Import only these
from the companion backend metadata export using
`bun scripts/import-migration-material-links.ts EXPORT.json`, then regenerate and
run `bun run api:check`. Typed digest
`bca17eb640a0223896ecc0fe8cee0e29d33ebd2d76221c369bda34b54e6a9b58`;
removing only these additions reproduces `4cd376b6…64c`. The contract regression
retains prior approved contracts. Deploy the backend first; no database migration
is needed. See [draft linking](migration-material-links.md).

White Placebo preparation (2026-11-06) adds seven typed operations across six
`/api/v1/white-placebo` paths in the materials domain, their owned
`DOMAIN.Entities.Materials.WhitePlacebo.*` schemas, optional `isWhitePlacebo` on
Material/MaterialDto/MaterialWithWarehouseStockDto and optional
`whitePlaceboPreparationId` on RequisitionDto. Import only those with
`bun scripts/import-white-placebo.ts EXPORT.json`, then regenerate/check. Typed
digest `5211b900a46aff5d1ece7c3e4f73c8ef9ae3127969ffb0945bfca034d3aefe35`;
removing exactly those additions reproduces `7598763c…6414`. The companion
`AddWhitePlaceboPreparation` migration must precede activation. See
[White Placebo preparation](white-placebo.md).

The 2026-11-05 merged forecast, migration batch-number correction and manual
top-up contracts have typed digest
`ba9b4556768dbaf418600e907610ec613e52b3e6a89aadc2bd675c367f503f75`.
The contract regression removes exactly those three documented additions to
reproduce the approved reservation-repair baseline `fa46de38…d238`, then checks
the earlier baselines and rejection cases. The legacy release policy retains
each individual approval and adds this combined import. This source review does
not deploy the backend or apply migrations.

Production material forecast (2026-11-05) adds one typed read,
`GET /api/v1/report/production-material-forecast?year=&month=`, in the reports
domain, guarded by `CanViewProductionScheduleMaterialForecast`. Import only it and
its `DOMAIN.Entities.Reports.ProductionMaterialForecast*` schemas using
`bun scripts/import-production-material-forecast.ts EXPORT.json`, then
regenerate/check. Reviewed digest
`f36fcd3ae72f006f627a654bdb9020a697fbc5977577308ad5cef9570daf810f`; removing
exactly that path and its schemas gives the reservation-repair digest
`fa46de38…d238`. See [production material forecast](production-material-forecast.md).

Batch reservation repair (2026-11-05) adds typed preview/apply operations under
`/api/v1/production-schedule/{batchId}/reservation-repair` in the production domain.
Import only its paths and owned schemas using
`bun scripts/import-reservation-repair.ts EXPORT.json`, then regenerate/check.
The companion `AddReservationRepairs` migration must precede UI activation. See
[batch reservation repair](batch-reservation-repair.md).

Formula repair (2026-11-05) adds five typed operations under
`/api/v1/formula-repairs`, owned by the forms domain, plus
`formulaConfigurationHash` on form fields and draft saves, repair state on form
responses, `effectiveForm` on response details and an optional `responseId` on
`GET /api/v1/form/{formId}`. Import only those with
`bun scripts/import-formula-repairs.ts EXPORT.json`, then regenerate/check. The
companion `AddLegacyFormulaRepairs` migration must precede activation. See
[formula repair](question-formula-repair-proposal.md).

# API contracts and generated hooks

BOM substitute quantities (2026-11-14) add typed `GET`/`POST`
`/api/v1/requisition/{requisitionId}/material-options` (warehouse domain), five owned
schemas, and optional substitute quantity fields on BOM substitute DTOs/requests plus
`substituteFor` on `RequisitionItemDto`. Import only these with
`bun scripts/import-bom-substitute-quantities.ts EXPORT.json`, then regenerate/check.
Typed digest `6c84e6f93d57882923dc0cc61a6e7df1649371ab08a8b34ccd287150105b9806`;
removing exactly these additions reproduces `3e3337d5…3b33`. Apply
`AddBomSubstituteQuantities` and `GrantChooseRawMaterialRequisitionSubstitute` and deploy
the backend first. See [BOM substitute quantities](bom-substitute-quantities.md).

Migrated batch details add the typed `PUT /api/v1/material/batch/{batchId}/migration-details`
operation and optional GRN fields on `MaterialBatchDto` and `MaterialStockReportRow`.
Import the metadata with `bun scripts/import-migration-batch-details.ts EXPORT.json`.
The reviewed contract digest is `474090995ed29dc1fccf7f204706e9127181e120b1ee0014fb6e6e852f5d2d23`.
Apply `AddMigrationBatchDetailsCorrections` and deploy the backend before the desktop.

Product batch stems add the optional `batchStem` field to the product create
request and product list DTO, inherited by update and detail contracts. Import the
metadata with `bun scripts/import-product-batch-stem.ts EXPORT.json`. The reviewed
digest including migrated batch details is
`7fbbda4c84600f4344f97f286f092d2635854986928fac39f61bf9376e75a2cc`.
Apply `AddProductBatchStem` and deploy the backend before the desktop.

BOM density conversion adds the optional `useDensityConversion` boolean to
`CreateBoMItemsRequest` and `BillOfMaterialItemDto`. Its typed contract digest
is `4eabf615f3d9c244ca4086698d4a4845a96c64edeb1e69bf649863f76494f726`; the
customer deployment release policy approves this additive contract. The
matching backend defaults old BOM rows to conversion off and requires its
database migration before the desktop flow is enabled.

Migration batch-number corrections (2026-11-05) add optional `batchNumber` and
`expectedBatchNumber` to `DOMAIN.Entities.Materials.Batch.UpdateMigrationRetestDate`
(backend kumateck/oryx-backend#1719). Reviewed typed digest
`1bf73fd1eefb5e2ff029b420277ad7efaf02364c66b2fdc4e65560a66b99d09a`; removing exactly
these two fields reproduces `fa46de385e587bca0821ff164522fedda3dca60d5e0b044336bd7093fe87d238`.

Formula repair and migration AR corrections (2026-11-05) are reviewed together as
typed digest `d31b1bc59265cc6a98c995e9c3b3249dc8f73d948701228e1573cf31d01e888f`.
Removing exactly their declared additions (the five `/api/v1/formula-repairs`
paths and schemas, the optional `responseId` on `GET /api/v1/form/{formId}`,
the formula-configuration/repair fields on form DTOs, and `arNumber`/
`expectedArNumber` on `UpdateMigrationRetestDate`) reproduces the bulk-repair
digest `bfaa319fb93979896947892ba9f3e665f1cbdff24700647b6a126c60a3a90f47`; every
prior approval remains. Apply `AddMigrationArCorrections` and
`AddLegacyFormulaRepairs` and deploy the matching backend before activation.

Bulk product-within-schedule repairs (2026-11-04) add typed GET/POST at
`/api/v1/production-schedule/{scheduleId}/product/{productId}/repair/{kind}`.
`ProductionScheduleBulkRepair` belongs to the production transport domain. Use
`bun scripts/import-schedule-repairs.ts EXPORT.json`, then regenerate/check;
pre-existing operations and schemas are preserved. The companion bulk audit
migration is required before activation. The source review for companion backend
PR #1702 adds typed digest `bfaa319fb93979896947892ba9f3e665f1cbdff24700647b6a126c60a3a90f47`
while preserving every prior approval. No customer deployment or migration is
performed. See [bulk repairs](bulk-schedule-repairs.md).

Expiry stock departments (2026-11-04) add only optional
`MaterialBatchDto.stockDepartments`, referencing the existing collection-item
schema. Import it from a built metadata-only backend export with
`bun scripts/import-expiry-departments.ts EXPORT.json`, then regenerate/check.
The matching backend binds report reads to the authenticated account's current
department; no client department selector or new permission key is introduced.
The reviewed additive digest is
`35c00c063402f8cf1248db7ca3a9093ce997e66858311b4864de7890a50d3dad`;
all prior reviewed digests remain accepted. See [expiry report departments](expiry-report-departments.md).

Production unstart repair (2026-11-03) adds typed preview/apply at
`/api/v1/production-schedule/activity/{activityId}/unstart`, owned by the
production transport domain. Import only these paths and
`DOMAIN.Entities.Products.Production.ProductionUnstart*` schemas with
`bun scripts/import-production-unstart.ts EXPORT.json`, then regenerate/check.
It requires the matching backend and prepared unstart migration before UI
activation; no deployed release fingerprint is approved. See
[unstart production](production-unstart-repair.md).

Post-issue material repairs (2026-11-03) add typed preview/apply operations at
`/api/v1/production-schedule/{batchId}/issued-material-repair/{kind}`, owned by
the production transport domain, and optional `ApprovedQuantity` on requisition
item reads. The scoped metadata import is
`bun scripts/import-issued-material-repair.ts EXPORT.json`; regenerate through
the existing generator. The companion audit migration must precede activation.
See [post-issue repairs](post-issue-material-repairs.md). Existing operations,
approval payloads and deployed release fingerprints remain unchanged.
The production-step status operation additionally documents 409 for a stale
consumption snapshot; its request and success response are unchanged.
QA product editing adds optional `productId` context to the material-department
list and material-unit read. Only those two parameters are imported from the
metadata-only companion export; no operation, response schema or security changes.
The materials client is regenerated. See [QA products](qa-products.md).

Issued-BMR records (2026-11-03) add five typed operations under
`/api/v1/issued-bmrs`: list, history, batch-number correction, date-revision request
and revision review, tagged ProductionSchedule. Nine owned schemas are imported
from the metadata-only backend export. Existing operations, security and schemas
remain unchanged. The reviewed additive fingerprint is
`72b0d96542fd4728f86f4dc0f80986021abed7569010420a0734296e12bb219f`;
prior reviewed fingerprints are retained. See [issued BMR records](issued-bmr-records.md).

## Combined report and repair contract review (2026-11-03)

The legacy host-Nginx release policy now records the exact combined import digest
`a485b5e6830f1102c312ad08b9ddd4a9992ce64109018a5b59961294b47496fe`.
This addresses the testing release's installer-fixture failure after desktop
PRs #68 and #69 were combined. The contract regression retains its comparison of
all prior operations, schemas and security, allowing only the documented issued-BMR
query, four material-repair operations, their response/request schemas and optional
content revisions in addition to previously reviewed features. It also verifies
the real release-check command and rejection of altered current authentication,
permission and response contracts. Earlier approved fingerprints remain valid;
unreviewed fingerprints remain blocked.

This review covers the checked-in contract without White Placebo. The matching
backend report and repair APIs are in backend PRs #1681 and #1680. Material repairs
still require migration `20261102182519_AddProductionMaterialRepairs` before use.
No customer backend, database, shell baseline or deployment protocol is changed
by recording this source-contract review.

Migration stock top-ups (2026-11-03) add `POST /api/v1/stock-migrations/top-ups`
and multipart `POST /api/v1/stock-migrations/top-ups/upload`, plus mode/reason,
posted-batch IDs, comparison added quantities and correctable receipt references
in the owned stock-migration DTOs. Import only the stock-migration paths/schemas
from the companion metadata export and regenerate the materials domain. Keep
unrelated contract declarations and customer release fingerprints unchanged.
unrelated contract declarations and retain prior customer release fingerprints.
The migration-only integration review below records its additional exact digest.
The matching backend and top-up schema migration must precede activation. See
[migration stock top-ups](migration-stock-top-ups.md).

QA issued-BMR reporting (2026-11-02) adds only
`GET /api/v1/report/bmr-issued` (`GetIssuedBmrReport`) and the
`IssuedBmrReportDto` / `IssuedBmrReportRowDto` schemas from the companion backend's
built, metadata-only OpenAPI export. The generator owns the reports client and
cache tags. The compatibility regression explicitly allows this additive query
and its two schemas while preserving prior operations and security. Required
date-only `startDate`/`endDate` are inclusive UTC issue dates; `departmentId` is
optional. The matching backend must precede frontend activation; the customer
release fingerprint remains subject to coordinated compatibility review.

The desktop keeps one RTK Query API in `apps/web/src/shared/api/base-api.ts`. Domain outputs inject endpoints into it. Route chunks import only their domain output, keeping the shell and login path free of the full ERP endpoint graph.

## Reproduce the contract

Run from `oryx-live-desktop`:

```bash
bun run api:export
bun run api:generate
bun run api:check
```

The desktop uses the same backend as Oryx Next. Additive features such as purchase-unit synchronization require their companion backend migration/API before frontend rollout. `api:export` downloads the OpenAPI document the backend already publishes at `/swagger/v1/swagger.json` and saves it as `contracts/openapi/backend.v1.json`. By default it reads `http://localhost:5299` (the backend started locally; no database is needed to serve the document); set `ORYX_OPENAPI_URL` to use another running instance. The backend declares its `Module` and `SubModule` audit headers without a type, so the export records them as strings; nothing else is altered.

`api:generate` writes one file per domain to `apps/web/src/shared/api/generated/`. These are transport code and must never be edited by hand. `scripts/api-domains.ts` assigns every backend controller tag to exactly one domain; generation fails when the contract contains a tag that no domain owns, so a new controller cannot be missed. An operation is generated once, into the domain of its first tag.

Generation is strict per operation, not per domain. `scripts/api-contract.ts` reads the contract and skips any operation that would produce `any` or `unknown`: a 2xx response other than 204 with no declared body type, or a request, parameter, or response schema that reaches an untyped property. Skipped operations are listed with their reason in the generated `docs/api-untyped-operations.md`, which is the backend typing backlog. A 204 response becomes `void` automatically. ASP.NET ProblemDetails extensions are arbitrary JSON, represented by a recursive `JsonValue` type. Any `any` or `unknown` that still reaches the output fails generation. `api:check` regenerates everything, compares it with the committed files and the backlog, and leaves the working tree unchanged.

The current contract has 1,402 operations: 1,163 have hooks across 20 domains and 239 are skipped. To get a missing hook, declare the type on the controller (`[ProducesResponseType(StatusCodes.Status200OK, Type = typeof(...))]`), then run `api:export` and `api:generate`.

For an offline export from the companion backend source, run `dotnet API.dll --export-openapi /absolute/path/backend.json` from its build directory, then `ORYX_OPENAPI_FILE=/absolute/path/backend.json bun run api:export`. The metadata-only export exits before database seeding, listeners and hosted services start. Review the source contract and update the customer-server compatibility fingerprint alongside a coordinated backend/UI release; generation alone is not compatibility approval.

Sign-in and session restore call the existing auth endpoints directly and validate the replies with Zod, which keeps Redux out of the login bundle. Authenticated routes mount the RTK Query store; it is rebuilt when the signed-in user changes, so one account never receives another account's cached records. Requests carry the bearer token; a 401 renews the token once and repeats the request before the session is treated as expired. See `docs/session-and-access.md`.

## Use a domain in a module

1. Check `docs/api-untyped-operations.md`. If an operation the module needs is listed, its response type has to be declared on the backend before a strict hook exists; until then, define that one endpoint by hand in the module's `api/` file with a Zod-validated response. After a backend update, run `bun run api:export` and `bun run api:generate` and review the changed paths.
2. A new backend controller tag must be added to a domain in `scripts/api-domains.ts`. Add a new domain only when no existing one fits; keep a domain to what one area of the ERP loads together.
3. Put cache tags and invalidation in the module's handwritten `api/` file with `enhanceEndpoints`. Register module-owned tags through its `addTagTypes` option (as in configuration collections); use `base-api.ts` for tags shared across modules. Do not edit generated output or invalidate every ERP query after one mutation.
4. Import hooks only from that `api/` file, inside lazy module routes, so the shell and login path never load a domain's endpoints. Validate critical nullable transport fields before rendering or mutating.
5. Run `bun run check` and the web build.

The first identity slice is Roles. Its mutation headers identify `Access Management / Manage Roles` for audit, matching Oryx Next.

## Cache tags

A save must refresh what it changed, wherever it is shown, and nothing else. `bun run api:generate` tags every generated endpoint from its URL (`scripts/api-cache-tags.ts`), so no endpoint is ever left untagged and new backend operations are covered as soon as they are generated.

| Endpoint | Tags |
| --- | --- |
| Query without a path parameter (a list), e.g. `GET /warehouse/grns` | provides `warehouse/grn:LIST` and `warehouse:LIST` |
| Query with a path parameter (a record or something of it), e.g. `GET /procurement/shipment-document/{id}/material-distribution` | provides `procurement/shipment-document:{id}` |
| Mutation, e.g. `PUT /warehouse/grn/{id}` | invalidates `warehouse/grn:LIST`, `warehouse:LIST`, and `warehouse/grn:{id}` when the path names a record; nothing when the save failed |

A resource is the first two literal path segments, singular (`grns` and `grn` are one resource); its family is the first. The tag types are generated into `generated/cache-tag-types.ts`. Generation fails if an endpoint's URL cannot be read.

Two rules keep this precise:

- **Modules add tags; they never replace them.** In `enhanceEndpoints`, use the function form with `addTags` (`shared/api/add-tags.ts`): `name: (definition) => { definition.providesTags = addTags(definition.providesTags, [...]); }`. The object form `name: { providesTags: … }` would drop the generated tags, and a test (`tests/api-cache-tags.test.ts`) fails on it.
- **Effects a URL cannot show are declared once**, in `shared/api/cache-effects.ts`: deciding an approval refreshes the document decided (by model type and id), and assigning, sampling or starting a test refreshes its batch, its goods receipt note and the test-request lists. Add a row there when a save changes a record under another URL.

Changes made elsewhere (another user, another window, Oryx Next) cannot be seen by tags. A page reads its data again when it opens on data older than 30 seconds, when the window regains focus, and after a reconnect (`shared/api/base-api.ts`). Live updates of other people's changes are proposed in `docs/proposals/entity-changed-events.md`.

The finance costing operations (`/api/v1/costing/...`, tag `Costing`, sales domain) and the typed customer pricing-agreement operations were added on 2026-10-31 from the companion backend offline export, with the product and report schemas that gained a currency property. Only those paths and schemas were merged; the export's other differences were left for their own review. The contract review test lists each allowance, and the customer-server release fingerprint must be approved against the deployed backend's export at release. See [costing](costing.md).

The opening-stock migration operations (`/api/v1/stock-migrations`, tag `StockMigration`, materials domain) were added on 2026-10-30 from the companion backend offline export. Only those paths and their `StockMigration*` schemas were merged into the contract; the export's other differences were left for their own review. The upload is multipart and is declared by hand in the Upload Center module.

The admin user password operation (`POST /api/v1/auth/admin/user-password`, tag `Auth`) was added on 2026-10-31 from the companion backend offline export, with its `AdminResetUserPasswordRequest` schema only. See [Change user password](user-passwords.md).

Purchase-unit additions are staged in the versioned contract from the companion
backend controller/DTO declarations; generated clients pass through the normal
generator. Re-export from the upgraded backend during release verification. See
[supplier purchase units](supplier-purchase-units.md).

## Raw Swagger versus typed import fingerprint

The export's documented `Module`/`SubModule` string-schema adjustment changes the canonical digest even when the backend API contract is otherwise identical. The [2026-10-27 customer review](customer-backend-contract-review-2026-10-27.md) verifies that raw digest `c89615ea1e0050bbb0ed5f61f9308ee87e5398e79b3972b00e4dee33587abdc1` differs from the pinned typed import only by these 2,716 declarations. Both exact digests are explicitly approved. Deployment continues to hash the raw document without normalization; a different digest still requires contract review.

Historical report parameters and report-only vendor lookup were reviewed as additive changes on 2026-10-27. The dated customer export review test preserves the original proof independently and checks every pre-existing operation/schema/security declaration against the current import after removing only the documented optional read parameters and 409 responses. See [reports](reports.md).

The combined production-readiness operation was added on 2026-10-28 from the companion backend offline export. It adds one reports-domain query and nine response schemas; the contract regression proves every pre-existing operation/schema/security declaration remains unchanged. The legacy host-Nginx policy retains previous approvals and adds the reviewed raw and typed digests. Frontend activation requires this companion endpoint; see [reports](reports.md).

Production material repair was imported on 2026-11-02 from a built, metadata-only
companion backend export. Only the BOM/packaging preview/apply paths, their four
DTO schemas and optional `contentRevision` properties on `ApprovalEntity`,
`ApprovalRequestBody` and `RequisitionDto` were merged. Stable operation IDs are
`PreviewProductionBomRepair`, `ApplyProductionBomRepair`,
`PreviewProductionPackagingRepair` and `ApplyProductionPackagingRepair`.
The customer contract regression explicitly allows only those additions;
`bun run api:generate` regenerates the production, approvals and warehouse clients,
and `bun run api:check` verifies reproducibility. Backend migration
`20261102182519_AddProductionMaterialRepairs` and the matching API must precede UI
activation. No deployment fingerprint was approved by this import. See
[production configuration repairs](production-configuration-repair-study.md).

Raw-material retest extension changes (2026-11-03) add the migration-retest-date
write, its request schema, optional expiry-list search, and additive effective
validity fields on batch/reservation DTOs. They require the coordinated companion
backend; no deployed fingerprint is approved by this source-only review. See
[material retest extensions](material-retest-extensions.md).


## Migration-only integration review (2026-11-03)

The local development integration excludes White Placebo and preserves the latest
production-material repairs and packaging reads. The additive regression verifies
all earlier operations, schemas and security after removing only the declared
migration additions. The legacy host-Nginx allowlist retains earlier approvals
and adds the exact reviewed typed import
`1b39795d5f488711aad8274fc59896e599860a7ea5a827783d60969a73bddee3`.
This is a source compatibility review, not evidence of a customer upgrade:
apply both stock-top-up and retest-audit migrations and deploy the matching backend
before activating the UI. No database migration, role grant or deployment occurs
when these local Git commits are merged. Pushes remain manual.

## PR #85 merge contract review (2026-11-04)

The additive merge retains QA product scope, pre-issue production repairs and issued
BMR corrections from development, plus post-issue repairs and production unstart.
All prior-operation/schema/security comparisons and rejection tests still apply.
The exact merged typed digest is `d26ad659839ddc4ec2e1fb26aadeaac692c19e27c7e075a7cc2fe56b8d4ff4ed`; previous approvals remain.
No customer deployment or database migration is performed.

## Department stock-count reporting (2026-11-04)

`bun scripts/import-expiry-departments.ts /path/to/backend-export.json` imports
only the additive expiry `stockDepartments` field, the stock-report GET, and its
owned DTO schemas. Run `bun run api:generate` and `bun run api:check`. The exact
reviewed digest is `f38dceee6e53dc16783197bce0ceb9d36b902f2d1d0b5185a77a1698adec5e9f`;
whole-document comparisons retain the existing endpoint, schema and security
contracts after removing only declared additions. Deploy the backend before UI
activation. No database migration or customer deployment is performed by this import.
See [stock reporting](expiry-report-departments.md).
Migration reference corrections (2026-11-04) extend only
`DOMAIN.Entities.Materials.Batch.UpdateMigrationRetestDate` with optional
`arNumber` and `expectedArNumber`. Import this request schema from the built
companion metadata export, then regenerate and check the materials client.
An omitted AR preserves the current reference; an empty string clears it. This
requires the companion `AddMigrationArCorrections` audit migration. No customer
release fingerprint is approved by this source change.
