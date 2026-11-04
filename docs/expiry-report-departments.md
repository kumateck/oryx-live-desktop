# Departments on material expiry reports

Expired and about-to-expire reports show a Department column for raw and packaging
stock, including searched results. It identifies the departments owning warehouses
with positive shelf stock or active reservations. A material's production-use
associations do not establish stock ownership. Duplicate department IDs collapse
to one label; missing ownership displays “Not recorded”.

The backend reads the authenticated user's current account for every report
request. An assigned department restricts records before search/date filtering,
counting and pagination. Warehouse filters cannot expand that scope. Shelves,
reservations, location summaries and department labels are restricted to that
department. Remaining quantity is its shelved stock; total quantity is its current
shelved plus reserved stock. Report quantity fields describe this current position,
not the original cross-department receipt or past movements. No inventory, original
batch data, workflow or audit history is modified.

Active users without an assigned department retain the existing cross-department
report, subject to CanViewExpiredMaterials or CanViewAboutToExpireMaterials. Missing,
disabled and deleted accounts are refused; role names do not bypass department
scope. The department and actor are not supplied as client query parameters.

Deploy the matching backend before the frontend. This is an additive
MaterialBatchDto.stockDepartments read field, imported with
`bun scripts/import-expiry-departments.ts EXPORT.json` from a built metadata-only
OpenAPI export, then regenerated with `bun run api:generate`. It needs no database
migration. Older backends remain readable and show “Not recorded”, but do not
provide the new department-isolation behavior.

## Printable stock count reports

Reports → Warehouse report offers **Current stock report** and **Expired stock
report** under the existing `CanViewWarehouseReport` permission. Choose a department
and raw/packaging material kind; leaving either selection empty includes all
allowed records. A department-linked account has a locked department selector,
backed by a fresh server-side account lookup. A foreign requested department is
refused. The response supplies the actual department header and generation time.

These are current physical snapshots, including positive shelf positions and
issued, unconsumed production reservations. Unissued holds remain on their source
shelves and are not counted again as production stock. Released, deleted and zero
positions are excluded. Quantities with different unit IDs remain separate rows;
there is no unsafe addition across units. The expired report uses existing
effective-validity rules while preserving original expiry and retest dates.

Both reports use **Material | Batch | Source | Dates | Quantity | Physical count |
Remarks**. Related values stack as requested: name/code; batch/AR; manufacturer/
supplier; manufacture above expiry–retest. The last two columns stay blank for
handwriting. A4 landscape print includes the full snapshot, repeated department
and column headers, unsplit rows with at least 14mm writing space, and count/check
signature lines. Long names wrap rather than being truncated. Screen pagination
does not limit print/export. Printing does not post inventory adjustments.

The additive `GET /api/v1/material/batches/stock-report` and its typed read models
are imported by the same scoped importer. Existing reports and historical queries
keep their contracts. The exact reviewed source contract is
`f38dceee6e53dc16783197bce0ceb9d36b902f2d1d0b5185a77a1698adec5e9f`;
previous compatibility approvals are retained. Deploy the companion backend first.

## Schedule batch search

The schedule detail's product/batch sidebar has a compact search field. Matching a
product name or code shows all its batches; matching a batch number shows that
batch. Matching is case-insensitive and ignores surrounding whitespace. Filtering
preserves original fallback batch numbers and the open detail; clearing restores
the list. No new API, permissions or workflow writes are involved.
