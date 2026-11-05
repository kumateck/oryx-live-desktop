# Oryx Live Desktop plan

## Bulk schedule repairs and unissued unstart (2026-11-04)

The user authorizes selecting one product within a schedule and repairing every
eligible running batch's BOM, packaging or procedure. Reuse existing per-kind
permissions, department ownership, pre-issue material repair rules and completed
step protection. Preview every matching batch, explicitly show unstarted/finished
skips, unchanged and blocked batches, and refuse the operation while a running
batch is blocked. Apply the reviewed product/schedule scope atomically, allocate
remaining stock sequentially under the existing production locks, recheck grants,
preserve approval resets and immutable per-batch evidence, and record a replayable
bulk receipt. A later shortage or procedure failure rolls back all batches.

The user also clarifies unstart before issue: release reservations so stock on
the shelves becomes available again. Reservation does not remove physical stock,
so no shelf receipt, quantity increase or stock return is created. Initial adopted
configuration rows are archived by unstart and must not block themselves. Verify
issue/status/bin-card evidence rather than requiring today's shelf balances to
cover the old hold. Downstream work and actual issue still block unstart. No live
customer changes, role grants, deployment or schema application are authorized.

## Stock-count print reports (2026-11-04)

Add Current stock and Expired stock choices to the existing warehouse report
workbench. Current stock means positive physical shelf plus issued, unconsumed reserved stock; unissued holds stay on source shelves and are counted once;
expired is the effective-expiry subset. Reuse report filters, complete snapshots,
export and print preview. Paper headers are Material, Batch, Source, Dates,
Quantity, Physical count and Remarks. Group name/code, batch/AR,
manufacturer/supplier and manufacturing/expiry/retest inside their cells; dates
remain month/year. Count and remarks stay blank with room for handwriting.

Use an additive, current-only stock-report read model so existing historical and
stock-detail contracts remain intact. Scope it to the authenticated account's
fresh department; assigned users cannot select another department. Unassigned
users may choose a department or all. Stock ownership follows the warehouse,
not material-use associations. Combine shelf/reservation positions in one SQL
snapshot, preserve unit distinctions, and never adjust inventory when printing.
Use the existing Warehouse report permission and generate typed hooks from a
built OpenAPI export. Frontend PRs remain development-only. Promotion stays last.

## Manufacturing, expiry and retest month selection (2026-11-04)

The user requests month-and-year selection across batch manufacturing, expiry and
retest validity fields. Reuse the existing shared month picker and batch-date
conversions: manufacturing starts at the first day, expiry/retest ends at the last
day of the chosen month in UTC. Preserve permissions, approvals, audit evidence,
stale-date comparisons and date ordering. Expiry report ranges include the whole
selected months. Actual event dates and document/legal validity dates retain their
day precision. Existing receiving, BMR and migration/top-up month fields stay in
place; close the remaining retest, report and explicit worksheet lot-expiry gaps.

## QA products by department and readiness table (2026-11-03)

Reuse the production product workflow under `/qa/products`. QA selects a production
department in the URL; list, detail, edit tabs and cancel/back links retain that
scope without switching the session department. Use existing planned-product,
edit and verification grants; no role-name bypass or new permission keys. Detail
and edit children mount only after the product matches the selected department.
Material pickers and authoritative units must derive their department from that
product on the backend. Preserve production routes and independent quality-document
grants. Fix the report's responsive column-width specificity so product readiness
status text cannot collapse into single letters. White Placebo stays separate.

## Issued BMR correction and revision (2026-11-03)

The user authorized a dedicated QA list containing already-issued product-batch
BMRs, separate from BMR issue requests. A separately permissioned typo correction
changes only batch-number text, with a required reason and immutable before/after
evidence. Manufacturing and expiry changes are requested as a revision and apply
only after approval by another permitted person. Permissions cover list, typo
correction, revision request and revision review. Use the department ownership
rules on the backend; block unissued/retired records, stale values and duplicates.
Changes propagate atomically to linked live batch data, with affected IDs recorded
in the audit. Issued/superseded certificates remain immutable and use their own
existing revision workflow; draft headers follow current batch data. Keep route
files small, use generated domain endpoints, the shared table/actions/forms and
module manifests, and preserve White Placebo separately.

Status: foundation and first module implementation in progress, 2026-10-01. This document records decisions and execution gates; the scaffold is not a production ERP release.

## Desktop header tabs and explicit new-tab navigation (2026-11-04)

The user authorized moving desktop tabs into the existing header: Oryx,
Back/Forward, panel toggle, tabs, Add tab immediately after the tabs, then app
actions. Keep overflow accessible and preserve the browser header. The user also
revised the original sidebar decision: normal clicks navigate within the current
tab; Ctrl/Cmd-click and the internal-link menu explicitly open another tab.
Right-clicking a tab offers Duplicate tab, creating fresh page state at the same
URL while retaining the original draft. Keep independent routers, permission
guards, pending-write checks and unsaved-work protection. This supersedes the
original sidebar-click behavior and content-area placement described below.

## Deferred artifact promotion and customer automatic downloads

The user places this work last: finish the current publishing, date-selection,
header/navigation tasks and any new tasks first. Start promotion only when no
other task is outstanding, except White Placebo. If new work arrives during
promotion implementation, pause promotion, complete that work, then resume.
Promotion takes priority over White Placebo; preserve its existing drafts.
Reuse exact tested artifacts while retaining server configuration and deployment
differences. Verify build-input equivalence; customer-specific code changes need
their own tested artifact so no branch work is silently omitted.
## Permissioned question and test formula repair proposal (2026-11-04)

The user requests an in-app exceptional repair path for formula questions and
involved tests, replacing manual database maintenance. Propose separate backend
capabilities for repairing the reusable question and explicitly selected open
test placements, with question-only, test-only and combined atomic scopes.
Use authenticated actor attribution, reason, typed validation, reviewed preview,
fresh permissions, state/concurrency checks, idempotency and immutable audit.
Preserve entered readings; invalidate obsolete results and require the normal
execution/submission path. Pin legacy response configurations so master repairs
cannot change unselected or historical tests, including unanswered fields.

Implemented locally on 5 November 2026 (uncommitted; no grants, migration run or
deployment). See the implementation section of the proposal document.
Initial scope excludes direct changes to governed or
submitted/approved/released records; approved rebasing and historical amendment
need separate workflows. Do not bypass formula review/approval or manufacture
approved revisions for legacy repairs. No implementation, grants, migration or
deployment is performed by this planning step. See
`docs/question-formula-repair-proposal.md` for the proposed UX, storage boundary,
permission model, API and verification requirements.

## Outstanding migration reservations repair (2026-11-04)

Prepare a portable preview/apply maintenance script for the client's 5 November
run. A replacement opening migration wrote off lots still reserved by waiting
requisitions. Rebind every affected, approved, wholly unissued requisition in
the chosen replacement's department to a unique eligible replacement lot/shelf.
Preserve reservation IDs, approved quantities, stock balances, status/approval
gates and issued history. Refuse insufficient/ambiguous stock, stale previews,
progressed production, issue evidence, unit/scope mismatches and missing live
issue permissions. Audit the user-specified operator, reason and before/after
rows atomically. Frederick's email is supplied for this repair; resolve his ID
and current department/permissions independently on each server.

Rehearse apply/rollback on disposable local PostgreSQL and preview the demo's
entire outstanding queue. Client writes/deployment are not part of preparation;
client IDs and stock must be inspected afresh tomorrow. See
`docs/migration-reservation-repair.md`.

## Migration AR-only corrections and HTTP repair IDs (2026-11-04)

Show the migrated batch AR reference and provide a separate AR-only correction
action alongside the retest-date editor, which can save either field or both.
Preserve an unchanged retest timestamp exactly, including absent or legacy dates;
validate the extension rule when changing the date. Reuse the existing migration
correction permission, department/QC gates, reason, optimistic concurrency and
transactional audit. No new endpoint or schema change is needed beyond the
already prepared AR-correction contract and audit migration.

