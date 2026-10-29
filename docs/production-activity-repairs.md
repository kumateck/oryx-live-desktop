# Production activity repair scripts

The first repair fills missing analytical raw data (ARD) links on **existing ATR
instructions**. It does not add a production step, assign users, submit an ATR,
verify a worksheet, release a test, complete a step, or change stock/financial records.

The batch activity copies `RouteResponsibleUsers`/`RouteResponsibleRoles` into
`ProductionActivityStepUsers` when production starts. Changing the product procedure
later does not refresh existing activities. The board derives its test stage from
these copied ARDs, not from the step name or order. A missing link produces “Test
stage: Not set”. Both the procedure and the activity may therefore need repair.

## Scope and prerequisites

Run from this repository with Bun 1.3.14 and `psql` installed. Use a restricted,
trusted database maintenance session and the customer's normal connection security.
Supply credentials through an existing `PGPASSFILE` or libpq environment, never a
connection string or password argument. The script is an operator maintenance tool;
the operator UUID is audit attribution and is **not** authentication. Database
credentials authorize the session. Do not expose this command through an HTTP route.

Use a backed-up database with the current backend QC schema, including ARD
`AnalysisType`, verification, and microbial requirements. Older schemas fail instead
of silently dropping QC checks. No application migration is added. Applying the
first change creates `public."_ProductionAtrRepairs"` as an operational audit table.

The named actor must be active, have the existing `CanEditProductionPlan` grant via
an active role and `PermissionTypes`, and belong to the product's department. No role
name or administrator bypass is used. Inspection uses the database session's read
privileges and does not impersonate an application user.

## Inspect one activity

The reported example is **Coldrilif Syrup, batch 4862**, activity
`01a1757c-7819-7e2f-ad68-d5e10a1a35cf`. After reviewing conflicting released history, the user confirmed **Finished for
step 12**. The existing released Finished ATR still requires reconciliation before
this batch can continue; see [the batch review](coldrilif-4862-stage-review.md). `0 = Intermediate`, `1 = Bulk`, `2 = Finished`; `Action = 7` means ATR.

Set `PGHOST`, `PGPORT`, `PGDATABASE`, and your normal libpq authentication externally.
Explicit host/database arguments prevent an accidental default connection.

```sh
bun scripts/repairs/production-atr/index.ts inspect \
  --host "$PGHOST" --port "$PGPORT" --database "$PGDATABASE" \
  --activity 01a1757c-7819-7e2f-ad68-d5e10a1a35cf
```

The JSON includes product/batch identity, every step and assignment, matching source
routes, existing ATR history including deleted records, BMR batch numbers (which can differ from a blank schedule number), and product ARDs with stage,
analysis type and verification state. Confirm the exact blocked step with production
and the correct stage/verified Chemical ARD with QC. Inspection makes no writes.

## Preview, then apply

Use the identities from inspection. `STAGE` must be `intermediate`, `bulk` or
`finished`. `EXPECTED_ASSIGNMENTS` counts all active ATR assignments on this step,
including already configured ones. The repair fills only null ARD links; it never
replaces an existing different ARD.

```sh
bun scripts/repairs/production-atr/index.ts repair \
  --host "$PGHOST" --port "$PGPORT" --database "$PGDATABASE" \
  --activity 01a1757c-7819-7e2f-ad68-d5e10a1a35cf \
  --step "$STEP_ID" --product "$PRODUCT_ID" --batch 4862 \
  --ard "$CHEMICAL_ARD_ID" --stage "$STAGE" \
  --actor "$OPERATOR_ID" --expected-assignments "$EXPECTED_ASSIGNMENTS" \
  --reason 'Restore missing ATR linkage for Coldrilif Syrup batch 4862'
```

This defaults to a **read-only transaction**. It validates the complete selection
and prints every proposed row's original values. If the product procedure itself
has missing links, either configure it through its usual UI or add
`--repair-procedure` to explicitly preview repairs to that one matched route's
existing ATR user/role instructions too. The route must match product, operation
and order uniquely. No other activity or procedure route is updated.

After reviewing the preview, rerun exactly the same command with `--apply` (and the
same `--repair-procedure` choice). Apply rechecks all evidence under short table
locks before writing. These locks briefly block writes to the production/QC and
identity tables involved; run during a quiet maintenance window. The lock timeout
is 3 seconds and each statement has a 30-second timeout. Contention causes failure,
with no automatic retry. Dry runs do not take these write-blocking locks.

The script refuses terminal/cancelled/deleted production, disabled/deleted assigned
users, missing BMRs, stale assignment counts, conflicting existing links,
missing/ambiguous source instructions, unverified/ambiguous/wrong-product or
wrong-stage ARDs and deleted worksheets. It requires a unique verified Chemical
ARD and the separate verified Microbial worksheet when required for Finished
products, matching the backend's `QualityAnalysisSnapshot.ForProductAsync` rules.
An existing ATR for the target step, including deleted history, always blocks
repair. Existing batch/stage history also blocks the default repair.

If the authorized work is limited to restoring configuration while preserving a
known released ATR on another step, explicitly use `--configuration-only` together
with `--existing-stage-request <reviewed-ATR-ID>`. This requires exactly that single
active Released ATR on another step for the same batch/stage; missing, changed,
additional, deleted or unreleased history is refused. The preview and durable audit
include the existing request and `requestCreationBlocked: true`. This option changes
only the missing configuration links. It does not create or move an ATR, and the
backend still refuses another request until QA reconciles the existing history.

