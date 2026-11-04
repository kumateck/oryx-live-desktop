# Fresh opening balances, 1 November 2026

## Demo import completed, 3 November 2026

The user subsequently authorized replacing the screenshot demo's `entrancedb`
at `164.90.142.68:5433` with cleaned local `oryx_client_20261030` data.
Statements below about no customer-server changes describe the 1 November work;
this later import is complete. The local source is unchanged.

The demo had eight newer migrations and 477 tables. Its actual deployed schema
and migration history were restored with source data into an isolated local
rehearsal and then remote `oryx_import_stage_20261103`. No checkout migrations
or permission backfills were executed. New columns retain deployed defaults or
nulls; data backfills from the later migrations were not replayed.

All 439 source data tables matched row counts and hashes, all 15 sequence positions
matched, every constraint validated, and deployed columns, constraints and audit
trigger definitions matched before activation. At 21:23 UTC, database names were
switched. The old database remains `entrancedb_before_import_20261103`, intact
with connections disabled. The API keeps its existing database name, connection
configuration, image and storage. External attachments were not copied.

Final verification: 1,904 materials, 1,614 department links, 48 users, zero material
batches, shelf batches and opening drafts; 477 tables, 2,732 indexes, 5,763 valid
constraints and 189 audit triggers. After activation, 438 tables still match the
source; only `ErrorLogs` differs, with nine connection-switch entries between
21:23:31 and 21:23:32 UTC. No recent errors remained at the 21:27 UTC check.
The application reached sign-in. Authenticated pages and imports still need user
acceptance; the old browser session must sign in again.

The imported source has no opening-balance or migration-retest grants. Assign
the intended grants through Manage Permissions, then upload, review and approve
opening balances before testing **Update migration retest date** on an eligible
available raw batch. The previous demo draft and batch remain in the rollback
database, not the active cleaned database.

Private backup, checksums, scripts, fingerprints, rollback SQL and final evidence:
`/Users/gigisiri/.codex/visualizations/2026/11/03/01a1a32a-23fb-7fc1-8552-dee45382720e/outputs/demo-database-import`.
`demo-before.dump` is the complete pre-import backup. `rollback.sql` uses an
administrator connection to `postgres`, preserves the imported copy and switches
back to the previous database. Review new demo writes before any rollback.

The authorized local reset of `oryx_client_20261030` is complete. No opening
balances or upload drafts have been posted to that database. Application changes
are local source changes: rebuild/restart the backend and web application before
using this workflow. No customer-server deployment or role grants were performed.

## Upload the prepared workbooks

In Permissions Management, assign the required keys manually:

| Key | Allows |
| --- | --- |
| `CanViewOpeningBalances` | Open Material stock, view drafts, checks and comparisons |
| `CanUploadOpeningBalances` | Upload and save a draft; also requires view access |
| `CanCorrectOpeningBalances` | Correct rows, change file units, recheck or discard drafts; requires view access |
| `CanApproveOpeningBalances` | Approve a checked draft as stock; requires view access |

Department access and draft state checks still apply. Existing upload permissions
do not confer approval access. Approval is a separately permissioned action;
there is no additional rule requiring a different person from the uploader.

1. Open **Settings → Upload Center → Material stock**.
2. Select the department and one prepared file. Its warehouse/material rows
   identify the raw or packaging store. Keep file weight unit **mg** and liquid unit **ml**: Quantity is already
   converted. Using kg or L would convert it a second time.
3. Choose **Upload and save draft**. This creates no stock or bin-card entries.
4. Open the draft and review Needs fixing, Check, preparation notes and the
   comparison with current balances. Correct rows with **Correct draft** access.
   The correction quantity label shows the actual file quantity unit.
5. Recheck after corrections. Review source/resolved material names, shelves,
   batches, amounts and dates. Expired stock is retained and remains a warning.
6. With approval access, choose **Approve opening balances** and review its
   confirmation. Approval replaces existing balances for that department/store
   kind and posts the draft atomically. The fresh database currently has none.
   Repeat approval and changes to an approved draft are refused.

Do not upload the review workbook. Upload each of the four stock files once.
The stock files have exact uploader headers on the first sheet, no merged output
cells, numeric quantities, text batch identifiers, and literal `dd/MM/yyyy` date
strings to survive Upload Center's file rebuild without losing date formatting.
Source amounts, rows, filenames, resolved database identities and preparation
notes remain alongside upload fields. Original source files are unchanged.

The prepared stock files include `AR No.` in column H. The verification table
shows the imported AR beneath its batch; row correction and preparation-note
dialogs also show the AR and GRN. Search accepts AR numbers. A missing AR is
displayed as a dash and remains null in the stored data. Source AR values must
not be invented, replaced with the batch, or filled from another row.

## Outstanding source checks

Four rows in `tablet-raw-material-stock.xlsx` need confirmed date corrections
before that draft can be approved. Workbook rows include the header:

| Workbook row | Material | Current manufacturing | Current expiry | Problem |
| --- | --- | --- | --- | --- |
| 59 | RMC035 D-Calcium Pantothenate | July 2024 | July 2022 | Manufacturing follows expiry |
| 61 | RMG007 Dextrose Anhydrous | December 2026 | November 2028 | Future manufacturing |
| 89 | RMS013 Explotab | December 2026 | December 2029 | Future manufacturing |
| 145 | RML008 Lisinopril | July 2026 | July 2025 | Manufacturing follows expiry |

Review Items also exposes source/resolved name differences, notably syrup
packaging source row 252, Tobufen Syrup with code PML320. These warnings require
human identity review even when the code exists. The correction dialog permits
changing a material code and clears any previously selected identity.

## Preparation decisions

Excel determines each material–department UOM. Source kg is multiplied by
1,000,000 into mg; L by 1,000 into ml; pieces are unchanged. Secnidazole rows
217–219 and Sildenafil Citrate rows 220–222 are all kg, as confirmed. Merged
values are expanded. Missing/unavailable shelves fall back to the first rack
and shelf within the correct department and material kind. Distinct material
and batch pairs never share date reconciliation: earliest manufacturing and
latest expiry apply only to the same pair. Expiry months use month end.

Tablet date headings were swapped as instructed. Date-shaped batch values are
literal text `01/12/2017` for Amaranth and `01/02/2024` for Chlorocresol; original
pre-Excel identifiers cannot be recovered. Missing supplier batch references use
the source GRN where available; one packaging row has the explicit preparation
reference `OPEN-SYRUP-PM-0205`. Review notes identify this substitution.

Tablet source row 292 (unidentified 125,000 pieces, batch 1150060260) was omitted
at the user's request. It remains in the review ledger with 13 no-stock rows:
833 ledger rows, 819 included stock rows. Eight category headings are omitted.

| File | Rows |
| --- | ---: |
| syrup-packaging-material-stock.xlsx | 274 |
| syrup-raw-material-stock.xlsx | 176 |
| tablet-raw-material-stock.xlsx | 305 |
| ointment-raw-material-stock.xlsx | 64 |

## Database preservation and setup

`scripts/migrations/fresh-data/manifest.ts` lists all table policies. The generated
manifest covers 440 tables: 215 retained fully, 12 retaining selected master
support, and 213 cleared transaction tables. Preserved areas include materials,
department links, products, BOM/packaging/routes, users, employees, roles/grants,
HR/payroll setup, supplier/manufacturer/vendor/customer masters, questions,
templates, STP/specification/ARD, forms/formulas/revisions, alerts/approvals,
code settings, and configuration collections. Supporting attachments, responses
and approval evidence use FK/polymorphic retention closure. Files were not deleted.

The cleanup removed 28,649 dummy rows and verified 82,218 fully retained master
rows by counts and content hashes. Nullable pointers to removed transactions
were detached explicitly. FK triggers stayed enabled; application triggers only
on scoped clear/selective tables were suspended within the transaction and their
prior states were restored and asserted. Any preservation failure rolls back.

Material setup retained original IDs and product/quality links: RMG001 is
Griseofulvin, previous Glibenclamide became RMG040; RMG039 is Green Tea Extract
50%, previous Glucose became RMG041. Eight missing materials, 19 department
links, and 95 existing link UOM corrections were applied after rehearsal. Totals
are now 1,904 materials and 1,614 department links. No roles were changed.

## Backup, evidence and recovery

Run directory:
`/Users/gigisiri/.codex/visualizations/2026/11/01/01a198a4-d3bd-7ac3-9d8d-7da77f68bf38/outputs/fresh-migration-20261101-203716`

It contains `backup/oryx_client_20261030-before-reset.dump`, its SHA-256 file,
`reset.sql`, the full `reset.manifest.json`, main/rehearsal reset reports,
master setup SQL/plan/reports, `upload-files/`, and upload rehearsal evidence.
The dump was fully restored into `oryx_rehearsal_20261101_203716` before cleanup.
SHA-256: `5e135d5f5d99ecf0c43825a371d1a9f8e224b2e6c2db50220e6e09249a9790ca`.

For recovery, verify the checksum, stop application writes, and restore the dump
with `pg_restore --exit-on-error --no-owner --no-acl` into a new empty database.
Verify master counts and application connectivity there before switching the
application connection. Do not restore over newly approved stock. The reset SQL
has exact database-name guards and explicit policies; do not reuse it on another
schema or a populated live operational database without a new reviewed plan.

Rehearsal created all 819 draft rows with zero stock. The four unresolved tablet
date rows were excluded only on the disposable copy, enabling 815 approved rows.
Batch totals, assigned quantities, shelves and bin cards reconciled. Repeat
approval and corrections after approval were refused. All 13 Folidyn batches and
133 expired batches were retained. Main still awaits the user's uploads.

Verification includes independent original-to-output decimal checks for every
included quantity, actual frontend parse/rebuild round trips, backend database
rehearsal, permission and double-count regression tests, frontend permission and
route tests, strict typecheck/build, and mock-backed visual checks at 1366×768,
1280×720 and 1024×576. No live end-to-end application server was started for the
visual checks; PostgreSQL posting was exercised directly through the repository.