Unstart production must also work on installed clients using intranet HTTP.
Use the existing cryptographic UUID helper for all remaining direct renderer
`crypto.randomUUID` callers. Keep retry request IDs stable for the same reviewed
preview and reason, and release pending state if ID generation fails. No stock
correction, migration application, role grant or deployment is authorized here.

## Multiple workspace tabs proposal (2026-11-03)

The customer requests browser-style page tabs inside the desktop application,
using Codex as an interaction reference. The user selected design proposal first
and confirmed that sidebar destinations open a new tab or focus an existing one.
The user approved the generated visual mockup on 2026-11-03; preserve it at
`docs/design/workspace-tabs-concept.png` as the visual reference for the tab strip,
active state, close controls, unsaved indicator, add-tab and overflow controls.
This approves the visual direction, not every illustrative page field or sample
record. The user subsequently authorized implementation and restricted tabs to
the installed desktop application. The local implementation and verification
are described in `docs/workspace-tabs.md`; `docs/workspace-tabs-proposal.md`
preserves the design brief. No customer deployment or installer publication is
part of this work.

Propose a compact tab strip above the central content, with one shared header,
module navigation and footer. Sidebar destinations open a tab or focus an
existing matching destination; ordinary record/detail/edit navigation would stay
within the active tab, with an explicit Open in new tab action for parallel work.
Distinct records may occupy separate tabs. Matching must account for meaningful
query parameters so different department, queue or material-kind views do not
silently collapse into one tab.

Switching tabs should retain filters, pagination, scroll and unsaved form state.
Mark dirty tabs and ask before discarding work on close; window close, sign-out
and web-release refresh must account for every open tab. Use overflow controls
and an open-tabs list without adding page/window horizontal scrolling. Include
keyboard switching, accessible close controls and visible focus.

Implement as a desktop-only hosted renderer feature selected by the existing
isolated preload capability. Browser sessions retain their original router.
Independent memory routers reuse the generated file routes and share the
session/API cache; every tab retains manifest access guards. Keep domain
controllers mounted to preserve drafts outside React Hook Form. Suspend header
and portal effects separately and pause known polling hooks by tab visibility.
One desktop route blocker composes registered form safety; pending writes also
block switching pages, tab closure, sign-out and release refresh. Account or
department changes reset both tab state and the desktop API cache.
Avoid native webviews or a duplicated manual route list. Inactive pages must not
continue unnecessary polling, expose stale permissions, retain active modal/focus
behavior or run route side effects against another tab. Never silently evict a
dirty tab. Clear tab state across site/account changes. Recommend deferring restart
restoration and duplicate copies of the same destination from the first release;
these are proposals, not confirmed exclusions. Do not persist form contents as part
of tab restoration. Verify isolation, permission revocation, close/refresh safety,
back/forward behavior and target-screen overflow before release; measure memory
with realistic simultaneous pages rather than inventing a tab budget.

## Demo database import (2026-11-03)

The user selected the screenshot demo at `164.90.142.68:3011`, selected local
`oryx_client_20261030` as its replacement, and authorized a private local full
demo backup and proceeding with replacement. Imported source data into the
actual deployed schema after local rehearsal and remote staging verification;
the demo has a migration absent from this checkout. No grants, migration
backfills or stock were introduced. All 439 data tables and 15 sequence positions
matched before activation. Preserved all 477 deployed tables, 2,732 indexes,
5,763 constraints and 189 audit triggers. Switched database names at 21:23 UTC,
retaining `entrancedb_before_import_20261103` intact with connections disabled.
Active `entrancedb` has 1,904 materials, 1,614 department links, 48 users and no
stock or opening drafts. Final verification differs only in nine reconnect error
logs from the brief switch; no continuing errors remained. The browser reached
sign-in; authenticated acceptance remains. See `docs/fresh-opening-balances.md`.

## Unstart production before BMR issue (2026-11-03)

Add a permissioned, reasoned preview/apply repair for one accidentally started
run whose BMR and BPR remain unissued and have no downstream work. Archive the
run, steps and draft documents using soft deletion, release only its unissued
reservations, and retain immutable before/after evidence. Preserve material
batch identity, shelf quantities, stock movements and batch number. Permit a
fresh start with a new run ID by making the run-per-batch unique index apply to
active rows. A repeated repair is tied to its original run and cannot undo a
later restart. Reconcile schedule status against its other active runs.

Block issued or progressed documents/steps, stock requisitions, analytical/form
records, returns, transfers and other dependent business evidence. Repeat the
preview and permissions under transactional locks, guard archived run/document
writes, and test issuance/start races, rollback, repeat repair and real restart.
Implementation and isolated local tests are authorized; no customer/main data,
role grants or deployment changes are included.

## Post-issue BOM and packaging repair (2026-11-03)

User authorizes reproducing the kg/mg incident in an isolated local PostgreSQL
fixture and implementing post-issue repairs only. Correct the product master
through its existing editor first. Preview the current master against an approved,
issued requisition and its exact production reservations. Apply only the remaining
delta, with separate backend BOM/packaging repair permissions, production department
scope, fresh preview validation, atomic stock posting, immutable before/after and
lot/movement/bin-card evidence, and request replay protection. No role grants,
client stock changes or deployment are authorized. Preserve pre-issue behavior.

Automatic quantity repair requires unchanged material membership, matching units
and traceable unconsumed reservations. Refuse consumed/deleted or ambiguous stock,
returns, extra-material requests, finished/cancelled runs and finalized packing;
those require a reviewed workflow-specific correction rather than invented stock.
Keep original approved requisition quantities intact; show effective issued
quantities from the immutable repair ledger on requisition reads. Increased stock
requirements use available, date-eligible approved source lots after subtracting
other unissued reservations; decreases return only this batch's unconsumed stock
to a verified source shelf. Serializable transactions and write-conflicting locks
cover source configuration, issue, reservation, consumption and stock evidence.
The existing activity update timestamp is a concurrency token shared with the
first production-consumption save, so a step loaded before a repair must reload
instead of consuming a stale reservation snapshot.
## Active packaging and packing-style selection (2026-11-03)

The user reports extra historical rows in product details, print and schedule
packaging. The rehearsal copy confirms eight active and six deleted definitions.
Filter deleted definitions on backend reads while retaining audit history. The
user permits the same material under different styles, including All styles plus
specific styles; reject duplicate material/style pairs in editor and backend
replacement/update validation before writes. Use the schedule product's saved
packing-style ID, prefer its specific definition for each material and fall back
to All styles for other materials. Reuse that selection for forecasts and newly
adopted requirements; do not rewrite applied batch snapshots or stock. Preserve
batch scaling, allowances and failure/permission behavior. Read the rehearsal
database only; use a separate disposable PostgreSQL fixture for write tests.

## Combined release-contract review (2026-11-03)

Fix the testing release failure in the legacy customer installation fixture by
recording the reviewed, exact combined issued-BMR/material-repair contract digest.
Preserve prior approvals, strict rejection of unreviewed fingerprints, deployment
protocol and shell requirements. Retain the additive contract comparison and test
the actual release-check command against the current import, including rejection
of changed authentication, permissions and responses. Run the isolated Docker
release validator; do not alter the uncommitted White Placebo implementation or
customer databases. See `docs/api-codegen.md` for review scope and backend rollout
prerequisites.

## Migration stock top-ups (2026-11-03)

Add an additive migration top-up alongside opening balances for individual
post-migration cases. A required reason and one department cover a list entered
manually or uploaded with the existing material-stock workbook format. Saving
creates a draft only; reuse the existing view/upload/correct/approve opening-
balance permissions and department guards. Approval posts atomically once, adds
new stock lots without writing off or merging existing stock, and retains source
rows, batch/date/UOM/shelf/GRN/AR evidence, creator, approver and immutable
before/added/after totals. Distinct receipt references must not be pooled. Keep
the existing opening-balance replacement workflow explicit and unchanged. Match
the existing migration month-based date contract. No live stock posting, role
grants, database migration execution or deployment is authorized by this work.

