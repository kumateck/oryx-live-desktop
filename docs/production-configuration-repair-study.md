# Production configuration repairs: procedure, BOM and packaging

Study date: 2026-11-02. Follow-up: the combined Repair menu and material repairs
are implemented locally; deployment and customer acceptance are outstanding.
Reviewed clean source baselines: desktop `4c8ca99`, backend `6c3f66ce`.

## Implementation follow-up

The user authorized implementation after clarifying that the operator saves
product corrections first, then repairs one running batch. The user explicitly
confirmed that issued/consumed material must be refused. The study below records
the original investigation and proposals; current operational rules are documented
in the companion backend's `docs/production-material-repairs.md`.

Implemented decisions: independent `CanRepairBom`/`CanRepairPackaging` grants;
server preview hashes; applied requirements per batch/kind; explicit reservation
release; retained approval cycles bound to requisition content revision; stale
approval rejection; full-allocation-or-rollback; atomic before/after repair audit;
and locks shared by cooperating production stock writers before their reads.
The Procedure action remains in the same header dropdown with its existing
confirmation and permission. Each choice has its own description.

Legacy adoption records requisition/reservation evidence as such, without
claiming to reconstruct the original master. Ambiguous selections, stock units,
source definitions and physical history are refused. The first implementation
requires physical stock and department unit IDs to agree, while explicitly
converting BOM requirements into that stock unit. Ordinary stock issue deducts
from the allocated shelf. Repaired vouchers display their revision.

Migration `20261102182519_AddProductionMaterialRepairs` and the matching backend
must precede frontend activation. New permissions are available for manual role
assignment; no automatic grants or customer data changes were made. The desktop
contract imports four typed operations and three optional content-revision fields
from a built, metadata-only backend export; generated output is reproducible.

Local verification results and remaining release checks are recorded in the
backend operator guide and `PLAN.md`. The remaining sections are the dated study,
not claims that all proposed future scenarios were executed.

The final follow-up also protects adjacent supply workflows: open purchases for
the selected material kind block repair; completed purchase receipts do not count
as production issue. Later supply requests validate adopted materials/quantity
bounds, and linked swaps require complete current allocations and recheck issued
history. A valid requisition substitute survives missing reservation evidence.
Released holds are excluded from current reservation/consumption totals and have
their own material-trace event. The backend guide records limits, including strict
stock-unit agreement, partial-row swap refusal and broad locks with a 3-second
timeout that still require contention testing on realistic data.

Local results: 70 backend tests passed (16 repair PostgreSQL tests included), with
four unrelated reporting database tests skipped; 37 desktop feature tests and 23
contract/cache compatibility tests passed. Typechecks, API/web builds, API and
route checks, model drift and the new migration's disposable-schema down/up
rehearsal passed. React Doctor found no issues (91/100); the targeted UI detector
returned no findings. Synthetic visual checks covered laptop sizes and scaling
equivalents. These results do not replace customer-schema migration rehearsal,
authenticated end-to-end acceptance or native Windows installed-client testing.

## Purpose and confirmed requirements

A corrected product definition must be deliberately applicable to an already
running batch. The user requests a **Repair** dropdown in the batch board header,
where **Repair procedure** currently appears, following the existing **Copy
procedure** dropdown pattern. Its entries are **Procedure**, **BOM** and
**Packaging**, each with a description and its own permission.

BOM and packaging repairs must reconcile the batch's required materials,
reservations and material still awaiting warehouse issue. Changing one without
the others can leave the batch blocked or cause the wrong stock to be issued.
The operation targets one batch and one repair kind; it does not edit the product
master, repair every batch, issue stock, approve documents or advance production.

This study examines the in-app procedure repair attributed by the user to Claude
Code. Claude's separate narrative report was not located in either repository;
the findings below come from source and existing tests, not that missing report.
The older ATR-link maintenance scripts are a different operation.

## What the source actually does

### Procedure is copied; material requirements are live

`ProductionScheduleRepository.StartProductionActivity` copies routes, resources,
work centres and responsible users into activity steps. It also reserves raw and
packaging stock and creates BMR/BPR records in its start transaction.