## Evidence and recovery

Only a zero process exit code confirms success. A notice can appear before commit;
if the process fails or loses its connection, inspect the records and audit table
before another command. There is no automatic retry after uncertain outcomes.

One transaction writes the links, `UpdatedAt`/`LastUpdatedById`, full before/after
rows in `_ProductionAtrRepairs`, the database session identity, actor, reason and a
normal `ProductionActivityLog` referencing the repair ID. Audit/log failure rolls
back the links too. Running the same repair again before any ATR is created is a
no-op with `rowsToChange: 0` and creates no duplicate audit event. Once an ATR exists on the target step,
the refusal above takes precedence over the no-op path. The explicitly named
configuration-only path may repeat as a no-op while its reviewed other-step ATR
remains unchanged in identity and Released state.

After success, rerun `inspect`, refresh the board, and confirm that the intended
stage appears. Users then submit and process the test through the normal authorized
QC workflow. Further backend validation may still reveal an independent blocker.

There is no automatic undo after users resume production. If an operator chose the
wrong configuration, review `_ProductionAtrRepairs.Plan.before` and `After`, confirm
that no ATR or downstream evidence has used it, and prepare a separately reviewed,
audited compensating change. Do not delete the audit or restore an entire old row
over newer production activity.

## Run on the production server with Docker

The production host does not need Bun or this repository. Export standalone SQL
on a development workstation, copy the resulting private directory to the server,
and run it through `psql` inside the existing PostgreSQL container. Export never
connects to a database and does not copy passwords or application configuration.

```sh
bun scripts/repairs/production-atr/export.ts /path/to/new-output-directory repair \
  --host production-docker --port 5432 --database "$PRODUCTION_DATABASE" \
  ...the reviewed repair identity, operator and stage options...
```

Use `inspect` instead of `repair` to export only read-only inspection before
selecting a repair. Repair export creates `inspect.sql`, `preview.sql` and
`apply.sql`. Do not supply `--apply` during export: the two repair files already
have separate explicit modes. The exporter refuses an existing output directory.
The host/port settings inside exported SQL are descriptive; Docker/psql chooses
the actual connection. The SQL validates the database name and record identities.

Confirm the production database name, operator and product identities independently.
The earlier run against `164.90.142.68:5433/entrancedb` only establishes what was
changed on that configured endpoint; it does not prove the identity of another
production deployment. The user has identified production API container
`oryx-erp-api-demo`, database `entrancedb`, database user `root`. The API container
is not the PostgreSQL container.

Copy the generated directory using your normal SSH route, for example:

```sh
scp -r /path/to/new-output-directory adorablegigi@chipsoftgh:~/oryx-atr-repair
```

On the server, identify the **PostgreSQL** container, then inspect and preview:

```sh
sudo docker ps --format 'table {{.Names}}\t{{.Image}}'
DB_CONTAINER='actual-postgresql-container-name'
cd ~/oryx-atr-repair
sudo docker exec -i "$DB_CONTAINER" psql -X -w -U root -d entrancedb -v ON_ERROR_STOP=1 < inspect.sql
sudo docker exec -i "$DB_CONTAINER" psql -X -w -U root -d entrancedb -v ON_ERROR_STOP=1 < preview.sql
```

After the preview succeeds and the selected rows are reviewed, apply and inspect:

```sh
sudo docker exec -i "$DB_CONTAINER" psql -X -w -U root -d entrancedb -v ON_ERROR_STOP=1 < apply.sql
sudo docker exec -i "$DB_CONTAINER" psql -X -w -U root -d entrancedb -v ON_ERROR_STOP=1 < inspect.sql
```

Use `-i` without `-t` so input redirection works. These commands use the database
container's local socket and authentication policy. If password authentication is
required, provide the existing credentials through the container's normal libpq
configuration or securely supplied environment; do not weaken `pg_hba.conf` or
print the API connection string. Do not run apply after a failed preview.

## Local verification

```sh
bunx tsc --noEmit -p tsconfig.json
node --test tests/production-atr-repair.test.ts
```

The PostgreSQL tests are opt-in and require an **empty disposable** database named
`oryx_atr_test_*`. They create only fixture tables in that database and remove them
at completion. Never point these tests at customer data. With the instance already
running and credentials provided through libpq:

```sh
ORYX_REPAIR_TEST_HOST=/path/to/test/socket \
ORYX_REPAIR_TEST_PORT=55439 \
ORYX_REPAIR_TEST_DATABASE=oryx_atr_test_fixture \
node --test tests/production-atr-repair.test.ts
```

Coverage includes read-only previews, audited atomic repair, explicit procedure
repair, repeat execution, preserving other actions and workflow state, stage zero,
Finished Microbial requirements, conflicting links, deleted history, permission
and department denials, stale/ambiguous inputs, BMR identity checks, post-write verification, audit failure rollback and an ATR
committed while the repair waits for locks. Fixtures exercise actual PostgreSQL,
not a simulated transaction engine. They are not acceptance against a customer's
migrated database or an authenticated board session.
