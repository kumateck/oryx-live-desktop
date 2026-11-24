# BOM department units

Main materials and substitutes each load their own unit from the product department's material link. The existing `MaterialQuantityFields` selector defaults to that unit and offers its compatible family: mg/g/kg or mL/L. Counted units have no conversion dropdown. An entry-unit change changes the displayed amount; draft quantities remain expressed in the linked unit. Each substitute has its own independent dropdown and quantity.

Before saving, the editor reloads every main and substitute link and rechecks the existing Production or QA BOM permissions. Link changes, missing units and incompatible saved quantities refuse the save. Compatible older quantities are converted into the linked unit; a saved mg quantity is never silently relabelled as mL or pieces. Edit the line and explicitly enter the correct quantity to resolve that mismatch.

The unchanged request DTO sends quantities with their linked unit IDs. The companion backend independently validates each link and normalizes both unit and full-batch amounts to the family's smallest unit (mg or mL), storing the matching unit ID. This avoids needing an additional unit-catalog permission in the editor. Counted units retain their exact unit ID. Density conversion remains an explicit option, using verified density and its existing mg source.

Production reads convert these source quantities into stock units. Saving a product formula does not rewrite running batches; use the existing Repair BOM preview and apply flow after reviewing the corrected product. This change does not alter customer formulas, stock, reservations or requisitions directly.

No new permissions, endpoints, schemas or migrations are required. Existing Production and QA BOM add/edit/delete permissions remain separate and are checked for the actual section changes by the API and immediately before repository writes. Deploy the companion backend before the desktop change so non-smallest department units can be normalized correctly.
