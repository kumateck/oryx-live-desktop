# BOM substitutes with their own quantity

A BOM line may list substitute materials. A substitute is not always used one for one: the main material
can contain water while the substitute is its dry form, so less of the substitute is needed. Each
substitute therefore has its own quantity.

## Product BOM

- Choosing substitutes in the BOM material dialog adds one quantity field per substitute: how much of the
  substitute replaces the material in one composition unit, in the substitute's own department stock unit.
  When the line converts mg with density, the substitute's quantity is also entered in mg and converted
  with the substitute's own density.
- The full-batch quantity is calculated from that quantity, the same way as for the main material.
- Substitutes saved before quantities existed show "quantity not set". The BOM cannot be saved again until
  each one has a quantity. Production never uses such a substitute; it never borrows the main material's
  quantity.

## Production start

The batch reserves the main material when it is fully in stock. When it is short, the batch starts on the
first substitute (in BOM order) that is fully in stock, at the substitute's own quantity. The start is
refused only when no option of the line is fully in stock. Every option is pinned with the batch's
configuration, so later BOM edits do not change what the store can choose for that batch.

## Issuing (warehouse)

The raw-material stock requisition page shows **Material to issue** for each line with substitutes. For
every option it shows the quantity needed, the usable unreserved stock in this store, the earliest expiry
and the batches it would be issued from. The option with enough stock that expires first is marked.

The store issues exactly one option per line. **Issue … instead** asks for a reason and then, in one
transaction on the server:

- releases the batch's reservation of the current material and reserves the chosen one at its own
  quantity (earliest expiry first);
- rewrites the requisition line to the chosen material, quantity and unit;
- records who chose, when, from what, to what, and why (`StockRequisitionMaterialChoices`) and logs it on
  the production activity.

The choice is refused when the chosen material is short, when the batch's materials changed since the page
loaded, or once anything was issued or consumed. The requisition and its voucher show "Substitute for …"
on a line issued as a substitute.

## Permissions

| Task | Key |
| --- | --- |
| See the material options | `CanViewRawMaterialRequisitions` |
| Change the material issued | `CanChooseRawMaterialRequisitionSubstitute` (new; granted by migration to every role holding `CanIssueRawMaterialRequisitions`) |

## Contract

Imported with `bun scripts/import-bom-substitute-quantities.ts EXPORT.json` from the companion backend's
metadata-only export: `GET`/`POST /api/v1/requisition/{requisitionId}/material-options`, five owned
schemas, and optional fields on `BillOfMaterialItemSubstitute`, `BillOfMaterialItemSubstituteDto`,
`CreateBoMItemsRequest` (`substitutes`) and `RequisitionItemDto` (`substituteFor`). Typed digest
`6c84e6f93d57882923dc0cc61a6e7df1649371ab08a8b34ccd287150105b9806`; removing exactly these additions
reproduces `3e3337d5…3b33`. Apply the backend migrations `AddBomSubstituteQuantities` and
`GrantChooseRawMaterialRequisitionSubstitute` and deploy the backend before the desktop.
