# Production material forecast (warehouse)

`/warehouse/production-forecast` shows the signed-in user's department's production
schedules for a chosen month and, per product (product, batch size and packing
style), the raw and packaging materials the planned batches need.

For each material:

| Column | Meaning |
| --- | --- |
| 1 batch | Quantity one batch of this product needs, in the material's department unit. |
| All batches | Total for every planned batch of the product in the month. |
| Already reserved | Stock already reserved for, or issued to, those batches. |
| Can satisfy | Already reserved plus the free stock shared out to these batches. "Free in store" is the department's usable, unreserved stock before sharing out. |
| Batches covered | Whole batches whose need for the material is fully covered. |
| Shortfall | All batches minus can satisfy. Short rows are highlighted. |

Rules come from the backend's production start logic, not new formulas:

- Requirements: the product's active BOM or packing-style packaging
  (`ProductionMaterialSources.Load`), or a started batch's applied configuration.
- Usable stock: approved lots on the department's raw or packaging storage shelves,
  valid under `MaterialValidity` (no expiry date never expires; a retest date makes
  stock usable), minus every unissued reservation.
- Free stock is shared out to batches in schedule order, so a material used by
  several products is not counted twice.
- A batch is covered when all of a kind's materials are covered. Packaging that
  cannot be forecast (for example no packing style) is listed as a note, not as covered.

Access: backend permission `CanViewProductionScheduleMaterialForecast` (Warehouse →
Production Material Forecast). The backend rechecks it, and the user's department,
before returning data. The desktop module manifest and sidebar entry use the same key.
