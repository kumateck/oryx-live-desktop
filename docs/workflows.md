# Desktop workflow corrections

## Approved GRN distribution (2026-10-20)

The desktop quarantine detail now follows Oryx Next's approved-material distribution flow:

1. Read the GRN and the backend's complete `BatchStatus` contract (0–12). `Approved` is **8**, distinct from `Available` (3). New status values display `Unknown (value)`; absent values display `Not recorded`. Neither grants eligibility.
2. A raw or packaging viewer with the matching distribute permission can open **Distribute**. Select an approved material and review remaining approved stock, outstanding requests, batch allocations, and shortfalls by warehouse.
3. Quantities use `totalQuantity - quantityDistributed`, not remaining stock or quantity assigned to shelves. Repeated checklist/request references are deduplicated. Requests for the same warehouse keep their individual requisition ids. As in Next, smaller warehouse requests are planned first, using larger outstanding batches first.
4. A warehouse action reads the GRN again. Changed approval, quantities or request allocations require another review. Access is checked before preflight and immediately before the write. Repeated clicks cannot send concurrent mutations from the dialog.
5. The existing procurement distribution endpoint records the destination, batch, unit, requisition item, and quantity. This creates stock waiting in the distributed area; it does not approve a batch or place it on shelves. Successful writes invalidate GRN and distributed-stock caches.
6. Failures remain visible in the dialog. A failed write refreshes stock evidence, without automatically replaying the mutation. No optimistic stock or quality-status mutation is performed.

Permissions: `CanViewQuarantineRawMaterials` + `CanDistributeRawMaterials`, or `CanViewQuarantinePackagingMaterials` + `CanDistributePackagingMaterials`. The actual batch material kind controls access, including when the URL names another kind. There is no role-name or superuser bypass.

The client rejects incomplete identifiers, missing quantity-distributed evidence, non-positive allocations, incompatible unit families, unapproved batches, and plans exceeding the available batches or outstanding requests. Storage quantities remain in the smallest unit of their family, including when the DTO names kg or L; conversion is for display only.

**Existing backend limitation:** `ProcurementRepository.DistributeMaterialToWarehouse` currently checks batch existence, then increments `QuantityDistributed` and saves the allocation records. It does not atomically enforce approval, remaining stock, requisition limits, or the raw/packaging action permissions. The desktop checks and preflight do not provide cross-client locking or replace those missing server checks. This change preserves the existing API contract; server enforcement is separate work. No live inventory was changed during verification.

See [services.md](services.md) for request/audit details, [inbound logistics](inbound-logistics-migration.md) for receiving, and [warehouse stock](warehouse-stock-migration.md) for shelving.

## Verification

- 17 focused tests pass across quarantine distribution, receiving, and QC status/action regression suites.
- The production web build (including strict TypeScript checking) passes.
- React Doctor scanned all 17 changed/new source files without findings; the Impeccable detector reported no findings on the changed UI components.
- Interactive visual verification could not run because local browser use is disabled in Work settings. The route interactions above were checked with stubbed API responses in jsdom. No live distribution or deployment was performed.

## Viewing attached documents (2026-10-20)

Select the **filename** or **View** for an attachment anywhere it is exposed in the application. PDF, DOCX and XLSX use the built-in document engines; images use the common preview dialog. Unsupported formats show an explanation inside the same viewer. Oryx fetches the existing stored file, validates it in a bounded worker and starts the matching built-in isolated renderer. The components are read-only: editing and saving controls are absent, mutation commands are refused, and closing releases resources. It does not change document versions, approvals, attachment records or MinIO objects. Failed previews remain in the viewer with retry where applicable. See [attachment-viewers.md](attachment-viewers.md).

Attachment entry points now share `AttachmentOpener`, including persisted/new form uploads, rich-text file links, supplier certificate evidence, controlled STP versions and approval evidence. Protected versions retain the existing authenticated read and audit headers. Failed reads remain retryable; pending protected reads time out after 90 seconds and abort when the owner unmounts. Form selection and submission state are preserved. Explicit downloads/exports remain separate actions.

### Attachment verification

- 87 tests pass across 19 suites: viewer safety and messaging, filename/keyboard activation, unsupported formats, local file cleanup, form preservation, protected STP reads, approval evidence, supplier certificates and purchase-order regressions.
- The production web build, including strict TypeScript checks and verified local viewer assets, passes. Changed handwritten TypeScript files remain within the 250-line limit, and `git diff --check` passes.
- The source UI detector reports no findings. React Doctor's six route-boundary errors refer only to the extracted purchase-order test router; production routes retain `GlobalRouteError` and the application `GlobalErrorBoundary`. Its three complexity warnings refer to the small attachment opener/viewer and existing image-field selection logic; review found no functional defect requiring a broader refactor. No analyzer suppressions were added.
- Actual GPU rendering, visual checks at scaled laptop sizes, installed-client verification and deployment remain outstanding because browser control is disabled in the current Work settings. Tests use jsdom and stubbed APIs; no live attachment, approval or stock record was changed.

Documentation updated: `attachment-viewers.md`, `workflows.md`, `services.md` and the README viewer overview.

## Shipment attachment follow-up

A source-wide audit covered 867 TSX files and all 227 route pages. Shipment and waybill detail-route tests confirm that a PDF returned with attachment disposition is fetched into the shared isolated renderer, with no status or approval mutation. The exact reported shipment PDF rendered in a local browser. The running testing site still serves the old direct-file iframe and lacks engine assets; deployment is pending. Nginx/static-asset retention and startup checks now protect viewer releases. See [attachment-audit.md](attachment-audit.md).

## Single attachment viewer

The viewer is the place to view the attached file itself. **Open original** was removed from all attachment dialogs, including load/error and unsupported-format flows; there is no separate browser-opening link. The footer keeps Close preview. Source-file preservation and existing save/approval rules are unchanged. The real Word attachment rendered in Electron connected to local port 5173; PDF/Excel desktop verification continues separately.

Read-only implementation: all three pinned engines now set an attachment session policy and expose viewer-only chrome. Word/Grid enforce a command allowlist and bypass editing input paths; PDF drops its editable model, refuses mutations/saves and disables form filling. The host still rejects saving and now fails closed on an unexpected dirty/save report. No document version, approval, attachment record or MinIO object is changed. See `attachment-viewers.md` for reviewed patches, rebuild instructions and verification.

Read-only desktop acceptance (2026-10-20): rebuilt Word/PDF/Excel engines rendered local synthetic files in the packaged Electron shell at local port 5173. Typing/paste/delete/save did not change Word text, Excel cells or the PDF form. Word/Excel search, Excel sheet tabs and PDF fit-to-page remained usable. Temporary test fixtures were removed; no upload, server record change or deployment occurred. See `attachment-viewers.md` for policy and validation details.
