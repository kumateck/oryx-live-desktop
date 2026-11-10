# Migration stock top-ups

Use **Settings → Upload Center → Migration stock top-up** for individual material
stock cases discovered after the opening migration. Opening balances remain a
separate replacement workflow. A top-up adds new lots and never writes off,
consumes or merges existing lots.

For existing unissued requisitions whose reservations were left on lots written
off by an opening replacement, use the preview/apply maintenance procedure in
[migration reservation repair](migration-reservation-repair.md). It covers the
affected waiting queue and retains issue history; it does not turn the original
replacement into an additive top-up.

Choose the production department, weight/liquid quantity units, and a required
reason. Either add stock lines manually or upload an `.xlsx` workbook with the
existing material-stock columns. Manual lines include material code, supplier
batch number, quantity, base UOM, warehouse/shelf, manufacturing and expiry
months, GRN and AR references. Weight/liquid amounts use the selected header
units; counts retain their base UOM. Entered decimal text is retained in the list
and converted to the existing numeric API contract only on save. An absent shelf
uses the existing first-shelf resolver and produces a review warning.

**Save top-up draft** saves the entire list once and creates no available stock,
bin-card entries or movements. The next page reuses migration row resolution,
correction, exclusion, unit conversion and validation. Missing or ambiguous
materials, invalid department/shelf links and date errors block approval. A top-up
accepts an optional supplier batch number when adding or correcting a line, or
uploading a workbook. Each unnumbered row remains a separate lot and produces a
review warning; it does not use a GRN as a replacement batch number. Missing
GRN/AR values are never invented;
the workbook parser still reads an AR embedded in a GRN cell when present.
Date behavior matches the existing migration:
manufacturing months and expiry month end. Top-ups do not reconcile conflicting
dates silently. Different GRN/AR references keep separate lots even when their
supplier batch number matches.

When a row's batch number is already on the department's shelves (an available
or fully used lot) and its AR number, manufacturing, expiry and retest months, and unit
all match that lot, approval adds the quantity to the existing lot instead of
creating a new one. All migration dates match by month and year, including legacy manual drafts. If any of those
differ, the row stays a separate lot and its warning names what differs.

The existing opening-balance keys apply, with department restrictions enforced
on the server:

| Permission | Top-up action |
| --- | --- |
| `CanViewOpeningBalances` | View the tab, draft history, rows and comparison |
| `CanUploadOpeningBalances` | Save a manual or Excel draft |
| `CanCorrectOpeningBalances` | Correct, recheck, exclude or discard draft rows |
| `CanApproveOpeningBalances` | Approve and post a checked draft |

No roles are granted automatically. As with the existing upload, approval is a
separate permission; a person holding both upload and approval permissions may
perform both actions. Drafts are the pending queue in the top-up history.

Approval rechecks the rows, requires a nonempty reason and positive ready stock,
and posts all included rows atomically. Draft locks prevent concurrent edits and
repeat approvals; a department lock serializes opening-migration and top-up
approvals. A refused or interrupted transaction cannot partially post the list.
Approved or discarded drafts cannot be edited or approved again.

Traceability includes the draft ID and reason, creator, approver/time, source
rows and references, row-to-posted-batch IDs, shelf receipts, bin cards and
warehouse movements. Before/added/after quantities and batch counts are captured
in `StockMigrationBalances` at approval. Subsequent issue or movement does not
rewrite that comparison. Full reasons remain on the draft; bounded shelf and
bin-card notes include the draft ID and a shortened reason when needed. Top-up
bin-card receipts continue the existing material/warehouse ledger balance.

The matching backend, `AddMigrationStockTopUps` schema migration and generated
materials client are required together before using the feature. Its schema
change is limited to migration mode/reason and approval balance evidence; older
migrations default to opening-balance mode. No migration, live stock posting,
role change or customer deployment is executed by this implementation task.

Focused frontend tests cover manual/Excel draft creation, required reason,
failure preservation, permissions and additive approval review. Backend tests
cover reason limits, lot identity and permission policies. The PostgreSQL posting
test uses `ORYX_STOCK_TOPUP_TEST_CONNECTION` pointing to an isolated test server
with CREATE DATABASE rights; it creates and drops a unique test database and
checks additive posting, source/batch/bin-card links, repeated approval, immutable
comparison and approved-draft edit refusal. It skips when this variable is absent.

Local verification on 3 November 2026: backend build and 48 focused migration
tests passed, including real PostgreSQL concurrent approval, blocked-row refusal,
transaction rollback and cumulative bin-card balances. All 24 upload-center UI
tests, 366 workspace route coverage checks, nine compatibility tests, generated
API reproducibility, web typecheck and production build passed. React Doctor
reported no issues in its changed-file scan. Browser checks used fixture API
responses at 1366×768, 1280×720 and 1024×576, 911×512 and 854×480 scaled equivalents;
the list/review had no page horizontal overflow and retained the shell footer.
The line dialog retained its footer at the smallest size. This is split browser
fixture and PostgreSQL repository coverage, not a deployed customer acceptance
test. Existing build warnings include the shared attachment chunk boundary and
large chunks; the backend also reports existing package/documentation warnings.

The warehouse entry page and Upload Center corrections both use month/year for
manufacturing, expiry and retest. Posted expiry/retest use the last day of the
month. The backend normalizes older `exactDates` drafts too. Original import
values remain evidence; existing approved lots and their references are not
rewritten. See [warehouse top-ups](warehouse-migration-top-ups.md).
