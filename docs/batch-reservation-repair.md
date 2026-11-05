# Repair stock reservations from a production batch

Open the batch's production board and choose **Repair stock reservations**.
Review the current approved replacement file, affected requisitions, old and
replacement lots/shelves, reserved quantities and available stock. Enter a reason
of 10–1000 characters and choose **Apply reservation repair**. Reopen to see the
reference, operator, reason and allocation history. Issue through the normal
warehouse workflow afterward.

## Permission

`CanRepairStockReservations` is a dedicated backend permission under Production /
Products. Assign it explicitly through role management; no grants are made by
this implementation. The active operator also needs `CanViewPlannedProducts`
and the batch's production department. BOM, packaging, procedure and unstart
repair permissions do not authorize this action. Preview, apply and replay check
current server access. The client guards visibility and checks before submission.
The authenticated session supplies the actor; there is no actor/email override.

This capability authorizes rebinding approved unissued reservations. It does not
issue stock; warehouse issue permissions govern the later normal issue action.

## Scope and integrity

The server uses the latest approved, non-deleted opening-balance replacement in
the department, shown before confirmation. Missing replacements or tied approval
times require review. All affected waiting requisitions on this batch are
included atomically. Other batches' stale migration reservations count toward
required capacity and their reservations on replacement lots count toward stock
already committed. Other batches are never changed.

Automatic repair requires migration write-off evidence, matching material/UOM
and exactly one eligible available replacement lot/shelf. It refuses shortages,
ambiguous candidates, expired/frozen lots, missing/deleted/untraceable batches,
mismatched approved quantities, unapproved or partially issued requisitions,
issue receipts/bin cards, closed/cancelled production, started consumption steps,
downstream returns/packing and unreconciled source bin-card/shelf balances.
Raw and packaging retest eligibility follows the current backend's effective-expiry precedence.

Only the reservation's lot, source shelf and update metadata change. IDs,
quantities, production warehouse, approvals, statuses, dates, physical stock and
stock movements remain unchanged. The repair does not restore written-off stock
or reconstruct physically missing batch records from guessed material data.

Preview is read-only in a consistent snapshot. Apply locks business and access
evidence before rebuilding the plan and checking the exact fingerprint, including
the waiting queue. Stale previews/blockers refuse the whole operation. Writes,
production activity log and immutable `ReservationRepairs` receipt commit together.
The receipt holds actor, reason, before/after evidence and reviewed rows. EF and
database triggers protect it against edits/deletion, including SQL TRUNCATE.

The client retains the same request UUID for the same preview and reason,
including intranet HTTP. Replays return the original receipt after current access
checks; conflicting ID reuse is refused. An uncertain response reports no success:
reload and inspect history before continuing. Refused writes are not retried
automatically.

## Delivery and verification

Deploy the backend and `20261105113842_AddReservationRepairs` before activating
this UI; earlier prepared migrations remain prerequisites. Local implementation
does not run customer migrations, assign permissions or deploy.

Typed operations `PreviewReservationRepair` and `ApplyReservationRepair` share
`/api/v1/production-schedule/{batchId}/reservation-repair`. The backend embeds
`APP/Services/Production/ReservationRepairPlan.sql`, derived from the maintenance
checks, scoped and authorized by the service. The existing department-wide SQL
maintenance tool remains separate.

Import the owned operations/schemas from a built metadata-only backend export:

```sh
bun scripts/import-reservation-repair.ts /absolute/path/backend.json
bun run api:generate
bun run api:check
```

`ReservationRepairTests` exercise the deployment migration, permissions, stock
invariants, queue scope, stale previews, blockers, rollback and concurrent replay.
Set `ORYX_ISSUE_REPAIR_TEST_CONNECTION` to an isolated local PostgreSQL connection
and run `dotnet test tests/APP.Tests/APP.Tests.csproj --filter
FullyQualifiedName~ReservationRepairTests` in the backend. The fixture creates and
drops uniquely named local databases and refuses remote hosts. UI tests cover
permission isolation, lazy loading, reason validation, preview/receipt validation,
blockers and stable HTTP retries.

The clean PR branch passed 14 new backend tests plus 19 existing issued-material /
unstart tests, the full `bun run check` (including 2,007 web tests, root, gateway
and desktop tests, strict typechecks, route and generated API checks), and the
web build on 5 November 2026.
React Doctor found no issues in the seven new implementation files. A synthetic
long-record preview was checked at 1366×768, 1280×720 and 1024×576 / 853×480
viewport equivalents for scaling: no horizontal overflow, and the dialog header
and footer stayed visible while the body scrolled. Native Windows scaling and
installed-client end-to-end acceptance were not run.

The PR contract review proves that removing only the new repair path and its
seven owned DTO schemas restores predecessor digest
`d31b1bc59265cc6a98c995e9c3b3249dc8f73d948701228e1573cf31d01e888f`.
The legacy source-release manifest retains all older reviewed digests and adds
only the new typed digest
`fa46de385e587bca0821ff164522fedda3dca60d5e0b044336bd7093fe87d238`.
This source review does not activate a customer release or approve an arbitrary
raw backend export. Backend/migration deployment remains a prerequisite.
