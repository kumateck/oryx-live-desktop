# Desktop service integrations

## Quarantine GRNs and distribution (2026-10-20)

`modules/quarantine-area/api/quarantine-api.ts` (reads) and the lazily loaded `api/distribution-api.ts` (writes) compose the existing generated warehouse and procurement endpoints. No generated code or server endpoint was changed.

| Endpoint | Responsibility |
| --- | --- |
| `GET /api/v1/warehouse/grns` | List notes for the allowed material kind. |
| `GET /api/v1/warehouse/grn/{id}` | Read batches and `checkLists[].distributedRequisitionMaterial.distributedRequisitionItems`; also used with a forced network read before distribution. |
| `POST /api/v1/procurement/distribute-material` | Write one reviewed warehouse allocation as an array of `{ warehouseId, materialBatchId, uoMId, distributedRequisitionItemId, quantity }`; success is 204. |

Read audit headers: `Module: Warehouse`, `SubModule: Quarantine Area`. Distribution uses Oryx Next's headers: `Module: Warehouse`, `SubModule: Quality Assurance Goods Receipt Note`. The normal authenticated transport supplies the user token. No separate quality-status update is issued.

Successful distribution invalidates shared `Grns` and `DistributedStock` tags, alongside the generated endpoint tags. Rejected mutations do not invalidate unrelated modules or retry automatically. See [workflows.md](workflows.md) for eligibility, validation, failure handling, and the existing backend enforcement limitation.

The shared `shared/material-batches/received-batch.ts` schema retains material id,
optional kind, unit id, assigned quantity and distributed quantity. The GRN
contract returns `materialBatches[].material` as `CollectionItemDto` (no kind).
The quarantine GRN adapter resolves each batch's kind by material ID from
`checkLists[].material.kind`, which is part of the full `MaterialDto`. An explicit
batch kind remains compatible with richer responses; conflicting or unavailable
evidence cannot authorize distribution. No kind is inferred from the URL.
Missing assigned/distributed values remain null rather than becoming zero.

QC GRNs and warehouse GRNs now share `shared/material-batches/batch-status.ts`, preventing their status definitions from drifting.

## Attachment preview (2026-10-20)

PDF, DOCX and XLSX render inside Oryx from pinned local WASM assets. No new backend or document-service endpoint was added. Existing `GET /api/v1/file/{modelType}/{modelId}/{reference}` and `GET /api/v1/file/{modelType}/{reference}` stream MinIO files; signed direct links also work when their storage origin allows browser CORS. No attachment upload or mutation is issued by the viewer. See [attachment-viewers.md](attachment-viewers.md) for build assets, bounds, isolation, current anonymous-file transport assumptions and release checks.

Controlled STP version previews reuse `GET /api/v1/stp-documents/documents/{documentId}/versions/{versionId}/file`, through the existing authenticated RTK Query adapter with `Module: Quality Assurance` and `SubModule: Standard Test Procedure`. The adapter returns an owned local object URL; the caller reads its bytes and revokes it, then the document renderer consumes those bytes directly. Image previews own a separate temporary object URL until close. Tokens, endpoints and cookies are not sent to the sandbox. A refused read never opens the viewer or falls back to an unauthenticated request. No server contract or permission/approval rule changed.

New form selections enter the same viewer directly as local Blob sources. Rich-text file links and filename buttons use the central opener, while ordinary web links and explicit download/export actions retain their purpose. No backend upload, conversion or document-service connection is required for preview.

Shipment attachment follow-up: the existing file endpoint successfully returns the reported PDF with `Content-Disposition: attachment`. The viewer consumes its bytes rather than navigating an iframe to that response. `/viewers/` is a static web-asset namespace (not a new document API), retained alongside versioned SPA chunks. Missing engine URLs return 404 and incomplete engine releases fail startup. See [attachment-audit.md](attachment-audit.md) and [deployment.md](deployment.md).

The shared viewer no longer exposes a separate **Open original** action: it displays the attachment returned by the existing file transport. Only image previews need a viewer-owned object URL; document bytes go straight to validation and the isolated engine. No backend endpoint, permission, audit header or persistence behavior changed.

Read-only viewer builds expose only an assigned-file read and render-error callback from Rust; they do not register save/checkpoint handlers. The parent save guard remains defensive and reports a viewer error on any mutation notification. No service endpoint or permission contract changed. Engine assets are addressed by both source revision and archive hash.

## Five-domain migration in progress (2026-10-21)

Reports compose existing `/api/v1/report/*`, material/product catalogs and production-schedule endpoints. Validated handwritten adapters correct four response shapes without editing generated endpoints. Employee workflows use existing `/api/v1/employee` profile/assignment/status/email endpoints, multipart `/api/v1/file/Employee/{id}`, and the existing onboarding invitation endpoint. Attendance uses existing summary/day reads and multipart `/api/v1/attendance-records/upload/{date}` with the date query parameter as well. No server endpoint was added. See [contracts and limitations](implementation-2026-10-20/reports-and-hr.md) and the [implementation tracker](implementation-2026-10-20/README.md).

## Desktop session persistence — 2026-10-21

Session persistence: existing authentication endpoints are unchanged. The desktop confirms OS-encrypted token persistence before completing login/renewal, serializes atomic vault saves, and drains pending saves on close/quit. Shared renewal survives page cancellation; transient renewal failures preserve the stored session. See `session-and-access.md`.

## HR operational requests — 2026-10-21

Leave, overtime and staff requisitions use the existing HR REST endpoints and audit headers. Handwritten multipart leave attachment upload uses `/api/v1/file/LeaveRequest/{id}` and invalidates detail/list cache tags. Shared model approval history reads the existing approval endpoint. Department-scoped employee membership includes immediate child departments. No endpoint/server implementation changed. See `implementation-2026-10-20/hr-requests-and-session.md` for contract limitations and the locally applied, tested refresh-token owner fix (not deployed).

