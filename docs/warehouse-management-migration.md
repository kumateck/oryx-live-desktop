# Warehouse management

Frontend-only. No backend change. Rebuilt from `oryx-next` (`components/pages/supply-chain/warehouse/*`). Receiving, quarantine, the distributed area, approved materials and stock location are in [inbound-logistics-migration.md](inbound-logistics-migration.md) and [warehouse-stock-migration.md](warehouse-stock-migration.md).

## Pages and permissions

| Page | Route | View | Act |
| --- | --- | --- | --- |
| Materials | `/warehouse/materials`, `/:id/details` | `CanViewRawMaterials` / `CanViewPackagingMaterials` | `CanCreateNew…Materials`, `CanEdit…Materials`, `CanDelete…Materials` |
| Linked materials | `/warehouse/materials/linked` | `CanViewLinked…Materials` | `CanEditLinkedRawMaterials` (packaging: `CanLinkPackagingMaterials`), `CanUnlink…Materials` |
| Unlinked materials | `/warehouse/materials/unlink` | `CanViewUnlinked…Materials` | `CanLink…Materials` |
| Rejected area | `/warehouse/rejected-area` | `CanViewRejected…Materials` | – |
| Issue stock requisitions | `/warehouse/stock-requisition`, `/:id` | `CanView…MaterialRequisitions` | `CanIssue…MaterialRequisitions` |
| Extra material requisitions | `/warehouse/extra-material` | `CanIssue…MaterialRequisitions` | same |
| Material returns | `/warehouse/material-returns`, `/:id/details` | `CanViewMaterialsReturnNote` | `CanAssign…MaterialsStockToShelves` |
| Expired / about to expire | `/warehouse/expired-materials`, `/warehouse/about-to-expire-materials` | `CanViewExpiredMaterials` / `CanViewAboutToExpireMaterials` | – |
| Stock transfers | `/warehouse/stock-transfer-requests`, `/:id/details` | `CanView…MaterialTransferList` | `CanIssue…MaterialStockTransfers` |
| Transferred stock to shelve | `/warehouse/stock-transfer-requests/allocation` | same | `CanAssign…MaterialsStockToShelves` |
| Swap requests | `/warehouse/swap-requests`, `/:id/details` | `CanIssue…MaterialRequisitions` | same, for the store that is asked |
| Stock adjustments | `/warehouse/stock-adjustments`, `/new`, `/:id` | `CanViewMaterialStockAdjustment` | `CanCreateMaterialStockAdjustment` |

"…" stands for Raw or Packaging: each kind has its own key, the switch only offers the kinds the user may see, and a page reached by address checks the key for the record's own kind.

## What each page does

- **Materials.** The master list. Add and edit in a dialog; the code is suggested from the numbering rule plus the first letter of the name (raw) or of the category (packaging), and can be changed. Delete is refused for a material with stock.
- **Linked materials.** What the user's department keeps, with minimum, re-order and maximum levels and where the stock stands against them (free stock, after what is reserved). Levels are changed in a dialog; unlinking is refused while the store holds stock.
- **Unlinked materials.** Materials the department does not keep yet; linking one sets its unit and levels.
- **Rejected area.** Batches quality control rejected, with the reason.
- **Issue stock requisitions.** Requisitions raised to the user's store. The page shows each material with the batches set aside for it; **Issue stock** asks for confirmation. Issue is held when the requisition is not approved, already issued, has no stock set aside, or a batch has expired. Prints as a voucher.
- **Extra material requisitions.** Extra material asked for on a batch under way, with the batches picked; issue after confirmation.
- **Material returns.** Notes of material sent back from production. Each line is put back on shelves, the whole quantity at once.
- **Expired / about to expire.** Batches whose expiry date falls in a chosen period (this month by default), with their shelves and what is left, paged.
- **Stock transfers.** What other departments ask this store to supply, and what this store has asked for. A transfer to supply shows the batches picked and is issued after confirmation.
- **Transferred stock to shelve.** Stock issued to this department by transfer, put on shelves the whole quantity at once.
- **Swap requests.** Requests to swap batches between two stores so older stock is used first. The store that is asked approves or rejects; the store that asked can only watch.
- **Stock adjustments.** A count that differs from the system, line by line (one batch on one shelf each), sent for approval. Stock changes only when the adjustment is approved.

## Changed from oryx-next, and why

