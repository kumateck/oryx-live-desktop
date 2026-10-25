# Desktop workflow corrections

## GRN distribution visibility contract correction (2026-10-24)

The grouped table could show Approved while hiding both header and ellipsis
row actions. The GRN batch material is a `CollectionItemDto`, which lacks the
`kind` property the UI expected. The adapter now resolves material kinds from
matching GRN checklists by material ID. Duplicate consistent evidence is allowed;
missing, unsupported or contradictory evidence cannot grant an action.

Rows continue using the shared **TableMenu** ellipsis dropdown with
**Distribute material** for approved batches. Permission, stock preflight,
approval recheck and audit behavior remain unchanged. Tests now use the actual
backend DTO shape, with kind only on checklist material; coverage includes raw,
packaging, multi-material preselection, conflicting evidence, revoked access
and stale approval. Thirty focused tests pass. The production build, including
strict TypeScript, passes. In the running local Electron app, GRN
`WHD/RM/26/020` shows four ellipsis menus; the Maize Starch row opens its plan
for TABLET Raw Warehouse with 1,000 kg. Only the read/review UI was exercised;
no distribution mutation was submitted.

Documentation updated: this workflow correction and the existing GRN read
contract in `services.md`. No backend endpoint or generated API changed.

## GRN table distribution and grouped columns (2026-10-24)

- Approved batch rows expose **Actions → Distribute material** for the matching
  raw/packaging quarantine-view and distribution permissions. Other statuses
  have no distribution row action. Actions pause while the GRN refreshes.
- The action opens the existing distribution dialog with that row's material
  selected, even when the GRN contains several materials. The plan still covers
  all approved batches of the selected material and displays each warehouse's
  allocations before submission; this is not a single-batch stock transfer.
- **Quantities** stacks Received, Allocated, Distributed in that order. **Dates**
  stacks Manufacturing, Expiry, Retest. Missing evidence remains a dash. Batch,
  material/manufacturer, invoice, status, and the row menu remain visible.
- The existing header action, preflight approval/stock checks, permission
  rechecks, mutation/audit contract, cache refresh and refusal behavior remain
  unchanged. No endpoint or generated contract changed.
- Verification: 24 focused tests passed, including multi-material preselection,
  approved-only visibility, stale approval and access revocation. The production
  web build and strict TypeScript check passed. The UI detector found no issues;
  React Doctor found none in the changed quarantine module (the wider repository
  has existing findings). Local synthetic-fixture browser checks covered the
  grouped table, row menu and dialog; no live inventory mutation or deployment.

Documentation updated: this workflow note. The source change is in
`modules/quarantine-area/components`, including the extracted `grn-batch-table`.

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

## Billing-sheet charge selection (2026-10-23)

Creation and add-charges entry show one currency field above the charge rows.
It defaults to the supplier currency on creation or the sheet's existing currency
when adding a batch, once collections load, without replacing an explicit choice.
The current selection applies to every charge in that submission, including rows
added later. Existing saved charges retain their currencies and payment history.

A selected charge stays available on its own row and disappears from every other
row's picker. Changing or removing it makes it available again. Add charge is
disabled while choices load or all available row slots are occupied. Add-charges
continues to exclude charges already saved on the sheet. Zod still rejects
duplicate charges, missing currency and nonpositive amounts. Save errors retain
the form for correction/retry; approval, access and audit behavior are unchanged.

Focused interaction tests verify filtering, changing/removing rows, delayed
currency defaults, explicit choices, and the shared currency in both API payloads.

## Configured billing-sheet numbers (2026-10-24)

The create form automatically generates its number from the existing BillingSheet
code settings using the desktop's shared generator. The billing-sheet list count
is the sequence source, as in Oryx Next. An explicit number is preserved while
initial generation completes; Generate again intentionally replaces it after a
fresh count read. Configuration/count failures expose Retry and retain entered
values. Missing, negative or noninteger counts do not become a fictitious first
number. Editing an existing sheet does not generate a new number.

The number is submitted through the existing audited billing-sheet create request.
Generation is a read-only suggestion, not a reservation; the backend remains the
uniqueness authority for simultaneous users. Approval and attachment retry behavior
are unchanged. Tests cover configured generation, both retry paths, preserved
manual values, payload numbering, invalid counts and unchanged shared generators.

### GRN numbering on receipt

Creating a goods received note now presents an automatic, read-only number in
the same series as Oryx Next and refreshes it immediately before creation. Count
failures require retry before a note is written. Permission checks run before
preflight and again before creation; batch selection and quarantine behavior
stay with the existing backend workflow. See [GRN numbering](grn-number-generation.md).

### File answers in analytical tests

A successful file draft immediately shows saved status. Reopening the test shows
saved attachment links; newly edited inputs remain unsaved, including edits made
during upload. Submission reuses acknowledged drafts instead of uploading the
same file again. This saved check does not advance checking, approval or release.
Older files with missing field associations need explicit, auditable recovery.
See [test-result file drafts](test-result-file-drafts.md).

### Certificate of analysis approval review

