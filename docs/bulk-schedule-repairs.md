# Bulk repairs for a schedule product

Open a production schedule and choose **Repair product batches**, then **Repair
BOM**, **Repair packaging** or **Repair procedure**. Choose a product from that
schedule, supply a reason and preview every matching batch. Different batch sizes,
packing styles and markets belong to the same product selection; each batch uses
its own saved size/style. Unstarted, completed and cancelled batches are explicitly
skipped. Unchanged material configurations need no write. Any blocked running batch
prevents applying the whole operation.

Save the corrected product master first. BOM and packaging use the existing
pre-issue repair rules: no issue or consumption is undone, source stock and units
must reconcile, and changed requisitions retain their old approval evidence and
require a fresh approval cycle. **Repair issued stock** remains the separate,
single-batch post-issue workflow. Procedure repair updates active/upcoming steps
and preserves completed steps and started obsolete steps according to the existing
procedure rules.

Apply posts one product-within-schedule repair atomically. The server rechecks the
current actor's department and the existing `CanViewProductSchedules`,
`CanViewPlannedProducts` and selected `CanRepairBom` / `CanRepairPackaging` /
`CanRepairProcedure` grants. It verifies the reviewed batch membership, master,
document and stock snapshot under production write locks. Batches are processed in
stable ID order. Each allocation sees the remaining free stock after earlier
batches; an eventual shortage, conflict, failed approval reset or procedure failure
rolls back every earlier change. No physical shelf quantity is increased or stock
issued by this workflow.

The original material repair audit remains per batch. A new append-only
`ProductionScheduleRepairs` receipt records scope, kind, operator/time, reason,
reviewed fingerprint, before/after evidence and result counts; procedure evidence
includes the source assignments and batch steps. Its request ID is replayable only
for the same actor, scope, kind, fingerprint and reason. The UI can check the same
request after an uncertain response, without creating another repair. Failed
requests preserve the reason and require fresh review after a definitive refusal.

The typed endpoints are GET/POST
`/api/v1/production-schedule/{scheduleId}/product/{productId}/repair/{kind}`
(`0` BOM, `1` packaging, `2` procedure). Import only this path and its new schemas
with `bun scripts/import-schedule-repairs.ts EXPORT.json`, then generate/check.
The matching backend and `20261104164439_AddScheduleProductRepairs` migration are
required before activation. This task prepares the migration; it does not apply
it to a customer database, grant roles, post a live repair or deploy either app.

## Unstart before issue

Production reservations leave physical quantities on the source shelves and hold
their availability. Unstart releases the hold using the existing released/archive
markers; it never adds shelf stock or records a stock return. Today's shelf balance
may differ from the original reserved amount and is not itself proof of issue.
The server checks stock-issue information, completed requisition/item status,
received quantities and issue bin-card evidence, alongside its existing downstream
and unissued-BMR/BPR gates. Initial adopted configurations are already archived by
unstart and are excluded from the dependency blockers. Their before/after evidence
remains in the unstart audit. Actual issue, consumption and later work still block
unstart.

## Local verification

On 4 November 2026, 23 PostgreSQL integration tests passed with no skips, using
new disposable `oryx_issue_repair_test_<random>` databases. Coverage includes BOM
and packaging across multiple runs, cumulative stock-shortage rollback,
procedure repair with completed-step preservation, exact request replay,
permission/scope/master rechecks, fresh requisition approval cycles with old
decisions preserved, database audit immutability, reservation release and real
unstart/restart. The existing post-issue repair regressions also passed. The bulk
audit migration itself is exercised inside those disposable databases only.

All 46 selected schedule/unstart frontend tests and 26 contract/cache/module
checks passed. TypeScript and the production web build passed; generated API
consistency and EF's pending-model check passed. Browser fixtures at 1366×768,
1280×720, 1024×576 and 853×480 retained the dialog footer and had no horizontal
overflow or browser exceptions. The smaller sizes represent display scaling;
native Windows and customer acceptance remain separate. The UI detector reported
no findings. React Doctor was not run because automatic approval review had
blocked that external package over unverified source-data handling; local checks
were used. Existing large-chunk, attachment import and backend dependency/XML-doc
warnings remain outside this change.

The contract regression preserves the exact approved predecessor and proves the
bulk endpoint and its five schemas are the only additions. The source review for
the requested coordinated PRs compared that path and all five schemas with the
built backend metadata on `desmond-latest` (backend PR #1702, commit `87000f7f`).
The typed digest `bfaa319fb93979896947892ba9f3e665f1cbdff24700647b6a126c60a3a90f47`
is added to the compatibility policy while retaining every previous approval.
Removing only the reviewed additions reproduces prior approved digest
`f38dceee6e53dc16783197bce0ceb9d36b902f2d1d0b5185a77a1698adec5e9f`
exactly. Release validation still rejects unreviewed fingerprints. Activating the
feature still requires the matching backend and bulk audit migration; this source
review does not deploy either app or apply a customer database migration.