Implemented locally in the Upload Center top-up tab with manual/Excel draft
entry, additive approval, posted-batch links and cumulative bin-card receipts.
The prepared migration remains unapplied. Verification and activation requirements
are recorded in `docs/migration-stock-top-ups.md`.

## Raw-material migration retest extensions (2026-11-03)

Use active expiry first. After expiry elapses, a future raw-material retest date
extends usability; absent or elapsed extensions leave the batch expired. Apply
one date rule to usable stock, reservation/supply selection and write guards,
expiry lists and alerts. Preserve quality/status/approval gates. A separate
backend permission allows individual retest-date corrections only for approved
opening-migration batches in the actor's department, with reason, optimistic
concurrency and transactional before/after audit. It does not create or complete
a QC retest. No role grants, live data changes or deployment are authorized.
Expiry lists combine optional month ranges with server-side code/name search;
clearing months retains search and the list's expired/soon classification.

## Permission search and navigation consistency (2026-11-03)

Fix the reported mismatch between the visible search field, selected submodule
and permission rows. Derive search mode/results from the current query in the
same render; show global results separately from module browsing. Match every
search word within one permission's module, group, name, key or description.
Selecting even the active module tab exits search; clearing returns to the prior
group. Reset result scrolling when the query or group changes. Preserve drafts,
permission keys, mutation checks and backend authorization. Hide the module-wide
grant switch while global search is displayed so it cannot act on unrelated,
hidden permissions. See `docs/roles-migration.md`.

## Procurement and store FormWizard migration (2026-11-03)

The user authorized migrating the nine identified form files: service quotations,
service memos and proformas, open-market quotations, vendor prices, store purchase
and stock requisitions, returns, and damage/missing corrections. Use the existing
FormWizard with module-owned React Hook Form state and Zod schemas. Repeatable
charges, materials and vendor quotes use typed field paths; requisition item
tables remain lazy custom renderers with their existing stock/unit rules.
Preserve backend requests, audit metadata, permissions, record-state preflights
and failure/retry behavior. Recheck permissions after asynchronous preflight work.
Keep entered decimal text intact until the API adapter and serialize calendar
dates at the existing UTC boundary. No API, inventory-posting or approval changes
are part of this migration. See `docs/forms.md` for the resulting form contract.

## Password-reset email desktop handoff (2026-11-04)

The user requests emailed password-reset links to open the installed app. Keep
the existing HTTP(S) link as the browser fallback and add an `oryx-live` protocol
handoff from the reset page, with a visible retry link where browser approval is
required. Register the installed Windows/macOS app and handle cold/warm launches.
Accept only reset keys and the configured server origin; never auto-switch sites.
Use a separate sandboxed, ephemeral reset window with no preload/session bridge
so ERP tabs and unsaved work remain mounted. No password change occurs without
the existing validated form and server reset-key checks. This work precedes the
deferred artifact promotion task. Native release version is 0.2.3; preserve 0.2.2.

## Desktop web release freshness (2026-11-02)

The user requests the web release prompt in installed desktops that keep an older
web build. Reuse the shared update provider for browser and Electron sessions;
announce every changed compatible release rather than automatically refreshing
read-only screens. Keep minute/focus/reconnection checks, per-release deferral,
minimum-shell compatibility and unsaved-work guards. Older builds without an
embedded commit compare loaded entry assets with fresh HTML before adopting a
server release ID. Refresh checks uncached metadata and valid Oryx HTML first,
rechecks unsaved work, and replaces the current route with a unique release query
key so cached HTML cannot satisfy the old URL. Preserve filters, fragments,
encrypted sessions and stored drafts. HTML and deployment metadata are no-store;
hashed assets remain immutable and retained. This is a web change with no native
bridge or installer change. Existing stale sessions need one manual refresh or
reconnect after deployment to receive this detector; no deployment is performed
as part of this implementation. See `docs/desktop-updates.md` for rollout.

## Application reporting and KPI study (2026-11-02)

The user requests application understanding and report/KPI planning module by
module before further report implementation. Record the business question, row
grain, available/proposed columns, event date or snapshot basis, filters,
numerator/denominator, unit/currency rules, permissions, sources, legacy gaps and
acceptance examples. This study does not authorize implementing every candidate.

The first source-based inventory covers 16 navigation groups, 151 feature
manifests, 362 workspace pages and 34 current desktop report choices. The study
groups workflows into 16 business review areas with 61 report and 52 KPI
candidates, distinguishing existing workbench choices, supporting source, local
work and proposals/gaps. Start detailed review with QA, then QC, production and
warehouse; later waves cover purchasing/logistics, FG/finance, stores/services,
HR/payroll, R&D, audits, IT/access and master data.

The deeper QA trace found definition gaps to resolve before KPI acceptance:
document issuance differs from quality release; product-stock imports also stamp
BMR issue dates without an issuer; and current QA dashboard total/pending/rejected
approval expressions repeat purchase-order approvals. Record these without
changing behavior during this planning phase. No customer data was queried or
changed. Preserve the separately implemented, uncommitted BMR report and other
ongoing workspace work. The study entry is `docs/reporting/README.md`.

## Optional automated-step responsibility (2026-11-02)

Automated procedure steps (`isCritical=false`) may have no responsible users or
roles and no assigned instructions. Critical steps still require a responsible
user or role, and every added assignment must be complete. Keep the existing
automatic start and manual completion rules, including completion for critical
steps when allowed. Do not introduce a Complete step instruction or change
permissions, record-driven completion, material gates, or backend contracts.

## Packaging quantity units (2026-11-02)

Show units beside prescribed, allowance, and total packaging quantities. Material
department linkage remains authoritative and read-only. For linked mg, offer
mg/g/kg entry; for ml, offer ml/L; other symbols remain fixed. Unit changes
preserve amounts, with form values and saved quantities in the linked unit.
Use the existing material UOM read endpoint for saved lines and picker facts for
new selections; never change material links or infer UOM from purchase units.
Block edits when the unit cannot be verified, preserve unsaved work on save
failure, and retain whole-list save permissions and carried fields.

## QA BMR issued report (2026-11-02)

Add a read-only QC/QA report using recorded BMR issue dates, with required inclusive
UTC start/end dates and optional production department filtering. Include completed,
archived and later-cancelled issued history; do not use the active issue queue or
QC approval status as issuance evidence. Existing `CanViewQcAndQaReport` applies;
production actors remain scoped to their assigned department. No issuance changes,
role grants, migration or deployment are part of the report.

The user chose five print headings: Product (name/code), Batch (number/size),
Validity (manufacture/expiry), Issued (date/person), and Department. Related values
stack on two lines; long text wraps. CSV/Excel retain nine independent fields.
Use the shared report viewer and a typed generated report endpoint. The result is
one complete snapshot for screen/print/export, with validation before disclosure.
Missing legacy issuer data remains “Not recorded”; never infer who issued it.
Names, department assignments and units come from current linked records because
the source does not store an immutable issue-time master-data snapshot.

## Running-batch configuration repairs (2026-11-02)

Implementation authorized on 2026-11-02. The operator first corrects and saves
the product, then previews and applies one batch repair. The user explicitly
confirms that issued or consumed material cannot be repaired. Implemented an
applied requirement snapshot per batch/material kind, explicit reservation
release evidence, requisition content revisions with retained previous approval
rows, and preview hashes covering saved source plus operational evidence.
Refuse partial allocation on shortage and ambiguous legacy/substitute evidence.
Legacy unissued baselines come from requisition/reservation evidence, never a
fabricated original master. All cooperating production stock writers serialize
before reading; backend grants and production-department checks remain required.
Existing Procedure behaviour stays available in the shared descriptive dropdown.
Database migrations are source changes only; no customer database/deployment is
authorized by this implementation task.