However, `ProductionScheduleProduct` has no applied BOM revision or packaging
requirement snapshot. `CheckMaterialStockLevelsForProductionSchedule` selects the
product's current latest active BOM; `CheckPackageMaterialStockLevelsForProductionSchedule`
reads its current packaging lines. Existing reservation and requisition rows are
separate stored records. Consequently, a master edit can already change the
displayed requirement without reconciling stock or pending requisitions.

The repair therefore cannot be implemented as another refresh of these queries.
It needs a consistent applied requirement for the batch and a transaction that
reconciles its operational records. A durable applied snapshot is the recommended
design; its schema and legacy transition remain implementation decisions.

### Current quantity rules

- Raw material: full batch uses `PrescribedQuantity`; half uses half that value.
- Packaging: full uses `PrescribedQuantity + Loose`; half uses
  `PrescribedQuantity / 2 + Loose`. The allowance is not halved in this reader.
- Packaging selects the batch's `ProductPackingId` plus lines applying to every
  style. It must not import another style's materials.
- Both readers can return main materials and substitutes. A returned candidate
  is not proof that the operator selected it as the material to use.
- The desktop packaging editor writes the allowance to both `Loose` and
  `PackingExcessMargin`. Repair must not add these two copies together.
- BOM prescribed quantities are calculated when the editor saves. Production
  readers do not rescale them using the schedule batch's numeric `Quantity`.
  Recomputing by a new formula during repair would change business behaviour.

Use backend decimal quantities and explicit unit conversion. A BOM base unit,
department stock unit and physical batch unit may differ. Numeric equality alone
is insufficient. Reject incompatible or missing units; do not infer a conversion
from a unit's display name or round warehouse quantities for display convenience.

### Reservations also represent production material history

`MaterialBatchReservedQuantity` records the production warehouse, production
schedule product, physical material batch, original shelf, unit and quantity.
Reservation creation does not deduct stock from the storage shelf.

Issue reads active reservations, deducts storage stock and creates movements,
batch events, bin-card entries and an issue/signature record. The reservation
survives issue. Later, named production operations consume raw or packaging
material and remove reservation rows. Procurement readers and
`GetConsumedBatchesAndQuantityForProductionWarehouse` use deleted reservation
rows to represent consumed quantities; full-return records can also reference
reservation IDs. Inspect unfiltered history before deciding what a row means.

**Do not release an unissued reservation by ordinary deletion and allow it to
appear as consumption.** Release, issue, consumption and return need distinguishable
evidence, and every affected consumer must respect it. Preserve referenced IDs.
The exact representation and any required migration need design before writes.

## Existing procedure repair: reference and limits

The current `repair-procedure` endpoint requires `CanRepairProcedure` and gets the
actor from the authenticated request. `ProductionProcedureRepair.RepairAsync`:

- Refuses completed or cancelled activities and products without procedures.
- Matches routes to open steps by order, after the last completed/cancelled step.
- Updates matching steps, adds missing upcoming steps, removes obsolete New
  steps and keeps obsolete steps that have started.
- Replaces operation/workflow, criticality, links and responsible instructions,
  including analytical raw data. Completed steps are preserved.
- Saves an activity log with its writes in a transaction and rolls back on a
  database conflict. Existing tests cover step copying and removal/retention.

It is a useful UI reference, not evidence that replacing material rows is safe.
It loads activity/source evidence before beginning its write transaction, has no
preview/version token or structured before/after repair record, and the inspected
controller/helper do not explicitly recheck a current department and grant under
the write transaction. Some reads rely on EF filters. New repair paths should use
explicit resource authorization and fresh transactional evidence.

Matching an active step by order can also change its instruction while a linked
ATR, requisition or other document already exists. Adding the menu must preserve
the current action, while tests should identify these existing-history cases;
do not silently claim stronger procedure guarantees than the implementation has.

## Proposed menu and permissions

Reuse `DropdownButton` and its existing `description` support. No new menu
primitive or registry component is needed. Keep the route as orchestration code.

| Entry | Description |
| --- | --- |
| Procedure | Apply the product's current procedure to this batch's active and upcoming steps. Completed steps stay unchanged. |
| BOM | Reconcile this batch's raw-material requirements, reservations and unissued requisition with the corrected BOM. |
| Packaging | Reconcile this batch's packaging requirements, reservations and unissued requisition for its selected packing style. |

