# Raw-material retest extensions

For raw batches, an active original expiry date takes priority. After that date
elapses, a recorded retest date extends usability until the retest date elapses.
Without an active extension, the material is expired. For example, expiry in
December with a November retest remains active through its December expiry;
expiry in September with a December retest remains active through its December
retest. Packaging retains its existing expiry rule. Undated legacy stock retains
its existing treatment. Quality/status, stock ownership, approval and quantity
gates still apply.

The same backend expression determines usable shelf/mass stock, expiry quantities,
FIFO supply selection, reservation validation, reserved-stock issue validation,
expiry-list membership and alerts. Batch DTOs expose `effectiveExpiryDate` while
preserving both original dates. The due retest scan waits while raw-material
expiry is active; otherwise the existing governed QC journey still applies.

On an expiry-list batch detail, **Update migration retest date** is controlled by
the new backend permission `CanUpdateMigrationRetestDate` (Warehouse / Expired
Materials). Roles receive no automatic grants. Approved migration raw stock must
be available, belong to the operator's selected department, and have no QC retest
cycle. The operator supplies a later extension or clears an incorrect one, with
a required reason. The server checks current grants, serializes against competing
corrections/QC requests, rejects stale expected dates, and saves the change and a
`MigrationRetestDateChanges` before/after audit row in one transaction. No stock
quantities, original expiry, QC status, approval or valuation changes occur.
A QC retest already in progress must finish through its governed workflow.

Retest validity selectors use the same month-and-year picker as expiry fields,
with no day selection: migration retest corrections, governed material-retest
proposed expiry, and product analytical retest extended expiry. A selected
extension is saved as the last day of that month
in UTC, using the shared batch-expiry conversion (including leap years). Clearing
it sends no retest date. The original full dates are still sent unchanged as the
expected values for migration stale-record checks, and a correction reason remains
required. Actual sample-collection dates retain day selection for traceability.
Receiving, BMR issue/revision and migration/top-up manufacturing and expiry
selectors already use month precision. Report expiry filters now include whole
months, and explicit worksheet reagent/reference-standard lot-expiry fields use
the shared month picker while retaining their date-only request format. Existing
stored dates and template-owned calculations are not rewritten by opening a form.

Both Expired Materials and About to Expire Materials accept header search by
material code/name. The optional month range combines with search on the server
before pagination. **Clear dates** keeps the search. Expired stays an expired-only
list; About to Expire keeps its existing three-month horizon. Date filters and
labels use effective validity, so an active extension is not listed as expired.

This is a coordinated backend/UI release. Apply the generated audit-table
migration through the normal reviewed database release process before using the
editor. No database migration, role assignment, customer stock correction, push
or deployment is performed by this implementation task.

## Verification

The focused backend suite covers date precedence, absent/elapsed extensions,
packaging isolation, usable shelf quantities, reservation and supply selection,
expired/soon search before pagination, live correction permission, migration
scope, stale-date rejection, audit persistence and governed QC retest release.
The SQL expression is checked with Npgsql translation without client evaluation.
Frontend tests cover combined filters, clearing dates while retaining search,
extended-stock issue eligibility, correction visibility, reason validation and
stale-save preservation. Final source metadata confirms the endpoint, request
and additive DTO fields match the imported contract.

Visual checks used isolated fixtures in the installed browser at 1280×720 and
854×480 (1280 at 150% scaling equivalent). All six list columns, shell header and
footer stayed visible with no page or table horizontal overflow; the date editor
kept its header/footer visible. 1366×768, native Windows display scaling and real
PostgreSQL contention still require staging/customer acceptance. No live customer
records were used in these checks.

Final local verification passed 30 focused backend tests, 26 frontend/access tests,
23 contract/cache/module-registry checks, the web and backend builds, API generation
consistency and EF's pending-model check. React Doctor reported no issues; the
mechanical UI detector also reported no findings. Existing dependency/bundle
warnings are outside this change. The audit migration is
`20261103123050_AddMigrationRetestDateAudit` and remains unapplied.

## Validity throughout stock screens

Shelf, rack and received-stock validity indicators use the API's
`effectiveExpiryDate`, as approved stock already does. Rack expiry counts and
material-location earliest-validity summaries use that same date. Original expiry
and retest dates remain available as recorded dates; the renderer does not grant
eligibility or replace server-side stock, quality or permission checks.
