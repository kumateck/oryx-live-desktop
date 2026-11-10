# BOM density conversion

For a liquid raw material whose stock is counted in mL or L, first set that
department link's measured density in g/mL under Materials. Use the value
measured for that material; the reported 1.35–1.56 g/mL range is not a value to
apply to every material.

On the product's BOM, enable **Convert BOM mg to stock volume using density**
for the relevant line and enter the BOM quantity in mg. The dialog previews the
converted full-batch volume. Production requirements and stock requisitions use
the department stock unit, while the BOM keeps mg and warehouse stock stays in
its linked volume unit.

Formula: `mL = mg ÷ (density in g/mL × 1,000)`. The 1,000 converts milligrams
to grams. The backend validates and snapshots the density and converted
quantity on each production batch. Older BOMs leave conversion off.

The feature requires the matching backend migration and API. See
`oryx-backend/docs/bom-density-conversion.md` for rollout and rollback
instructions.