Keep `CanRepairProcedure`. Add distinct backend-registered permissions for BOM
repair and packaging repair; their exact constant names must be established in
the backend permission catalogue before the frontend uses them. Product-edit,
planning, stock-issue and approval permissions do not implicitly grant repair.
Register them in the normal role-assignment catalogue; do not auto-grant roles.

Put `require` on each entry and on its confirmation. Hide the trigger when no
entry is permitted. Hide repairs for terminal/cancelled runs; explain other
ineligibility with a disabled reason or preview blocker. Recheck permission after
preview and immediately before submission; backend preview/apply both check the
current grant, active actor, exact batch and authorized production department.
Do not accept an actor/department supplied by the browser as authority. A 403
refreshes access without replaying the mutation.

## Repair eligibility proposed for the first implementation

These are recommendations, not existing backend guarantees. Evaluate the selected
material kind independently: raw issue need not prevent a still-unissued packaging
repair. Never decide safety from a step number, operation name or header status
alone; inspect lines, issue records, movements, consumption and return evidence.

| Affected kind's state | Proposed handling |
| --- | --- |
| Running batch, reservations only, no stock document | Preview added/removed/changed requirements and reconcile unissued allocations atomically. Do not raise a requisition automatically. |
| Unissued requisition, no approval decisions yet | Reconcile lines and reservations, and bind its approval process to the new content. Preserve document identity/history. |
| Unissued requisition with pending or completed approval decisions | Changed content needs a new approval cycle/revision. Preserve prior decisions as history and prevent issue under the old approval. |
| Any affected line partly/fully issued, even if the header is not Completed | Refuse automatic rewriting of that kind. Show affected documents and quantities for controlled reconciliation. |
| Consumed material, return evidence or issue-check/signature evidence | Preserve history; require reconciliation outside the automatic unissued repair. |
| Open/approved/issued extra material, swap or stock transfer affecting this kind | Identify and reconcile explicitly. The first implementation should refuse an unresolved overlap rather than count it twice. |
| Final packing or finished-goods transfer already exists | Refuse material repair; do not recalculate finished yield, returns, transfers or financial history. |
| Completed/cancelled/deleted batch or missing/ambiguous source | Refuse. |
| No actual difference | Report a no-op after validation; no new reservations or duplicate repair audit. |

Already issued material may be corrected only through a separately defined,
auditable return/extra-material/deviation workflow. This boundary does not fully
cover every possible running batch; it prevents an unissued repair from rewriting
physical history. Post-issue repair remains a separate design decision.

## Gaps to resolve before implementation

