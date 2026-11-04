# Post-issue BOM and packaging repair

Implemented locally on 2026-11-03. This adds post-issue quantity corrections;
the existing product BOM/packaging editors and pre-issue workflows are unchanged.
No client database, installed application, role grant or deployment was changed.

## Operator workflow

1. Correct and save the product's source BOM or packaging through its existing
   editor. For mg-linked materials, kg entry must be converted into mg; changing
   the material's department unit is not a repair of an existing quantity.
2. Open the batch on the production board. Choose **Repair issued stock**, then
   **Repair BOM after issue** or **Repair packaging after issue**.
3. Review the original issue, corrected requirement, additional issue/return,
   eligible source stock and selected material lots. The smaller stock-unit
   amount below the adjustment makes a tiny existing deduction visible even when
   the kg display rounds to four decimal places.
4. Enter a reason and apply. Every material must pass together. A failed or
   uncertain response retains the reason and requires a fresh preview. A retry
   of the same request returns its original receipt rather than posting again.
5. Review the repair reference, activity log and corrected issued quantities.
   Reopening the preview shows previous repair references, reasons and operators.

The original approved requisition and its approval signatures are preserved.
Requisition reads overlay the accumulated correction documents on `Quantity`
and expose `ApprovedQuantity` separately. The stock-issue screen and printed
voucher label the original approval when a correction is present. Production
stock, final-packing reads and subsequent consumption use the effective issued
quantity and current reservations.

## Eligibility and limits

Separate backend permissions are `CanRepairIssuedBom` and
`CanRepairIssuedPackaging`. The actor also needs `CanViewPlannedProducts`, an
active account and the batch's production department. The service checks access
before reading, inside the posting transaction and immediately before saving.
There is no implicit administrator bypass or automatic role grant.

Automatic repair requires one approved, fully issued requisition of the selected
kind, one open production run, matching units and unchanged material membership.
The original source warehouse and issued lot quantities must reconcile through
requisition-linked bin cards and the production reservations. Warehouse bin-card
balances must also reconcile with live physical shelf quantities.

The repair refuses consumed/deleted or ambiguous reservations, missing issue
references, changed/substituted materials, unlimited materials, unit mismatches,
finished/cancelled runs, started consumption steps, returns, extra-material
requests, final packing and finished-goods transfer records. A refused case
needs a reviewed correction specific to that workflow; the repair does not
invent a stock return, reverse consumption or rewrite a finalized reconciliation.
This first implementation therefore covers issued stock still held in production.

## Stock and audit behavior

The server calculates `current target − already issued`, including all earlier
repairs. Clients submit a preview fingerprint, request ID and reason; they do
not submit trusted adjustment quantities or arbitrary source warehouse IDs.

Increases take only the positive difference from available, date-eligible
source lots in expiry order. Availability subtracts other unissued reservations
and is capped by each lot's unconsumed, unreserved quantity. Decreases return
only this batch's unconsumed reservations to their verified original physical
shelves. An exhausted source allocation gets a new shelf row; deleted history
is retained. Lot quality status and expiry/retest dates are not changed.

One serializable transaction changes source shelves and production reservations,
reconciles affected batches' shelf-assigned summaries, and appends movements,
material events, bin-card adjustments, a production activity log and immutable
repair/line/allocation evidence. Total stock received and consumed quantities
remain unchanged: this is a warehouse-to-production reconciliation before
consumption. Material lots retain their original valuation provenance; no new
purchase price, financial journal or regulatory approval is fabricated.

The original issue writer can reset `QuantityAssigned` despite remaining shelf
stock. The repair derives that summary from live shelf rows and records its
before/after values. It never fixes that summary by adding physical stock.

Posting locks conflict with normal master edits, issue, reservation, consumption,
return and stock writers. The fingerprint is recalculated under lock. A reused
request ID cannot authorize different data, and a new request after the target
is reached is a no-op. A later master correction posts only its new outstanding
difference. Database triggers and the DbContext guard refuse audit updates,
deletions and truncation.

A repair also advances the production activity's existing update timestamp.
Starting Product Preparation or Final Packing claims that timestamp in the first
atomic consumption save. A step loaded before a repair returns 409 without
consuming stock; after reload, it consumes the corrected reservations once.
Failed repair/step writes clear their pending tracked changes so a later scoped
audit save cannot flush a refused stock plan outside its transaction.

## Reproduction and verification

The opt-in backend fixture creates and removes only databases named
`oryx_issue_repair_test_<random>`, on a local PostgreSQL server. It runs the exact
new audit migration on the isolated baseline, seeds clearly synthetic data and
uses the real `IssueStockRequisition` operation to reproduce the wrong mg issue.

| Material | Wrong issue | Correct requirement | Additional stock required |
| --- | ---: | ---: | ---: |
| PMF015 | 22.5 mg | 22,500,000 mg (22.5 kg) | 22,499,977.5 mg |
| PMF093 | 95 mg | 95,000,000 mg (95 kg) | 94,999,905 mg |

With 200,000,000 mg initially on each source lot, the first repair leaves
282,500,000 mg on source shelves and 117,500,000 mg in production reservations;
received totals remain 400,000,000 mg and consumption remains zero.

```sh
# From oryx-backend; use your local PostgreSQL user, with CREATE DATABASE access.
ORYX_ISSUE_REPAIR_TEST_CONNECTION='Host=localhost;Port=5432;Database=postgres;Username=LOCAL_USER' \
  dotnet test tests/APP.Tests/APP.Tests.csproj --filter FullyQualifiedName~IssuedMaterialRepairTests
```

Acceptance covers both repair kinds, same/new request repeats, later increases
and decreases, insufficient/expired stock, other-batch reservations, stale
previews, revoked access, department scope, consumed/deleted evidence, exhausted
source shelves, database audit protection, forced posting rollback and concurrent
requests, plus stale production-step refusal and successful consumption after
reload without duplicate consumption. UI tests cover reason validation, permitted choices, unreadable/blocked
previews and retaining the request ID/reason across a retry.

Browser checks used synthetic responses and the real themed dialog at 1366×768,
1280×720 and 853×480, including body scrolling with header/footer retained and
no page horizontal overflow. Native Windows display scaling and the actual
client's issue/stock history still require operational acceptance.

## Activation

Deploy the matching backend and apply
`20261103204140_AddIssuedMaterialRepairs` before activating this UI or the new
requisition read overlay. Synchronize the backend permission catalog through its
normal process; an administrator assigns the two permissions manually. Preserve
the original approval configuration. The migration is prepared locally only.

The two operations are `GET`/`POST`
`/api/v1/production-schedule/{batchId}/issued-material-repair/{kind}` (`0` BOM,
`1` packaging). Reproduce their scoped contract import from a metadata-only
backend export with `bun scripts/import-issued-material-repair.ts EXPORT.json`,
then `bun run api:generate` and `bun run api:check`. No deployed release
fingerprint is approved by this source-only contract addition.

Final local checks: `bun run check` passed (1,854 web tests, root/gateway/desktop
tests, route/API checks and workspace typechecks); the web production build and
backend build passed. The selected repair/production-board suite passed 37 tests,
including nine PostgreSQL cases with the exact migration, stock rollback,
concurrency and post-repair consumption. Additional existing issue/reservation
regressions passed in the earlier 23-test run. React Doctor reported no issues
for the new components and hook. EF reports no pending model changes, and zero
disposable repair databases remain after cleanup. Native packaged-app testing
was not run because this feature changes no Electron shell/update code.