The existing `Response` approval is displayed as **Certificate of analysis** in
the queue and detail page, preserving its key, registry position, routes and
approval rules. The COA is on the page; **Print COA** and **Print Worksheet**
open separate print-preview dialogs. Printing creates no certificate or approval
mutation. See [COA approval review](coa-approval-review-2026-10-24.md).
The decision buttons require `CanApproveResponse` or `CanRejectResponse`,
respectively, as well as a request waiting at the user's assigned stage.
Generic pending-approval permissions do not authorize a Response decision.
Documentation updated: this workflow and `docs/services.md`.

## Supplier purchase-unit synchronization (2026-10-24)

Supplier material selection loads all department linkages, expands mass/volume
families and deduplicates symbols. Saved values remain selected. Supplier edits,
pricing agreements and quotation responses share the purchase/price symbol.
Standing price-unit changes preserve price meaning through agreement proposals,
permissions and the configured approval workflow. Pending/rejected changes retain
the effective unit; future agreements respect their dates. Historical transaction
prices and quantity units remain intact. See [behavior and release order](supplier-purchase-units.md).

## Companion attention workflow

Existing unread notification state drives the desktop companion badge and a new-arrival gesture. Clicking restores Oryx and opens the existing notification sheet; existing record links, read actions, permissions, and approvals handle the work. Quiet mode suppresses motion. Live disconnection changes the pose while existing polling continues. Logout/navigation clear summary state. See [companion uses and boundaries](companion.md).

## System alert visibility and recovery

New arrivals use system notifications even while Oryx is in front. Startup shows one missed-unread summary; native click opens existing notifications without marking read. Backend read events reconcile the same user’s sessions. OS dismissal/DND does not remove backend unread history. Direct ERP-record alerts await backend source metadata. See [notification workflow](notifications.md).

## Targeting an alert from the desktop

An OS-alert click restores Oryx, opens notifications and focuses that notification ID. Previously read alerts are located through existing history; no click implicitly marks read. Available ERP links continue through normal navigation/permission guards. Settings → Appearance manages persistent local companion movement/visibility. See [companion](companion.md).

## Quiet companion indicators

Quiet movement leaves the caption label, priority and unread count visible. Appearance → ORYX Companion → Show alert details controls the caption independently; hiding it does not suppress backend alerts or system notifications. Caption clicks target the represented notification. Selection uses actual supplied priority and backend ordering; missing priority is visibly unspecified. Rules and audiences remain governed by existing Alert Configuration.

## Device notification test

Appearance can submit a labelled native test without creating a business event, unread item or approval. The user-visible result distinguishes OS submission from OS display. The actual frontend/gateway connection was checked separately through realtime health and the signed-in notification sheet.

## Supplier price approval outcome

Quotation price entry keeps the existing backend rule: no SupplierPricingAgreement workflow/stages auto-approves with audit; configured stages route to assigned reviewers. The frontend refreshes approved agreements after successful submissions and reports confirmed approvals separately. Failed agreement writes include their API reason while acknowledging the quotation prices were saved; no validation/permission/conflict is bypassed because a workflow is absent.

## Missing supplier-price approval investigation

The observed empty queue followed an API model-validation failure: AgreedPrice below 0.01 was rejected before a proposal/stage existed. The backend fix accepts strictly positive decimals, retaining assigned approval rules; deploy it and explicitly resubmit the failed agreement. Quotation prices already saved must not be blindly replayed. Frontend pricing mutations invalidate pending-approval caches, and the queue refreshes on entry/focus/reconnect and offers Refresh approvals.

Waybill creation now reports a failed code suggestion instead of leaving the field silently blank. Retry re-requests code configuration/count support without saving a waybill or overwriting a manual number. The frontend now reads the Waybill rule and counts its prefix through the existing ShipmentDocument count route, so the new backend Waybill alias is not a deployment prerequisite.

Reference checked: `oryx-next/src/components/pages/supply-chain/logistics/waybill/create/index.tsx` reads the Waybill naming rule and uses the waybill list totalRecordCount + 1. Live Desktop retains the prefix-count endpoint using the existing ShipmentDocument model, preserving shared logistics prefix counting. The backend hardening additionally includes archived records; deployed older servers retain their existing archive filtering. No Oryx Next files were changed by this comparison.

Waybill verification: nine focused UI/code-generator tests passed, including failed count recovery and manual-number preservation; the backend shared/archived prefix-count test passed. Web typecheck and React Doctor completed without new issues. No live shipment/waybill was created. Documentation updated: services and workflows here and in the backend.

Live desktop compatibility verification: the actual signed-in Waybill create screen generated WB009 with the existing customer server, matching Oryx Next. Nine focused tests passed with an unsupported Waybill count route fixture, retry recovery, configured WB/three-digit formatting and manual-number preservation. No live document was saved. Updated documentation: services.md and workflows.md.

## Collapsible companion alerts (2026-10-25)

The card under the companion avatar starts collapsed. Its header expands or
collapses the unread list without marking an alert read. Clicking a list item
continues through the existing trusted navigation and authorization path.