| Observed source behaviour | Risk and required response |
| --- | --- |
| Requirements follow current masters, while reservations/documents persist | Introduce an applied batch requirement/version and use it consistently in running-batch reads and writes. A later master edit must not bypass repair. |
| Packaging save deletes and recreates package rows | Do not rely on package row IDs alone for durable comparison. Keep source content/identity and match material plus packing scope; handle duplicate/ambiguous identities explicitly. |
| `FreezeMaterialInProduction` appends reservations for returned candidates | Never call it again as repair: it is not a delta reconciliation. It can allocate both a main and substitute, ignores unsuccessful supply results, and does not check the packaging reservation result. |
| Supply selection reads shelf quantity; reserve validates a single shelf balance | These helpers do not subtract all other active reservations. Use a reservation-aware allocator under concurrency protection; never take another batch's allocation. |
| Released/deleted reservation rows can be read as consumed | Establish explicit release evidence and update consumption/availability/return readers together. A new audit message alone does not correct those reads. |
| Storage warehouse selection in procurement readers uses the schedule creator's department even after resolving the schedule department | Resolve and validate the batch's authoritative department and raw/packaging/production warehouses explicitly. Do not depend on a creator who moved department. |
| Procurement readers may label materials Supplied when current step order exceeds 2 and choose the first stock requisition without an RM/PM discriminator | These are display heuristics, not repair eligibility. Join the exact kind's documents and inspect real issue evidence. |
| `StockIssueQuantityValidator` requires reservation totals to equal each requisition line and rejects duplicate material lines | Requirements, selected allocations and unissued lines must agree in normalized units after repair. A changed requisition with old reservations will block issue. |
| Issue preloads reservations/items/shelves before its Serializable transaction and rechecks only header completion inside it | A repair-only lock is insufficient. Bring issue reads/version checks into the shared transaction protocol so stale preloaded quantities cannot be issued after repair. |
| `StockRequisitionRules` permits one RM and one PM main requisition per batch | Do not append a second ordinary main voucher or evade the rule with a different code. Any supersession/revision must update every lookup/duplicate check deliberately. |
| Approval rows are attached to a requisition; `CreateRequisitionApprovals` skips an existing definition association | Setting `Approved = false` then calling the helper does not implement a fresh approval cycle. Design revision-scoped approval evidence and adapt approval reads/writes. |
| Stock issue creates movements, bin cards, signatures and a separate warehouse issue check | None may be erased, reset or reattributed by repair. Eligibility must detect them even with stale headers or deleted history. |
| Swap approval can rewrite reservation batch IDs | Swap and repair need shared serialization and fresh stock/shelf/unit checks. Pending swaps cannot silently apply to superseded allocations. |
| Preparation/final-packing operations consume reservations; cancellation/full returns refer to them | Protect those writers against concurrent repair and preserve physical provenance. Ordinary stock return is not a way to release never-issued stock. |
| Extra-material status `Approved` means issued; QA approval alone sets InProgress | Read `Approved`, status and issue evidence correctly. Keep extras separate from corrected base requirements. |
| Final-packing UI reconciles issued PM plus extras and refuses unmatched materials/conflicting units | A post-issue new material cannot be inserted only into requirements/extras and assumed to work. Test the full reconciliation/return chain. |

These findings are static source observations and resulting risks; this study
does not claim to have reproduced every race or historical inconsistency.

## Proposed preview and atomic apply contract

1. Authorize and load the exact running batch. Inspect active and deleted history
   needed for safety without bypassing department checks. Select one source BOM
   or the selected style's packaging plus common lines. Reject empty, invalid,
   ambiguous or incompatible source definitions.
2. Produce a read-only server preview: batch/product/style/size, applied and
   proposed requirements, unit conversions, selected material/substitute,
   per-batch/shelf allocations to retain/release/add, pending voucher changes,
   approval consequences, shortages and every blocker.
3. Preserve an existing valid substitute choice. Alternatives are choices, not
   additive requirements. If selection is ambiguous, require an explicit reviewed
   selection rather than automatically reserving every returned candidate.
4. Require a reason and explicit confirmation. Bind apply to the preview's source
   content hash and operational versions; do not trust client-calculated quantities.
5. In one backend transaction, acquire the agreed locks, reload current evidence,
   reauthorize, check versions/eligibility and recalculate. Shared locking/version
   rules must cover issue, reserve, swap, approval, consumption, return and master
   changes. Locking a batch row alone does not protect competing shelf allocations.
6. Preserve valid allocations; change only the selected kind's unissued delta.
   Save applied requirements, reservation release/change evidence, unissued lines,
   required approval-cycle changes and structured repair audit together. If any
   check/write/audit fails, roll everything back. Never advance a production step.
7. Verify normalized requirement/allocation/document consistency before commit.
   Record actor, reason, kind, exact source, before/after values, conversions and
   linked documents. Write a production activity log pointing to the repair ID.
8. Return a typed result with repair ID, changed quantities/documents, outstanding
   approvals and explicit blockers. Use an idempotency key for uncertain outcomes;
   inspect that result before retry. No automatic replay after 403, conflict or a
   timeout whose commit outcome is unknown.

For the unissued path with no overlapping extras/returns: normalized reservation
totals must equal the applied requirement and, when a main requisition exists,
its active line quantity. Compare by material and explicit allocation identity,
not product-package row ID or material name. Release only unissued excess. Do not
double-count an issued quantity as both available reservation and new demand.