| oryx-next | Now | Why |
| --- | --- | --- |
| "Issue" on an extra material request, and on a transfer, fired at once. | Each asks for confirmation. | Stock leaves the store; it should be deliberate. |
| A transfer could be issued whatever its status. | Only an approved transfer that is not yet issued, with batches that cover it and none expired. | The server checks only that the batches hold enough. |
| The transfer list did not reload when its tab changed, and needed both the raw and the packaging permission. | It reloads, and shows the kinds the user may see. | A missing dependency, and an "and" that should have been "or". |
| The rejected area read fields the server does not send, and its kind filter used a parameter name the server ignores. | It shows the material, batch, supplier, quantity, reason and date the server does send, and filters by kind. | The page showed mostly empty cells. |
| Expired and about-to-expire lists always showed the first page. | Paged. | Batches beyond the first page could not be seen. |
| "Material created" was shown without reading the server's answer. | A failure is shown. | A duplicate looked as if it had been added. |
| Swap approve and reject were offered in both directions. | Only to the store that is asked. | The asking store should not approve its own request. |
| A stock adjustment could repeat a line, or record a count equal to the system's. | Both are refused; "Other" needs a note. | Neither is an adjustment. |
| Unlinked materials were linked in one long virtualised form. | One material at a time, in a dialog. | Levels are set per material; a wrong value in a long form was easy to save. |

## Known limits (server behaviour)

- Saving a material replaces every field, and the server does not send back the material's own re-order level, so an edit resets that one field as it does in `oryx-next`. The levels that matter are the department's, on the linked page.
- The server has no edit key for linked packaging materials; whoever may link packaging may change its levels.
- Stock and stock levels are kept in the smallest unit of the unit's family, as `oryx-next` writes them.
- Transfers and holding stock are not filtered by kind on the server for the "to supply" list; rows of a kind the user may not see are left out on the page, so a page can show fewer rows than its size.

## Not migrated

- **Products allocation** (`/warehouse/products-allocation`). In `oryx-next` this screen is non-functional: its own code notes that it feeds one record type into another's columns and links to a page that does not exist. There is nothing sound to carry over.
- Stock adjustments for general-store items and finished products.
- Batch approve/reject from a goods received note (quality control).

## Tests

One test file per module under `modules/{stock-issue, extra-material-issue, stock-transfers, expired-materials, materials, swap-requests, stock-adjustments}`: the rules of each page, permissions by kind, nothing written before a confirmation, and request bodies.

## Earlier batches in other stores (raising swap requests)

On a stock requisition that has not been issued or rejected (`modules/stock-issue`: `lib/alternative-batches.ts`, `hooks/use-raise-swaps.ts`, `components/{alternative-batches,swap-review-dialog}.tsx`). `oryx-next` called this the Alternative Batch Summary.

- `GET /requisition/{id}/alternative-batches` gives, per material, the batches set aside and batches in other stores. Each batch set aside is paired with batches that expire on an earlier day, soonest first, each only up to what it holds.
- Anyone who can open the requisition sees the list. Choosing and asking for swaps needs the issue permission for that kind (`CanIssue…MaterialRequisitions`); the server has no key of its own for swaps.
- Chosen swaps are read back in a dialog; nothing is sent before **Ask for n swaps**.
- Each swap is its own request, sent in order. Before each, the material's shelves are read again (`GET /material/{id}/shelf`) and the swap is held back if either batch has left its shelf or holds less than the swap needs. Swaps that could not be asked for stay chosen with the reason; the rest are confirmed.

| `oryx-next` | Now | Why |
| --- | --- | --- |
| Merged every chosen row between two stores into one request. | One request per pair of batches. | The server allows a material once on each side of a request, so two batches of one material failed together. |
| Sent all requests at once and reported only counts ("failed: 2"). | In order, with the reason for each one that was not asked for. | A part-done run has to say what happened. |
| Stock already in a waiting swap was offered again on the reserved side. | What the store has already asked for (waiting swaps, asked by us) is taken off before pairing, and a line links to them. | The same stock could be asked for twice. |
| Did not check the shelves' current quantities. | Checked just before sending. | The other store may have used the batch since the page was opened. |
| Shown to everyone, including after issue. | Asking needs the issue permission; not shown once issued or rejected. | The server refuses a swap for an issued requisition. |
| The total in the preview added quantities of different materials and units. | Each swap shows its own quantity in the material's unit. | The sum meant nothing. |
