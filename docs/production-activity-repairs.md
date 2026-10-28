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
`01a1757c-7819-7e2f-ad68-d5e10a1a35cf`. The user confirmed **Intermediate** for the reported blocked step; this is an
explicit business decision, not an inference from the screenshot. `0 = Intermediate`, `1 = Bulk`, `2 = Finished`; `Action = 7` means ATR.

Set `PGHOST`, `PGPORT`, `PGDATABASE`, and your normal libpq authentication externally.
Explicit host/database arguments prevent an accidental default connection.

```sh
bun scripts/repairs/production-atr/index.ts inspect \
  --host "$PGHOST" --port "$PGPORT" --database "$PGDATABASE" \
  --activity 01a1757c-7819-7e2f-ad68-d5e10a1a35cf
```

The JSON includes product/batch identity, every step and assignment, matching source
routes, existing ATR history including deleted records, and product ARDs with stage,
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
  --ard "$CHEMICAL_ARD_ID" --stage intermediate \
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
An existing ATR for the step **or batch/stage**, including deleted history, blocks
repair and requires reconciliation rather than a second request.

## Evidence and recovery

Only a zero process exit code confirms success. A notice can appear before commit;
if the process fails or loses its connection, inspect the records and audit table
before another command. There is no automatic retry after uncertain outcomes.

One transaction writes the links, `UpdatedAt`/`LastUpdatedById`, full before/after
rows in `_ProductionAtrRepairs`, the database session identity, actor, reason and a
normal `ProductionActivityLog` referencing the repair ID. Audit/log failure rolls
back the links too. Running the same repair again before any ATR is created is a
no-op with `rowsToChange: 0` and creates no duplicate audit event. Once an ATR exists,
the refusal above takes precedence over the no-op path.

After success, rerun `inspect`, refresh the board, and confirm that the intended
stage appears. Users then submit and process the test through the normal authorized
QC workflow. Further backend validation may still reveal an independent blocker.

There is no automatic undo after users resume production. If an operator chose the
wrong configuration, review `_ProductionAtrRepairs.Plan.before` and `After`, confirm
that no ATR or downstream evidence has used it, and prepare a separately reviewed,
audited compensating change. Do not delete the audit or restore an entire old row
over newer production activity.

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
and department denials, stale/ambiguous inputs, audit failure rollback and an ATR
committed while the repair waits for locks. Fixtures exercise actual PostgreSQL,
not a simulated transaction engine. They are not acceptance against a customer's
migrated database or an authenticated board session.
