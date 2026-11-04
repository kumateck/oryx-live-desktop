# Unstart production before BMR issue

The 4 November correction treats unissued reservations as holds on shelf
availability. Releasing them makes the held stock available again without adding
physical shelf quantities or creating a return. Initial adopted configurations
are archived as already intended and do not block their own archive. Issue
information and document/ledger evidence still prevent unstarting issued stock;
see [bulk repairs and reservation release](bulk-schedule-repairs.md).

This repair returns an accidentally started batch to its schedule before its
BMR has been issued. It preserves the old run and its draft documents as
archived history, releases its unissued reservations, and permits a fresh start
with a new run ID. Physical shelf stock, material receipts/consumption, stock
movements and bin cards are unchanged.

## Using the repair

1. Open the batch's production board and choose **Unstart production**.
2. Review the draft documents, steps and reserved material lots to be archived
   or released. The server lists any reason the repair is blocked.
3. Enter a repair reason and confirm **Unstart production**. The app returns to
   the selected batch on its schedule. Normal scheduling-date/start rules still
   apply; the repair does not extend an expired schedule.

The dedicated permission is `CanUnstartProduction`. The actor also needs the
existing production-board view permission, an active account and the batch's
production department. Administrators assign the permission manually; the code
does not grant any role access automatically.

One matching draft BMR and BPR must exist on the initial step. A draft BMR
preparation step may be in progress, including entered batch/dates. Either
document having an issuer or issue date blocks the repair. Sampled/released
quality status, a later started step, any completed step, finished/cancelled
production or schedule, and deleted/consumed/ambiguous reservations also block.

The dependency check follows the backend model's foreign keys to the batch,
activity, steps, BMR/BPR and reservations. Existing requisitions, analytical
requests, form responses, returns, transfers, packing, post-issue corrections or
other dependent business records refuse the repair, including soft-deleted
evidence. These records require their own reviewed workflow correction.

## What is retained

The original run, step assignments/resources/work centres, activity logs and
draft BMR/BPR rows stay in the database. The batch number, quantity, product and
schedule membership are retained. The repair records the operator, reason,
request ID, date, preview fingerprint and complete before/after snapshots of
the changed run, steps, documents, schedule status and reservations. Audit
updates/deletes/truncation are refused by the database and DbContext.

Released reservations carry `ProductionUnstartRepairId` and remain archived.
Consumed-reservation reads and later post-issue repairs exclude these releases;
they never represent stock that was consumed. A subsequent start creates fresh
reservations and fresh draft documents. A further unstart can release those
new reservations independently.

The schedule returns to New when it has no other active runs; otherwise it
remains InProgress. Other batches and their stock are unchanged. The active-run
unique index applies only to rows whose `DeletedAt` is null, so the batch can
have archived starts and one current run. Active-run/step queries exclude the
archives. Restart preserves an existing batch number instead of clearing it.

## Concurrency and retry

Preview is read-only and uses a consistent snapshot. Apply checks the same
fingerprint and live permissions under a serializable transaction, with locks
on the affected/dependent tables. Archival, reservation release, schedule
reconciliation, log and immutable repair receipt commit or roll back together.
An uncertain/refused result requires a fresh preview, retaining the reason.

Request replay is tied to the original activity ID. Repeating it—even after a
new run has started—returns the old repair receipt and leaves the new run alone.
Conflicting reuse of a request ID is refused. Start operations serialize and the
partial unique index permits at most one active run.

Draft and step archival timestamps are concurrency tokens. Database reference
guards prevent late inserts/updates against an archived run/document, and
archived records cannot be changed. BMR issuance no longer reads archived
documents; issuance racing unstart results in either an issued live document
or an archived unissued document. A late stock reservation against an unstarted
batch is refused until a new run exists.

## Local acceptance and activation

The opt-in backend tests use only disposable local databases named
`oryx_issue_repair_test_<random>`. They execute the exact migration against the
pre-repair baseline and cover unstart/restart, two successive unstarts, replay
after restart, unchanged stock, released-versus-consumed reporting, wrong or
revoked access, stale previews, downstream blockers, another active batch,
database rollback, concurrent requests and a BMR issue race. UI tests cover
permissions, validation, blocked/unreadable previews, retained retry ID/reason
and navigation back to the schedule.

```sh
# From oryx-backend, with a local PostgreSQL user that can create databases:
ORYX_ISSUE_REPAIR_TEST_CONNECTION='Host=localhost;Port=5432;Database=postgres;Username=LOCAL_USER' \
  dotnet test tests/APP.Tests/APP.Tests.csproj --filter FullyQualifiedName~ProductionUnstartTests
```

The new operations are typed `GET`/`POST`
`/api/v1/production-schedule/activity/{activityId}/unstart`, with stable IDs
`PreviewProductionUnstart` and `ApplyProductionUnstart`. A scoped import from a
built metadata-only export is
`bun scripts/import-production-unstart.ts EXPORT.json`, followed by the normal
API generation/check. The versioned contract preserves existing operations and
release fingerprints.

Activation requires the coordinated backend and web build, migration
`20261103213221_AddProductionUnstartRepair` after the prior prepared migrations,
and a manual role grant. The migration adds the audit table, reservation-release
marker, active-run unique index and archive/write guards. It remains unapplied
on the customer's/main/rehearsal databases; no client repair was performed.
Browser visual checks were unavailable because local browser use is disabled
in Work settings. Native packaged-app/update tests were not run for this web/API
workflow change.