The user requests a Repair dropdown in the batch board header where Repair
procedure currently appears, following Copy procedure's descriptive menu pattern.
Its choices are Procedure, BOM and Packaging, each with an independent backend
permission. Keep the existing CanRepairProcedure grant; register separate backend
grants before using the new actions in the frontend, without granting roles
automatically. The selected repair targets one running batch and must reconcile
requirements, reservations and stock still awaiting issue together.

Source study found that procedure steps are copied at start, but material
requirements read current product masters while reservations and requisitions
persist separately. A master correction can therefore already change displayed
requirements without fixing operational records. Re-running the start reservation
helper is unsafe: it appends allocations, can include main and substitute
candidates, and does not account for other reservations in its supply selection.
Deleted reservations also serve as consumed history, and changed unissued
requisitions cannot retain approval of their earlier quantities.

The read-only preview and atomic apply are implemented locally. Changed saved
source, allocation, stock, approval or production evidence invalidates the preview.
New runs pin both material kinds at start; legacy runs adopt reviewed unissued
requirements explicitly. Stock issue uses the allocated shelf and current approval
revision. Open purchase work and ambiguous physical history block repair; later
procurement and full-allocation swaps validate against adopted requirements.
Released holds remain auditable and are excluded from current reservations and
consumption. No repair posts a stock issue or a consumption event.

Local verification: 70 backend tests passed (including 16 disposable PostgreSQL
repair tests), with four unrelated opt-in reporting database tests skipped; 37
desktop feature tests and 23 contract/cache compatibility tests passed. Typechecks,
API/web builds, API reproducibility, route generation and model drift checks
passed. The new migration's down/up SQL was rehearsed in the disposable schema.
React Doctor reported no issues (91/100); the targeted UI detector returned no
findings. Synthetic visual checks passed at laptop sizes and scaling equivalents.
No customer database was connected or migrated. Customer-schema forward migration,
authenticated end-to-end stock/production acceptance, realistic contention and
native Windows installed-client checks remain release requirements. Broad table
locks use a 3-second timeout; this is a safeguard, not a measured performance
budget. See `docs/production-configuration-repair-study.md` and the companion
backend's `docs/production-material-repairs.md` for current rules and limitations.

## Shared team testing database (2026-11-01)

The user requested a remote copy for the demo backend and then clarified that
they will import it manually through Adminer. Source is the cleaned
`localhost:5432/oryx_client_20261030`; target is `oryx_team_test_20261101` on the
server configured by DATABASE_URL. A new empty remote database was created before
that clarification. The in-progress single-transaction restore was cancelled so
the user can import the file. No demo connection change was made; SSH root access
was refused. Existing databases, services, account grants and the local source
are preserved. Provide INSERT-based plain SQL without psql-only commands, guarded
against the wrong database or a nonempty public schema, with atomic import and
local restore verification. No credentials belong in output or committed code.
After manual import, the demo's runtime and future CI migration/startup target
must both be changed to the new database by its server operator. Current demo CI
still targets entrancedb; this task does not deploy or change that workflow.
The cancelled remote restore rolled back: the new target has zero public tables
and no active sessions. The delivered SQL and gzip were verified by restoring the
exact SQL into a disposable local database: all 440 public tables and 82,556 rows
match source counts/content hashes, and decompressing gzip reproduces the SQL
exactly. The import guard requires the named empty target; core master counts and
empty stock/drafts are asserted before commit. Files and the operator guide are
under the conversation outputs directory `team-test-20261101`.

## Fresh operational data migration (2026-11-01)

The user authorized backup, deletion of dummy transactions with master data
preserved, master corrections, and an opening-balance draft/correction/approval
workflow for local database `oryx_client_20261030`. Backup and full restore into
an isolated rehearsal database succeeded before the main database cleanup.

Confirmed preservation scope: materials and department links; products; users,
employees, roles and permissions; questions and templates; material and product
STP/specification/ARD setup; alert and approval configuration; code-generation
settings; and all configuration collections. Preserve dependent BOMs, product
packaging, routes, procedures, forms, formulas, document/template revisions,
master-data verification evidence, and attachments/files needed by retained data.
Distinguish approval definitions and master-document approvals from dummy
transaction approval history. Shared/polymorphic tables require row-level rules.

Excel is authoritative for each material-department UOM. Convert source kg to mg
and L to ml for Upload Center Material stock; piece counts remain unchanged.
Missing materials must be created and linked to their departments. Preserve all
distinct Folidyn batches and expired opening-stock rows. Expiry corrections must
not extend a batch using dates from a different material or batch.

The user assigns `RMG001` to Griseofulvin and, in their latest clarification,
`RMG039` to Green Tea Extract 50%, superseding the earlier Glucose decision. Existing
Griseofulvin is `RMG002`, while Glibenclamide currently uses `RMG001`; preserve
material IDs and their BOM/quality links when resolving the code reassignment.
Green Tea Extract and Glucose currently share `RMG039`; retain the Green Tea
opening-stock identity and resolve Glucose to a separate unique code while
preserving its material ID and master-data relationships.

The user confirms earliest manufacturing and latest expiry for conflicting
records of the same material and batch. Never pool dates across distinct batches;
quantities stay separated by department and shelf. Supplier, manufacturer, vendor
and customer masters, plus HR/payroll master settings including employee
compensation, pay grades and tax bands, are confirmed for preservation.

All 440 public tables have explicit policies: 215 retained, 12 retaining selected
master support, and 213 cleared. The transactional reset removed 28,649 dummy
rows, asserted retained row counts/hashes, retained foreign-key enforcement, and
restored application trigger states. Master setup created eight materials and
19 department links, corrected 95 existing department UOM links, and resolved
three code collisions while preserving material IDs. Main stock remains empty.

Upload Center Material stock now saves drafts for review. Separate backend
permissions control viewing, upload, corrections and approval. The user will
assign grants manually; no roles were granted access automatically. Draft writes
and approval serialize on the draft ID, with atomic posting and repeat-approval
protection. The direct stock upload endpoint refuses writes, and the new-batch
first-row double count is fixed. No database schema change is required.

Four prepared files contain 819 rows. Tablet row 292 is omitted as instructed.
All three Secnidazole and all three Sildenafil Citrate batches use kg converted
to mg, including the two source ml typos. Four tablet date errors remain visible
and block approval until corrected. Rehearsal saved all rows with zero stock,
then approved 815 rows after excluding those four only on the rehearsal copy.
All 13 Folidyn batches and expired stock were retained. Main has no uploaded
drafts or approved balances. Code changes remain local and require the backend
and web application to be rebuilt/restarted before the user uploads. See
`docs/fresh-opening-balances.md` for evidence and the operator workflow.

## Step detail action evidence (2026-10-28)

The user requested the detailed records of every performed step action on its own
page, explicitly including analytical tests, finished-goods transfers and final
packing. Add a separate read-only selected-step evidence section, including completed
and cancelled production; preserve the existing current-step mutation guards.
A typed backend endpoint joins exact step evidence and conditionally adds legacy
batch-only records with explicit batch scope. It checks the existing production-board
permission and the authenticated actor's production department before reading and
rechecks grants before returning. Show the request's recorded stage, audit people,
events, quantities, packing samples/reconciliation, transfers and returns; never
infer a historical record's stage from the current procedure. No schema migration,
workflow writes, live data repair or deployment is part of this feature.

## Production ATR data repair tooling (2026-10-28)

