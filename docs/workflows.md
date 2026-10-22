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

## Reports and employee migration (2026-10-21)

Report generation creates a complete filtered snapshot; failed pagination/cancellation cannot produce a partial export. Readiness never treats unavailable definitions as configured. Employee edits preserve existing employment state after fresh evidence checks; assignment is the separate explicit activation workflow. Profile-save and photograph-upload failures have separate retry behavior. Attendance upload requires a valid preview and confirmation, and leaves identity/transaction validation with the server. The overall five-domain migration is still in progress; see [workflow details and remaining work](implementation-2026-10-20/reports-and-hr.md).

## Desktop session persistence — 2026-10-21

Closing or quitting Oryx Live preserves the encrypted desktop sign-in. Reopening restores it and checks the existing server session and permissions. Explicit sign-out removes the saved token; cancellation or temporary connection failures cannot silently sign the user out. See `session-and-access.md` for lifecycle and regression checks.

## HR operational requests — 2026-10-21

Live supports leave creation/detail edits, explicit rejected-request reapplication, future approved cancellation and guarded ongoing recall; overtime and staff requisition authoring/details and pending/new deletion. Each action rechecks current permissions and fresh state. Ambiguous creates cannot be repeated silently; failed leave files retry only attachment upload. Unsafe balance-credit recalls and unsupported overnight overtime are refused. Cancellation identifies the server balance-reconciliation gap. Full rules and remaining server fixes are in `implementation-2026-10-20/hr-requests-and-session.md`.

## Payroll configuration and processing — 2026-10-21

Payroll configuration changes recheck fresh evidence and permissions. Effective-dated compensation preserves current bank/allowance values and requires a later start date. Adjustment lists read every page. Payroll generation, assigned-stage review, processing and cancellation are explicit confirmed actions with audit headers. Approval reconciles every active employee and payslip and all summary totals. Generic payroll decisions route to dedicated HR review; drafts retaining prior payslips cannot regenerate duplicates. Existing server calculation/history/bank-snapshot limits remain explicit. See `implementation-2026-10-20/payroll.md`.

### Performance cycles, goals and review approval

Cycle transitions require separate confirmation and fresh evidence. Goal authoring validates cycle scope/dates, complete per-employee weight totals, active staff and exact edit/delete permissions. Performance reviews are read and decided on their dedicated HR page; generic approval cannot bypass complete goal/assessment reconciliation. Explicit rating/achievement zero is preserved. Self/manager assessment submission and personal goals remain incomplete until a server identity/ownership contract is available; details are in `implementation-2026-10-20/performance.md`. All verification mutations are mocked.

### Shift calendar, assignments, replacements and bulk import

Schedules use their actual five-status enum. All four calendar views filter actual dates because server range/day endpoints are unfiltered. Confirmed assignment/replacement freezes evidence, rereads current state and employee availability, checks active exact-department membership and current permissions, and verifies post-write results. Whole-period assignments and imports check the complete proposed batch against hours/rest limits; the server assigns every calendar day. XLSX imports preview literal staff/category/type values and reconcile every expected employee/date rather than claiming 204 means every row succeeded. Sent commands are not replayed automatically. The corrupting update-schedule endpoint is not used. See `implementation-2026-10-20/shifts.md`.

### Store-vendor maintenance

Vendor forms preserve associations across all four stores while limiting new item search by exact store-read access. Contact-only edits retain existing items. Current evidence, country/currency, new item access and signed-in identity are rechecked before writes; refused or ambiguous writes are not replayed from the same editor. Search covers the entire verified register because the server ignores its search parameter. See `implementation-2026-10-20/store-vendors.md`.

### Service definitions and contractor maintenance

Service save/file stages retain the saved UUID and refuse replay after uncertain writes. Attachments remain original read-only viewer content; removal confirms fresh identity and uses the backend reference field. Contractor edit confirmations freeze complete details and verify persisted contact/country/currency/service associations. The locally tested backend repair preserves association edits and refuses deletion when current or historical job, execution, quotation, invoice or memo references exist. This repair is not deployed; granular backend permission and service deletion-link gaps remain recorded. See `implementation-2026-10-20/services-and-contractors.md`.

### Verification checkpoint — 2026-10-22

The current web suite passes 1,280 tests across 244 files with two workers and no unhandled errors. Existing date/STP validation tests now wait for their lazy controls before asserting behavior; password/signature checks are unchanged. Production build and TypeScript pass. This is source verification, not deployed workflow acceptance; remaining gaps are enumerated in `implementation-2026-10-20/remaining-gaps.md`.

### Inventory definitions, receiving and stock reports

Seven new routes retain store-specific gates and zero enums. Definition writes freeze current evidence, verify references/duplicates, recheck access/account and reconcile persisted fields; staged attachments retain saved identity and never recreate an uncertain item. Receiving decisions require a pending positive receipt, known distinct creator, current stock and explicit confirmation. Damage/missing creation checks a fresh reconciled balance and verifies report/stock/ledger afterward. Commands are never automatically replayed. Matching source repairs preserve receipt quantities, prevent terminal-state replacement, post atomic stock/ledger changes and reject concurrency conflicts. These repairs are not deployed; visual/PostgreSQL/end-to-end acceptance remains. See `implementation-2026-10-20/inventory-and-stock.md`.
