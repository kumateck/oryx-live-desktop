# BOM density conversion

For a liquid raw material whose stock is counted in mL or L, first set that
department link's measured density under Materials. The unit catalog must
contain an active unit with the symbol `g/mL`. Enter the verified value for
that material in the **Density (g/mL)** field. A legacy value with a missing or
different unit is shown separately and stays intact during stock level edits.

On the product's BOM, enable **Convert BOM mg to stock volume using density**
for the relevant line and enter the BOM quantity in mg. The dialog previews the
converted full batch volume. Editing a saved line reloads the verified density
and lets you retry if the lookup fails. Production requirements and stock requisitions use
the department stock unit, while the BOM keeps mg and warehouse stock stays in
its linked volume unit.

Formula: `mL = mg ÷ (density in g/mL × 1,000)`. The 1,000 converts milligrams
to grams. The backend validates and snapshots the density and converted
quantity on each production batch. Older BOMs leave conversion off.

The feature requires the matching backend migration and API. See
`oryx-backend/docs/bom-density-conversion.md` for rollout and rollback
instructions.