The user requested scripts to repair existing production activity flow data, starting
with the missing test stage on Coldrilif Syrup batch 4862. The user initially
selected Intermediate, requested stage review after live inspection showed
conflicting released history, then confirmed Finished for step 12. Altering the
existing released ATR is outside that configuration decision. The first maintenance
command inspects one activity and previews filling null ARD links on its existing
ATR assignments. Stage, worksheet, step, product, batch, assignment count, operator
and reason are explicit inputs; no stage is inferred from step order. Applying is
an explicit flag, with existing planning permission and product department checks,
QC snapshot validation, contention timeouts, atomic before/after audit and activity
log. Repairing the corresponding procedure instructions is a separate explicit
flag. Production statuses, approvals, test requests, assignments, stock and financial
records are outside this repair. See `docs/production-activity-repairs.md`.
Read-only inspection found step 6 mixes stages and already has a released Finished
ATR, while step 12 has 11 missing activity links and three missing procedure links.
The user supplied Eunice Lariba Adams as audit operator; live preview verified her
planning grant and department. An explicit configuration-only mode may restore
missing links while preserving an exactly named Released ATR on another step. It
records the unresolved request-creation blocker in its preview/audit and retains
the backend duplicate-stage guard. Live preflight found the master procedure was
already corrected separately; the applied repair changed only 11 activity links,
audited to Eunice with repair ID `fb00a099-3529-421f-92f0-8335e7a4320d`. The existing
released ATR and workflow states were preserved. See
`docs/coldrilif-4862-stage-review.md`; QA must reconcile the released ATR before
another Finished test can be requested.

The user clarified that execution belongs on the production server, using Docker
(API container `oryx-erp-api-demo`, database `entrancedb`, database user `root`).
The SQL exporter packages standalone read-only inspection/preview and separate
apply files without connecting or copying credentials. Run through psql in the
existing PostgreSQL container; no Bun installation or application deployment is
needed on that host. Confirm its database container and identities before applying;
the earlier configured endpoint is not assumed to identify another deployment.

## Combined production readiness endpoint (2026-10-28)

The user requested one parameterized backend endpoint returning all information
needed for the production schedule/readiness report. The local implementation uses
`GET /api/v1/report/production-readiness` with required production department and
inclusive UTC start/end dates. Return market/product/packing identities, batches,
price/unit, expected yield, shippers/loose packs, all seven configuration checks,
overall readiness, unique-product summaries, market/grand totals and warnings.
Use one projected read for the plan and checks, live existing report permissions,
and null affected calculations/totals when definitions are missing. Daily and
monthly reports use the same endpoint. Configuration readiness is not stock or
release approval. No schema migration or deployment is part of this work.
The user authorized the frontend improvement after reviewing Oryx Next. Daily and
monthly schedules now use a market-grouped matrix with production quantities,
all checks, readiness, subtotals and grand totals. Product readiness uses one row
per product across its markets. At narrower container widths or larger text sizes,
checks move into a labelled band beneath that product instead of a details dialog.
Print pairs quantities with all checks and repeats table headers; Excel/CSV retain
the complete snapshot, including IDs. Shared filters, guards, applied snapshots,
cancellation and permission-revocation behavior remain in place. There is no
fallback to per-product requests on older backends. Generate the typed client from
the companion export and retain the endpoint's server timestamp. See
`docs/reports.md` and the companion backend's `docs/production-readiness-report.md`.

## Product direction

Oryx Live Desktop is a small Electron Forge shell that opens a React single-page application served from each customer's own server. Staff connect to that server by its configured address. The customer-server deployment package pulls the selected release branch (`entrance-server` for the Entrance installation) and builds the application; customer installation and acceptance remain pending. A new web build reaches installed clients without a manual reinstall; Electron and native-bridge changes use a separate signed shell update served by that same site.

The desktop UI should feel like a focused workspace: compact top bar, collapsible left navigation, a wide central work area, an optional context panel, and a slim bottom bar. The shell header and footer remain visible. Only the central content scrolls vertically. No page or window should require horizontal scrolling at supported laptop sizes.

List pages retain the existing datatable and workflow behavior. Detail pages are redesigned for desktop rather than copied visually from `oryx-next`. Business rules, permissions, approvals, audit records, and status transitions must remain intact.

## Visual and component standard

Use the Codex desktop screenshot as a reference for compact proportions, clear hierarchy, and quiet surfaces. Codex lets users change its UI font, so the screenshot does not identify one exact font to copy. On customer Windows laptops, use the native system UI font (Segoe UI/Segoe UI Variable through `system-ui`); use the native system font on macOS, with a sans-serif fallback. Keep code, IDs, and tabular numbers in appropriate monospace or tabular styles only where they improve scanning.

The workspace design system defaults to a 12px/18px body and 14px/20px headings; compact cards use 12px padding and controls start at 30px. Settings → Appearance exposes independent body/header sizes and compact/comfortable density, persisted on this device. See `docs/design-system.md`. These are starting values, not a claim about Codex's exact pixels. Validate them at 1366×768 and 1280×720 with Windows 125% and 150% scaling. Increase density by removing redundant containers and whitespace, never by making essential content or actions unreadable.

Shell refinement (2026-10-04): align Live with the V2 visual foundation using a 56px rail with padded 36px items, a 296px secondary sidebar with responsive widths, separated sidebar headings, 8px cards, 10px panels, and quieter theme-derived borders. Existing authentication, permissions, routes, search, notifications, and business workflows retain their behavior.

Use current shadcn components selectively when a component improves accessibility, interaction, or consistency. Add only required components through the official CLI at implementation time, review their source and dependencies, and pin the resulting code. The latest shadcn release is not itself a performance optimization. Keep the current datatable and avoid replacing working list interfaces merely to standardize components. Load expensive components only on routes or panels that need them.

The current scaffold uses Tailwind CSS 4 and current shadcn source components. Its appearance settings mirror the Codex reference proportions and base light/dark colors while preserving Oryx's 17 named accent choices. See `docs/appearance.md`. Header search is local-route search until generated API integration; notifications and account identity are awaiting the authenticated backend contract.

Route pages must remain at or below 200 physical lines. They compose reusable domain sections, hooks, and functions rather than embedding full workflows in one file. Extract at roughly 160 lines, and add a route-page line check to CI when scaffolding begins. Reuse should reflect actual shared behavior; avoid generic abstractions that make simple pages harder to understand. `AGENTS.md` records the implementation rules for this repository.

Each migrated detail workflow should have a thin route page and domain-owned pieces: components for sections and interactions, hooks for query/mutation and local interaction behavior, pure functions for mapping and formatting, schemas for validation, and handwritten types where the generated contract is insufficient. Shared UI primitives and cross-domain functions belong in common modules. Keep module boundaries explicit so no single extracted hook or component becomes the new oversized page.

Oryx has roughly 27 ERP modules. The desktop structure must scale by module ownership: small typed manifests for module identity, navigation and permission requirements; lazy route modules; domain-local sections/hooks/schemas/API adapters; and explicit shared contracts for cross-module behavior. The existing `oryx-next` permission navigation has 16 top-level groups, which are not a one-to-one module inventory. Reconcile the actual 27 module boundaries before broad migration. See `docs/module-architecture.md` for the proposed layout and rules.

## Attachment viewer integration (2026-10-20)

Reuse Dodo Workspace's pinned WordCraft, PDFCraft and GridCraft WASM engines for DOCX, PDF and XLSX attachments. This is a preview of an existing file, not a document library or editing/synchronization workflow: MinIO remains authoritative and the viewer has no upload/save capability. Engine controls may change the temporary in-memory view; those changes are explicitly discarded when closed. Do not acknowledge an engine save as successful.

Keep the integration in the hosted web application. Load one engine only on demand, after a bounded file read/validation. Each engine runs in an opaque-origin iframe (`sandbox=allow-scripts`, without same-origin, navigation, forms, downloads or popup privileges), with a restrictive CSP and an assigned-file message bridge. Only the current attachment bytes and pinned engine bytes enter the frame; no bearer token, MinIO credentials, source URL or native bridge is exposed. Attachment access continues through the existing file links/API. Ordinary builds verify and extract checked-in bundles with all notices; they do not need Rust or a runtime CDN.