## Payroll contracts — 2026-10-21

Payroll configuration, compensation, adjustments, history, runs and payslips use existing controller endpoints with validated handwritten responses for operations skipped by generated OpenAPI. Shared pay-grade contracts/transport are under `shared/payroll`. Exports read bounded original XLSX with `FileType=xlsx`, current permission and session checks, and display in the read-only attachment viewer. No payroll backend change or deployment was performed. See `implementation-2026-10-20/payroll.md`.

### Performance migration (2026-10-21)

`shared/performance` validates the existing `/api/v1/performance` cycles/goals/reviews DTOs and successful-write invalidation. Generated files remain unchanged because these response types are absent from the versioned OpenAPI schema. Dedicated performance review decisions use the existing assigned-stage and approval endpoints, with full goal reconciliation. See `implementation-2026-10-20/performance.md` for permissions and the missing authoritative account/employee ownership contract. No new backend performance endpoint has been applied.

### Shift planning and import (2026-10-21)

Live uses generated HR schedule/range/employee/category operations and shared validated shift contracts. The assign/swap 200-empty operations are listed as untyped in the OpenAPI backlog; handwritten typed command adapters send audit headers and preserve generated tags. Import uses a multipart `file` with `departmentId` and `shiftId`; the controller returns 204 and discards its skipped-row summary, so Live reconciles the resulting calendar. Existing range/day reads ignore supplied dates; filtering is applied after identity validation. See `implementation-2026-10-20/shifts.md` for exact permissions and unsafe update-schedule/server authorization gaps.

### Store-vendor migration (2026-10-21)

`/extrals/vendors` uses generated inventory vendor/item CRUD and existing Country/Currency collections. Because the backend ignores vendor searchQuery, a bounded typed search adapter reads and validates every page before filtering and uses the generated `vendor:LIST` tag. No generated API file changed. The backend's missing granular permissions, anonymous item/vendor reads and missing update uniqueness/link-deletion validation remain recorded in `implementation-2026-10-20/store-vendors.md`.

### Services and contractors (2026-10-21)

Four Live routes use generated service/provider CRUD and the existing file contract. Service attachments upload as multipart `files` only after a confirmed saved UUID and open through the central read-only viewer. Specific file removal uses modelId plus the stored reference. Complete active/inactive reads validate duplicate service names/codes. Contractor writes verify the full persisted association set; the matching backend source repair persists Services and protects historical job/financial links on deletion, with no endpoint shape changes. See `implementation-2026-10-20/services-and-contractors.md` and backend `docs/service-provider-maintenance.md`. The source repair is not deployed.

### General inventory, stock and receiving

Generated item CRUD combines with a Zod-validated adapter for the stock endpoint's actual pagination envelope (the published schema incorrectly declares an array). Exact store/query/record identities and bounded complete search are checked. Item file stages use confirmed model IDs and stored references through the central original read-only viewers. Receipt decisions and damage creation reconcile resulting stock; the matching undeployed backend source now enforces current store grants, maker-checker, ledger integrity, definition history and concurrency. Endpoint request/response shapes are unchanged; see `implementation-2026-10-20/inventory-and-stock.md` and backend `docs/inventory-stock-integrity.md`.

## Billing-sheet charge entry (2026-10-23)

The create billing-sheet and add-charges forms each hold one required currency
selection. `POST /api/v1/procurement/billing-sheet` still sends
`charges[].{chargeId, currencyId, amount}`;
`POST /api/v1/procurement/billing-sheet/charge/{billingSheetId}` sends the same
per-charge fields as its existing array body. The selected currency is copied
to every submitted charge. No generated types, server endpoints, audit headers,
payment records or existing saved charge currencies change.

## Billing-sheet number generation (2026-10-24)

Creation reuses `shared/codes/use-generated-code` and `generate-code`. It reads the
existing `GET /api/v1/configuration/by-model-type/BillingSheet` configuration with
Settings / Code Settings audit headers. A domain count loader reads
`GET /api/v1/procurement/billing-sheet?page=1&pageSize=1` with Logistics / Billing
Sheets headers and supplies its validated `totalRecordCount` to the shared generator.
The unsupported generic `GET /api/v1/configuration/BillingSheet/count` is not used.
No configuration writes, endpoint changes or generated-client edits are required.
Other models keep their existing generic count loader.

### Automatic GRN number generation

The receiving GRN form uses the existing `GET /api/v1/configuration/GrnNumber/count`
with the warehouse/material-kind/year prefix for both its automatic preview and
fresh issue-time number. It sends that number through the unchanged GRN create
API with Warehouse / Receiving Area audit headers. Invalid or failed counts block
the write and expose retry. See [GRN numbering](grn-number-generation.md).

### Test-result file draft state and metadata

The shared response writer acknowledges successful file drafts immediately and
keeps the returned response ID for later writes. Material-batch, product-test and
routine answer readers retain existing `attachments` metadata and pass it to the
shared upload/attachment viewer. Draft and finalize URLs/contracts are unchanged.
The backend assigns a stable field ID before storage and returns upload failures.
See [test-result file drafts](test-result-file-drafts.md).

## Supplier material purchase-unit lookup (2026-10-24)

The generated `GET /api/v1/material/{materialId}/purchase-units` reads distinct
symbols linked across all departments. Supplier requests persist `purchaseUnit`
symbols; responses also expose `pendingPurchaseUnit`. Pricing and quotation writes
share backend synchronization and existing approval handling. The backend migration
must precede the frontend release. See [purchase-unit contract and rollout](supplier-purchase-units.md).