Recommended first shortage policy: refuse the entire apply if the corrected
unissued requirement cannot be fully allocated; show exact shortages and retain
all prior data. Supporting a committed repair with partially reserved stock
requires an explicit blocked state respected by every issue/start path. Choose
that alternative deliberately; never silently skip failed reservations.

## Integration and implementation sequence

1. Close the applied snapshot/legacy baseline, reservation-state, approval-revision,
   shortage and post-issue scope decisions. Legacy batches without an original
   snapshot need evidence-backed adoption, not an invented original BOM. If the
   original cannot be reconstructed, preserve that uncertainty and refuse unsafe
   automatic adoption. Inventory any affected historical reports/print views.
2. Implement backend permissions, typed contracts and the pure diff/validation
   service, then transactional apply and the cooperating writer checks. Keep
   production orchestration separate from allocation and audit responsibilities.
3. Route running-batch requirements and stock/requisition reads through the same
   applied version. Check forecasts, availability, batch detail/BMR/BPR views,
   vouchers, extra-material flows, returns, reporting and costing consumers;
   preserve recorded historical values and distinguish forecasts from actuals.
4. Export/version OpenAPI and generate the production-domain client per
   [API code generation](api-codegen.md); run `bun run api:check`. Do not hand-edit
   generated endpoints or add untyped HTTP fallbacks.
5. Replace the current header button with the shared dropdown, preserving the
   Procedure action. Keep preview/query, action and presentation code separate.
   Use a scrollable `DialogBody` with fixed header/footer and page-shaped loading
   skeletons. Only load the chosen repair's data after its permission check.
6. Invalidate the affected activity, schedule batch, requirements/reservations,
   requisitions/approval queues and relevant stock queries on success. Retain
   generated tags, add explicit cross-domain effects and avoid global invalidation.
   Handle stale open issue/packing forms in other windows and Oryx Next as well.
7. Coordinate backend/migrations and all clients before enabling BOM/Packaging.
   Do not ship selectable placeholder actions or permit older writer paths to
   bypass revision/approval checks. Measure and review legacy adoption separately.

## Verification required before enabling repair

- Pure diff tests: add/remove/increase/decrease, unchanged repeat, full/half
  batches, common/selected/other packaging styles, allowance counted once,
  decimals, unit/density compatibility, source ambiguity and substitute selection.
- Real PostgreSQL integration: read-only preview, atomic multi-table apply,
  unrelated-kind/batch preservation, reservation release not counted as consumed,
  insufficient-stock rollback, exact shelf provenance and no duplicate allocations.
- Approval/document tests: no decisions, pending/approved old content, new cycle,
  stale approver tab, unchanged source, RM/PM duplicate guards and voucher printing.
- History tests: partial/full issue with stale header, consumed/deleted rows,
  issue-check/signatures, pending swap/transfer, extras in each state, return-note
  references, final packing and finished-goods transfer. Assert no ledger changes
  from an unissued configuration repair.
- Concurrency tests with independent database sessions: repair versus issue,
  competing batch reservation, swap, approval, consumption, cancellation, return,
  source edit and another repair. Prove stale reads cannot write after repair;
  a transaction around only the new endpoint does not prove this property.
- Fault tests: failed audit or approval creation rolls back every repair write;
  disconnect after commit yields one discoverable repair, not a duplicate retry.
- Permission tests: each of three grants independently; view/edit/issue permissions
  alone denied; revoked grant between preview and apply; cross-department/disabled
  actor; direct API access; terminal/deleted batch; no implicit administrator grant.
- UI tests: descriptions, hidden trigger when empty, keyboard selection,
  permission loss, stale previews, blockers, success/no-op summaries and cache
  refresh. Preserve current Procedure confirmation and current-step action gates.
- End-to-end: corrected BOM and PM through normal approval, issue, preparation,
  final packing, returns and transfer; compare quantities, bin cards, signatures,
  activity history and financial/reporting effects. Check 1366×768/1280×720 and
  125%/150% scaling, slow/offline responses and uncertain outcomes.

## Source map for future study

Backend paths below are in the companion `oryx-backend` repository.