## Decisions already made

Quality workflow completion (2026-10-27): the user authorized the reviewed QA rejection, material retest, QC rework, stock/shipment discrepancy, OOS authorization/state, generic approval verification, and unavailable-navigation fixes, including companion backend changes. Implement the governed test-request/worksheet/certificate journey needed by material retests without reopening unrelated worksheet template authoring or full-procedure holds. Retain backend signing, pinned evidence, separate permissions, audit history and stock reconciliation; unavailable destinations must not be advertised as working screens. Local verification and release acceptance are recorded separately.

Customer pull deployment (2026-10-26): the Entrance frontend release agent is implemented under `deploy/customer-server`, tracking `entrance-server`. A customer-owned `/etc/oryx-deploy/customer.env` stores the existing backend origin and gateway connection once; it is outside Git and immutable releases. The agent runs as an unprivileged service, validates exact commit builds and approved API/shell compatibility, publishes by atomic symlink, retains old assets, and restores the previous release after failed activation. Backend/database deployment and native shell updates are separate operations. Local automated checks cover release/recovery behavior; Linux systemd/Nginx and real customer installation require environment acceptance. No live server installation is authorized by development of this package.

| Area | Direction |
| --- | --- |
| Desktop runtime | Electron Forge, with a small main process and a sandboxed, context-isolated renderer. |
| UI delivery | Hosted React SPA loaded from the customer's HTTP or HTTPS origin; intranet HTTP is supported in installed clients; no Next.js runtime. |
| Routing | React Router 8.4.0, pinned initially, with an Oryx file-route generator in this repository. Upgrade React, React DOM, Node, and build tools to compatible versions. |
| Data access | Retain RTK Query and the OpenAPI-generated DTOs and hooks. Improve generation, cache rules, and code splitting before considering a query-library change. |
| Deployment | Build on the customer server from an exact commit on its configured release branch; use `entrance-server` for the Entrance installation. Publish a versioned SPA build and switch the active version only after validation. |
| Shell updates | Store platform-specific installers and update feeds in the site's MinIO; expose a stable HTTPS update URL through the customer server. Clients download shell updates and apply them on restart. |
| Notifications | Keep RabbitMQ consumption in a central server service; desktop clients subscribe to its authenticated real-time endpoint. |

## Evidence from the current applications

- `oryx-next` has 403 `page.tsx` files and six `layout.tsx` files. Its 153 routes with dynamic path segments include read-only details, edit, review, and workflow pages; they are not all detail-page redesigns.
- The current OpenAPI-generated RTK Query file is about 42,865 lines. Around 1,215 source files import it, so replacing the query library during the desktop migration would be a large separate change.
- Current Next.js dependencies include navigation, links, images, fonts, dynamic imports, login/logout routes, a proxy, and a custom Socket.IO/RabbitMQ server. Each needs an explicit replacement or removal.
- `oryx-next` persists authentication state into browser local storage and also uses cookies. The desktop plan needs one session design before migrating protected workflows.
- ViPEX has a useful file-route generator and live desktop shell. Its generator does not nest layouts correctly for Oryx, discovers loading/error files without using them, uses Bun-only tooling, and rewrites output on every run. Its shell update pipeline is a reference, not a direct copy.
- The current Oryx private shell has a header outside the scrolling content, but the content uses unrestricted `overflow-auto`, top navigation can overflow sideways, and there is no global fixed footer.

## Target architecture

```text
Customer server
  ├─ HTTP/HTTPS entry point: versioned React SPA, API, notifications
  ├─ HTTPS update feed: signed shell releases
  ├─ .NET backend: authentication, authorization, audit, business workflows
  ├─ notification gateway: broker consumer → authenticated client events
  └─ private MinIO: signed shell artifacts and immutable release files

Client computer
  └─ Electron Forge shell: site address, native capabilities, updater
       └─ sandboxed React SPA: routes, detail views, existing lists, RTK Query
```

The server address is site configuration, not a vendor-cloud constant. Per the user's 2026-10-02 deployment clarification, installed clients accept HTTP and HTTPS frontend origins for customer intranets. HTTPS remains preferred; its certificate must be trusted by client computers and cover the hostname or IP clients use. The app must not disable web security or certificate validation. If the server is unreachable, the shell shows a clear connection/retry screen without implying that work was saved.

The remote renderer receives only narrowly scoped native capabilities through preload. Main-process IPC validates the sender origin and arguments; navigation and new windows are restricted to approved destinations. Shell releases are signed. The backend remains the authority for permissions and regulated actions.

## Workstreams and exit gates

### 0. Baseline and route inventory

1. Record the customer laptop operating systems, display resolutions, scaling, server address/TLS setup, and current site deploy sequence.
2. Classify routes as list, read-only detail, edit/create, review/approval, print/export, dashboard, or utility. Mark the exact detail redesign inventory.
3. Capture representative screenshots and timings from `oryx-next` at 1366×768, 1280×720, and Windows 125%/150% scaling equivalents.
4. Record API dependencies and action permissions for the first migrated workflow.

Exit: a route inventory and measured baseline exist; the first pilot workflow is selected.

### 1. Shell and live-UI proof

1. Create the Electron Forge shell, preload contract, and site-address configuration.
2. Build a minimal React SPA and serve it from a test customer server over HTTP or trusted HTTPS.
3. Verify packaged startup, connection failure/retry, direct navigation, login, one generated query and mutation, one notification, and one native action.
4. Measure cold start, UI load, memory, route transition, and error recovery on target-class laptops.

Exit: an installed shell loads the centrally deployed UI and handles all proof paths without reinstalling.

### 2. File routing and shared workspace

1. Keep the existing `page.tsx` and `layout.tsx` style of route folders. Generate React Router route objects at build time, with lazy page loading.
2. Support pathless route groups, `[id]` parameters, catch-alls where needed, nested layouts, index pages, loading/error boundaries, and a controlled not-found route.
3. Fail generation on duplicate URLs, invalid segments, missing default exports, or ambiguous layouts. Generate deterministic output and update during development without polling/rebuilding unchanged files.
4. Build the persistent header, collapsible navigation, central vertical scroller, optional right panel, and compact footer.
5. Keep list pages and the current datatable; adapt only their containing shell where needed.

Exit: all route shapes in the inventory resolve correctly, and the shell has no horizontal overflow at supported sizes.

### 3. API generation and session

Scope decision (2026-10-01): this project rewrites the frontend only. The desktop and Oryx Next share one backend, and the desktop must work with it unchanged: existing bearer login and refresh endpoints, existing permission data, and the OpenAPI document the backend already publishes.


1. Make OpenAPI generation reproducible from a versioned backend contract or build artifact. Generation must fail the build on error and must not edit formatter configuration.
2. Retain generated RTK Query hooks/types while splitting endpoints by domain so the first screen does not load the entire generated API module.
3. Implement one desktop session path. Remove the current token/local-storage and cookie duplication; design refresh, logout, expiry, permission reload, and multi-window behavior against the backend's current JWT contract.
4. Preserve audit headers, backend permission checks, and controlled mutation behavior. Review cache invalidation by workflow rather than relying only on broad generated tags.

Exit: protected data and mutations work after login, refresh, logout, and reconnect; secrets are not persisted in renderer local storage.

### 4. Detail-page redesign system

1. Establish a compact shared record pattern: identity/reference, status, primary action, metadata, section navigation, activity/audit context, and consistent empty/loading/error states.
2. Design the page around one central vertical scroll. The right context pane collapses or overlays when it would narrow content on a 14-inch laptop.
3. Use restrained surfaces, typography, spacing, and visual hierarchy. Avoid oversized cards, repeated headers, dense nested borders, and loading every section before the user needs it.
   Apply the visual tokens above to the first pilot, then adjust from screenshots and usability checks on target laptops before using them across all detail pages.
