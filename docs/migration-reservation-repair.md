# Repair outstanding reservations after opening-stock replacement

Prepared on 4 November 2026 for the client's 5 November maintenance run.
The portable entry point is `scripts/repairs/migration-reservations/repair.sql`.
It needs `psql` and the existing application schema, not Bun, a running API,
new application code or a new EF migration. Keep the ordinary database backup
before the maintenance run. Run from a fresh psql connection using the client's
normal PostgreSQL authentication; do not copy demo credentials or IDs.

The repair covers **every affected waiting requisition in the selected
replacement migration's department**, rather than accepting one requisition ID.
It rebinds existing reservation IDs from migration-written-off lots to the
explicitly selected approved replacement's current lot and shelf. Material and
UOM must match and there must be exactly one eligible replacement lot/shelf.
Multiple candidates require a separate reviewed allocation; the script refuses
to guess or split them.

Approved quantities, requisition/production statuses, expiry/retest dates,
physical shelf quantities, bin cards and stock movements are unchanged. Already
issued requisitions and unrelated reservations are excluded. The script does
not restore written-off stock, reverse an opening migration, issue stock, or
silently convert an earlier opening balance into a top-up.

## Choose the client replacement migration

Identify the correct approved **replacement** on the client, using the account
the user supplied: `fredericknyame12@gmail.com`. His user ID and permissions are
resolved on that server. His selected department must match the migration and
his current grants must include the existing raw/packaging issue permission for
every material being repaired. The script grants no permissions and has no
administrator bypass.

Run this read-only query on the client database, for example through its normal
psql connection. Review the file and approval time; choose the current complete
replacement with the available counted stock.

```sql
SELECT current_database();
SELECT m."Id", m."FileName", m."ApprovedAt", m."DepartmentId"
FROM "StockMigrations" m
JOIN users u ON u."DepartmentId" = m."DepartmentId"
WHERE lower(u."Email") = 'fredericknyame12@gmail.com'
  AND m."Mode" = 0 AND m."Status" = 1 AND m."DeletedAt" IS NULL
ORDER BY m."ApprovedAt" DESC;
```

## Preview, then apply the exact reviewed snapshot

Replace `CLIENT_DATABASE` and `CLIENT_REPLACEMENT_UUID` with the actual client
values. Add the usual host/port/database-user options or run these commands
inside the PostgreSQL container with `repair.sql` copied into it. The app/API
container is not the PostgreSQL container. Passwords stay in the normal configured
authentication, not command arguments.

```sh
psql -X -w --dbname=CLIENT_DATABASE \
  --set=expected_database=CLIENT_DATABASE \
  --set=migration_id=CLIENT_REPLACEMENT_UUID \
  --set=actor_email=fredericknyame12@gmail.com \
  --file=repair.sql > preview.jsonl
```

Preview is the default. It uses one consistent snapshot, creates temporary tables
only, prints a JSON report and rolls back. Check **every** `requisitions` entry,
`bindings` (old/new lot and shelf), `capacity`, and `problems`. Problems must be
empty. The report uses PostgreSQL numeric values without JS rounding. Keep this
report with the maintenance evidence and copy its `previewToken` into apply:

```sh
psql -X -w --dbname=CLIENT_DATABASE \
  --set=expected_database=CLIENT_DATABASE \
  --set=migration_id=CLIENT_REPLACEMENT_UUID \
  --set=actor_email=fredericknyame12@gmail.com \
  --set=apply=true \
  --set=expected_token=FRESH_CLIENT_PREVIEW_TOKEN \
  --set="reason=Reconcile outstanding unissued reservations after opening-stock replacement" \
  --file=repair.sql > applied.jsonl
```

Apply takes short write locks before reading the current business data, rebuilds
the plan and requires the exact preview fingerprint. It verifies live operator
permissions, approval and unit/quantity agreement, open production, absence of
issue receipts/bin cards or downstream consumption/returns, date eligibility,
available uncommitted stock across the whole waiting queue, and source shelf /
bin-card reconciliation. Any blocker or changed snapshot aborts the transaction.
Do not reuse a demo token on the client or automatically retry a refusal.

All reservation changes and an immutable `_MigrationReservationRepairs` audit
row commit together. Audit includes the resolved operator, actual database user,
reason, complete preview/before rows and resulting reservations. No apply means
no audit table is created. A repeat apply cannot change or duplicate the repair;
the old token is stale once its reservations have been rebound. The audit table
rejects UPDATE, DELETE and TRUNCATE. Do not remove its protections for a rollback.

After apply, rerun preview: these requisitions should no longer need repair.
Refresh the warehouse's issue page and use the normal issue operation. Its
approval, stock, audit and permission checks still apply; the script does not
perform a live issue as a test. Investigate any remaining refusal independently.

## Repository CLI and verification

For a workstation with Bun 1.3.14 and psql, the equivalent wrapper reads
`DATABASE_URL` from its usual environment. Explicit target options must agree
with that URL to prevent accidental cross-server execution.

```sh
bun run repair:migration-reservations \
  --migration CLIENT_REPLACEMENT_UUID \
  --actor-email fredericknyame12@gmail.com
# Apply additionally requires --apply --expected-token FRESH_CLIENT_PREVIEW_TOKEN.

ORYX_RESERVATION_REPAIR_TEST_CONNECTION=postgres://localhost/postgres \
  bun run test:repair-migration-reservations
```

The PostgreSQL tests create/drop a uniquely named **local disposable database**.
They cover all waiting requisitions, issued-history exclusion, unchanged stock,
permission/scope/approval checks, stale previews including newly queued work,
shortage, ambiguous/expired/frozen lots, raw retest precedence, production gates,
bin-card reconciliation, full rollback on a mid-write refusal, concurrent apply,
replay refusal and immutable audit. Root strict TypeScript checks the CLI/tests.
All 17 focused tests and the root strict TypeScript check passed on 4 November.

Demo preview on 4 November found PM/B/26/002–005: four approved, unissued
requisitions and 32 reservations, with sufficient unique replacement stock and no
blockers. The approved current file is `beta packing combined stock.xlsx`,
uploaded after the earlier replacement that wrote off their old lots. These are
demo findings, not client acceptance. No demo or client reservations were changed
while preparing this script. No client migration, role grant or deployment ran.