| Area | Source and entry points |
| --- | --- |
| Procedure repair | `API/Controllers/ProductionScheduleController.cs`: `RepairProductionProcedure`; `APP/Repository/ProductionProcedureRepair.cs`; `APP/Utils/PermissionUtils.cs`: `CanRepairProcedure` |
| Batch start and live requirements | `APP/Repository/ProductionScheduleRepository.cs`: `StartProductionActivity`, both `Check*MaterialStockLevelsForProductionSchedule` methods, `FreezeMaterialInProduction` |
| Quantity/selection/save | Desktop `modules/products/lib/bom.ts`, `lib/packaging.ts`; backend `APP/Repository/ProductRepository.cs`: `CreateProductPackage`; `APP/Mapper/Resolvers/ProductBoMResolver.cs` |
| Applied-batch schema gap | `DOMAIN/Entities/ProductionSchedules/ProductionSchedule.cs`: `ProductionScheduleProduct`; `DOMAIN/Entities/Materials/Batch/MaterialBatch.cs`: `MaterialBatchReservedQuantity` |
| Allocation/history | `APP/Repository/MaterialRepository.cs`: `BatchesToSupplyForGivenQuantity`, `ReserveQuantityFromBatchForProduction`, `GetReservedBatchesAndQuantityForProductionWarehouse`, `GetConsumedBatchesAndQuantityForProductionWarehouse` |
| Requisition/issue | `APP/Repository/RequisitionRepository.cs`: `CreateRequisition`, `IssueStockRequisition`, `IssueStockRequisitionVoucher`; `APP/Repository/StockIssueQuantityValidator.cs`; `APP/Services/Production/StockRequisitionRules.cs` |
| Approvals/signatures | `APP/Repository/ApprovalRepository.cs`: requisition review branches and `CreateRequisitionApprovals`; `APP/Repository/StockRequisitionIssueApprovalHandler.cs`; `DOMAIN/Entities/Requisitions/StockRequisitionIssue.cs` |
| Swaps | `APP/Repository/WarehouseRepository.cs`: `ApproveSwapRequest` |
| Consumption/returns/extras/final packing | `APP/Repository/ProductionScheduleRepository.cs`: `UpdateStatusOfProductionActivityStep`, `ReturnStockBeforeProductionBegins`, `ReturnLeftOverStockAfterProductionEnds`, `CreateExtraPacking`, `ApproveProductionExtraPacking`, `CreateFinalPacking` |
| Explicit resource authorization reference | `APP/Repository/ProductionStepRecordsQuery.cs`: current grant and production-department checks; `INFRASTRUCTURE/Context/ApplicationDbContext.cs`: query filters |
| Existing menu/header | Desktop `modules/products/components/procedure/procedure-section.tsx`; `shared/actions/{dropdown-button,action-items,action-menu-items}`; `pages/(workspace)/production/activities/[id]/board/page.tsx`; `modules/activities/components/batch/repair-procedure.tsx` |
| Existing consumers | Desktop `modules/activities/{api/activity-api.ts,hooks/use-final-packing.ts,hooks/use-step-records.ts,lib/stock-requisition.ts}`; `modules/schedules/{api/schedule-api.ts,lib/batch-materials.ts}` |
| Existing tests | Backend `tests/APP.Tests/Repository/{ProductionProcedureRepairPostgresTests,StockIssueQuantityValidatorTests,StockRequisitionRulesTests,StockRequisitionIssueApprovalTests}.cs`; desktop `modules/activities/components/activities.test.tsx`, `modules/products/components/procedure/procedure-section.test.tsx` |

Desktop source paths in the last rows are relative to `apps/web/src`.

## Original study verification and proposed follow-up

At the original study stage, performed: read-only inspection of the sources/test definitions above, comparison
of the copy/repair UI and permission contracts, and documentation link/path checks.
No customer database was connected, no production records were changed, and no
new application behaviour or migration had yet been added. Existing tests were
read at that stage. The matrix above records the proposed coverage; actual
implementation results and outstanding release checks are listed in the
implementation follow-up at the beginning of this document.

The subsequent authorized implementation records its decisions in `PLAN.md` and
its operational rules, migration, compatibility requirements and limitations in
the companion backend guide. Preserve this original investigation for future
study rather than treating its recommendations as the current runtime contract.