4. Rebuild details by workflow family. Reuse API contracts, domain validation, and existing form-input behavior where appropriate; review each page's information order and actions.
5. Verify the first simple and first complex detail flow before scaling the pattern across domains.

Exit for each detail page: functional parity, correct authorization/audit behavior, no lost fields or actions, readable at target sizes, no horizontal scrollbar, and only content scrolling vertically.

### 5. Site deployment and shell updates

1. Extend the site's pull/build script to record the deployed commit, build the SPA into an immutable version directory, validate assets and backend compatibility, then atomically switch the active version.
2. Keep previous hashed assets so open sessions do not break. Publish a new UI version signal; prompt for refresh only when unsaved work is safe, and recover gracefully if a refresh is deferred.
3. Produce signed Windows and macOS shell artifacts for the selected platforms. Publish immutable files to site MinIO first and update the platform/channel feed last.
4. Make the shell updater check the customer server, download in the background, and install on restart. Test from an installed prior version, including interrupted download and server outage.
5. Define backend/API compatibility and minimum supported shell version so site deployments do not strand old clients.

Exit: a UI release reaches installed clients without reinstalling; a native release updates an installed shell without manual reinstall; a failed release leaves the prior site version usable.

## Lightweight UI and performance rules

- Keep the initial shell and first route small. Lazy-load route modules, charts, editors, print views, and complex detail sections.
- Fetch independent visible data in parallel. Do not block the entire detail page on a secondary panel or report.
- Use measured cache lifetimes and targeted RTK Query invalidation; avoid duplicate polling and broad refetch storms.
- Keep large tables virtualized/paginated through the existing datatable. Preserve keyboard access and visible row actions.
- Use skeletons that match the final compact layout. Avoid large loading overlays and unnecessary animation.
- Compose forms with React Hook Form, Zod, and the typed FormWizard field core. Load only the field renderers declared by a form; keep rich editors, uploads, signatures, and table inputs in domain-owned lazy chunks. See `docs/forms.md`.
- Test real content length, zoom/display scaling, long references, permission-dependent actions, and dense records.
- Set numeric startup, transition, bundle, and memory budgets after the pilot baseline, then keep them as release gates.

## First implementation slice

Generated hooks now cover every backend domain for operations with a strict contract; 244 operations still need backend response or request types (`docs/api-untyped-operations.md`) and are the typing backlog for the modules that use them.

Users is the second migrated module (`docs/users-migration.md`), built on the shared server-paged table. Roles is the first module pilot. It exercises generated identity hooks, permission-aware navigation, a searchable and paginated list, one-record detail loading, role creation and edits, permission assignment, guarded deletion, targeted cache invalidation, audit headers, and failure/retry states. See `docs/roles-migration.md`. This is a migration pattern, not a claim that the overall ERP detail redesign is complete. Visual acceptance on customer laptops, live server authentication, and installed-shell compatibility remain exit gates before broad migration.

## Decisions to close before broad migration

Configuration collections now have a desktop workspace at `/settings/config`, covering the 18 existing collections with independent permissions, on-demand forms, scoped query caching, and complete unit editing. Resource/payment-term edits remain gated by incomplete read contracts, and country writes are unsupported. See `docs/collection-configurations-migration.md` for integration coverage and existing backend limitations. Live authenticated and customer-screen acceptance remain outstanding.

Alerts, approval workflows, Sites, signature settings, and password change now have dedicated desktop routes. Editors preserve mixed recipients, stage order/required flags, and complete TimeSpan values. Signature uploads verify stored bytes before confirmation; password changes use the self-service endpoint and require explicit success. Existing backend password/delegation defects and live visual acceptance remain outstanding; see `docs/settings-migration.md`. Breadcrumbs merge explicit parents with the inferred navigation trail and retain queue/filter parameters.

- Which client OS/architectures ship first, and which current customer laptop configuration is the minimum target?
- What trusted HTTPS certificate and site-address provisioning process will be used when customers access the server by IP?
- When will the shared backend be served over a trusted HTTPS origin? Until then development sign-in over plain HTTP is an explicit opt-in.
- Which notification endpoint replaces the Next.js server's broker consumer and Socket.IO path?
- Which detail workflows are the first pilot and the highest-priority migration families?

## Documentation and verification

Keep this plan current as decisions are closed. Every implementation phase adds setup/build/deploy instructions, route conventions, API/session contract notes, and visual acceptance evidence. Verify the packaged application and an installed update path, not only browser development mode.

## Operations Watch companion (2026-10-24)

Adapt Dodo’s isolated transparent-window pattern for an optional ORYX Canvas 2D character, using the supplied character board. The first integration reuses unread notification and live-connection state, opens the existing notification sheet, and exposes no ERP mutation capabilities. See `docs/companion.md` for useful workflow mappings, local-only security boundaries, artwork limitations, and native acceptance gates.

## Customer Docker deployment (2026-10-27)

The user authorized an independent manual Docker package under `deploy/customer-docker`, reusing `deploy/Dockerfile`, its Nginx template and retained assets. Production fetch/build/deploy is restricted to `origin/entrance-server` only; `main` and `testing` never qualify. Prepare the branch locally from an approved testing commit if absent; do not push. Use port 3001, external `sail`, existing `oryx_api:5001`, pinned verified Bun 1.4.4, exact-SHA builds, GitHub CI approval, Cron polling, filesystem locking, pause/resume, Discord reporting and archived rollback images that survive unrelated image pruning. Keep `deploy/customer-server` unchanged. No customer access, deployment, backend/database changes, or global image pruning is authorized.


## Simplified customer Docker compatibility (2026-10-27)

The user's current instruction replaces the Docker package's exact OpenAPI hash gate with mandatory basic API connectivity plus focused candidate compatibility checks. Preflight does not request Swagger. Candidates inspect the selected release's baseline for consumed session, permissions, production and approval contracts; confirmed removals/incompatible inputs, outputs or authentication block activation. Harmless metadata changes pass; unavailable or ambiguous Swagger warns instead of implying a breaking API. Keep minimum-shell/protocol requirements independently under `deploy/customer-docker/requirements.json`; preserve the host-Nginx agent/policy, CI approval, production-branch isolation, Nginx health, rollback archives, lock, history and Discord. The user now explicitly authorizes pushing reviewed changes to `entrance-server`. Customer access/deployment and backend changes remain prohibited.


## Customer Docker probe permissions and retry (2026-10-27)

Keep umask 077 and restricted customer settings. Explicitly publish only the two non-secret release JSON snapshots as 0644 and repair their modes before candidate probes. Run probes as node with the existing read-only mounts and capability restrictions. Reuse a same-SHA completed image/archive only after archive integrity, revision and copied source snapshots verify; preserve fresh CI/compatibility/health checks, blocked-release protection and automatic rollback. Recognize complete pre-fix archives, reload pruned images, and refresh candidate runtime settings privately without rebuilding the image. Regression smoke uses root-owned Linux files and the exact backend_checks user/mount flags on isolated local networks.

## Manual customer Windows x64 installer (2026-10-27)

On entrance-server, reuse the already-registered deploy-testing.yml path as a manual installer-only workflow. Its testing branch copy remains independent, and the customer Docker workflow is unchanged. A branch/event guard plus exact dispatched SHA checkout restricts the production source. Reuse make:windows/NSIS/icons/shortcuts and native first-launch/companion checks; use an isolated Windows-runner frontend on loopback port 3001 for connected launch. Upload the verified installer as oryx-live-windows-installer. No customer server access or container changes. Document download and frontend-origin connection separately from hosted frontend updates.

## Report filter and print refinement (2026-10-27)

Preserve the current report catalog, typed API adapters, report permissions and shared print/export snapshots. Move editable filters into a scrolling DialogBody with explicit Generate; show applied filter details separately from the draft. Optional All selectors become multi-selects; retain required single-scope controls. Use IDs for procurement counterpart/material matching, and scope warehouse choices by actual ownership/production-assignment semantics rather than general department names. Native scalar scope endpoints may produce explicitly labelled scope sections instead of inventing combined totals; bound concurrent work and preserve cancellation/completeness checks. The user approved extending the backend for historical/as-of reports. Add transactional recorded-state history with an explicit opening baseline, live permission checks, read-only temporal queries and fail-closed coverage; do not fabricate pre-baseline balances. Verify server capabilities and freeze one UTC instant per generation, preserving current reports on older backends. Final-packing first-entry reads also handle only the legacy Error.NullValue absence response, with explicit backend 404 semantics and regression coverage.


## In-app updates (2026-10-27)

The user approved independent web and native update flows and explicitly requires the main Windows installer to support both 32-bit and 64-bit systems. Version 0.2.0 introduces a narrow update bridge and sandboxed local update dialog. The main NSIS installer embeds both architectures; pin supported Electron 43.8.3 for Windows because 44 removed ia32, with its January 2027 support boundary documented. Native updates use an embedded Ed25519 verification key, signed version/target/size/SHA-512 metadata, private verified caches, explicit install/restart, per-launch reminders and header progress. Unsaved work and the encrypted vault are protected. Invalid/unsigned payloads are never executed; CI signing keys are separate from customer configuration. Web polling applies safe compatible releases and defers editing screens, with minimum-shell gating retained. Serve independently published desktop artifacts through a dedicated read-only public downloads bind mount. Windows CI includes both payload checks and a disposable-key installed upgrade/restart test. No customer access, deployment or push is part of this side-conversation implementation.

## Single customer release pipeline (2026-10-27)

The user requires one pipeline instead of concurrent customer Docker and host-Nginx validation runs. Keep customer-docker.yml as the sole production entry point so the existing exact-SHA CI approval lookup remains valid. Use one global non-cancelling concurrency group across production push, PR and manual runs. Run the exact outgoing SHA through a shared dependency-free validator in both pre-push and CI: existing Docker web checks/build, a disposable customer-validation build stage for legacy Nginx/install/unit/config-preservation checks, then Docker runtime smoke. All target linux/amd64 and run sequentially; failed checks block Git push on all branches, including development/testing before production PRs. The installation fixture records service-control calls because build containers have no systemd PID 1, while real Nginx/unit syntax, installed files, permissions and non-root status are verified. Move the existing Windows job into this workflow behind a manual build_windows input and needs: web; shell artifacts and native smoke stay independent and opt-in. Retire duplicate workflow files on entrance-server, preserve other branches' definitions and deployment scripts, and document required-check migration. Fix the runner's preservation assertions to use sudo for root-owned configuration directories. No customer server access or deployment.

The user performs all pushes manually. Prepare and verify repository changes locally without pushing. Local workstation disk capacity must not be an admission gate for the GitHub pipeline: CI builds its checked-out commit on its own runner, and the shared release validator has no fixed free-space threshold. Preserve customer-server deployment preflight storage checks.

## Packaging-yield correction (2026-10-27)

The user requested comparison with Oryx Next and correction in Live after reviewing the customer packaging-yield forms. Preserve category units, material reconciliation, whole-unit rounding, variance reasons and guarded save/return behavior. Per the user's 2026-10-28 clarification, only syrup preloads the product full batch size, composition volume per bottle, and configured packing-style expected yield, all read-only. It has no received-weight/volume input. Generic bottle-style units must use product category/volume metadata to identify syrup; unsupported non-volume metadata must not show a guessed form. Other categories keep editable received and average weights. Total packed includes all sample categories; gain/loss compares that gross quantity with expected yield, while samples reduce only net warehouse availability and shippers. Persist expected yield through a companion backend calculation using the existing entity property, without changing DTOs or database schema. Preserve historical recorded values and the documented independent backend transaction/idempotency limitations. See docs/final-packing-yield.md. All changes remain local for manual review and push.


## Testing publication and conditional desktop builds (2026-10-28)

Restore the deleted testing-site publisher inside the single queued customer-docker.yml workflow. PR validation does not deploy. After exact-SHA validation, testing pushes (or explicit deploy_testing dispatch on testing) build/publish the existing web/gateway targets, probe the candidate, switch only the demo containers on port 3011, verify exact testing metadata/API/assets, and restore prior containers on activation failure. Customer production remains origin/entrance-server only with its independent port-3001 manual/Cron agent and unchanged approval lookup. No global pruning. Build/smoke/publish Windows sequentially only when installed desktop inputs changed; web-only changes, including the syrup form, preserve the installed shell and published installer. Production Windows builds stay manual. Signed native payloads are versioned and published before the feed; native releases require a version bump. Reuse existing testing SSH secrets and GHCR images. All repository changes remain local for the user's manual push; no workflow dispatch or server access is authorized here.


## Milestone-only remote pipeline triggers (2026-10-28)

The user's clarified branch policy supersedes PR validation triggers: development is a quiet working branch, testing hosts internal QA, and entrance-server is customer production. Remove the pull_request trigger entirely to avoid both source-labelled development runs and duplicate PR/merge runs. Pushes to testing and entrance-server (including milestone PR merges) retain full validation and existing destination-specific release behavior; opening/updating PRs does not deploy or run CI. Explicit manual jobs retain branch guards. Preserve local pre-push checks on all branches and the single sequential pipeline, conditional native builds, customer approval, rollback and backend isolation. The reported failed run also exposed a Linux-only lock-test race: parent exit precedes the killed child's descriptor teardown. Keep overlap rejection nonblocking and give recovery a bounded kernel-lock wait. No production locking behavior changes. Prepare and verify locally; no push or server deployment.


## Preserve waiting milestone deployments (2026-10-28)

The cancelled testing push at 07:44:25 queued behind development PR validation; a testing PR synchronization arrived at 07:44:30, and the waiting push was cancelled at 07:44:31 without starting jobs. This sequence matches GitHub's default single-pending concurrency replacement. cancel-in-progress:false protects an active run, not the default pending slot. Preserve one global sequential pipeline, remove the PR triggers as already decided, and explicitly set queue:max to retain up to 100 waiting runs across testing/entrance-server/manual requests. Update the shared pre-push/CI linter to the maintained kjanat actionlint 1.17.0 image, pinned by verified manifest digest; upstream 1.7.12 rejects GitHub's documented queue property. Keep offline read-only linting and all checks enabled. Verify acceptance of the actual workflow and rejection of invalid queue values/combinations. No push, workflow rerun or deployment is authorized here.


The queue-aware validator also rejects the existing Node 20 action runtimes. Use verified Node 24 action majors: checkout/setup-node v5, setup-buildx/login v4, build-push v7, upload-artifact v6 and download-artifact v7. Preserve existing inputs, exact SHA checkout, artifact names and sequential native smoke behavior. These are runner-action updates; web-only changes still do not build the desktop shell.


## Publish outstanding dual-architecture desktop release (2026-10-28)

The user verified that the testing download remains the v0.1.0 x64-only installer and the customer downloads directory has no EXE. GitHub has only that older successful installer artifact; current v0.2.0 x86/x64 source has never been published. Comparing with the last successful web run/event.before can silently skip this outstanding native release. Move testing change detection after web activation, read a private source/checksum record over the existing testing SSH connection, verify the installed EXE's SHA-256, and compare desktop inputs with that published source. No verified record means initial native publication is required. Keep the one sequential queue, existing dual-payload NSIS build and Windows installation/launch/upgrade smoke; advance the source record only after atomic installer/checksum/feed publication. Failed native jobs leave the baseline pending; later web-only changes skip native work once the current desktop is published. Expose a public checksum sidecar. Preserve customer-server isolation and manual first EXE copy; no push, workflow dispatch, server access or deployment by the agent. Document the manual-dispatch prerequisite that the workflow must exist on default main, and the existing automatic testing path as the way to build/publish this outstanding QA desktop release after the user's next milestone push.
