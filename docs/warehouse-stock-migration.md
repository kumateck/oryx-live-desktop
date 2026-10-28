# Warehouse stock: approved materials, location chart, material location

Frontend-only. No backend change. Rebuilt from `oryx-next` (`warehouse/approved-materials`, `warehouse/location-chart`, `warehouse/material-location`).

## Pages

| Page | Route | Module |
| --- | --- | --- |
| Approved materials | `/warehouse/approved-materials` | `modules/approved-materials` |
| Approved material | `/warehouse/approved-materials/:id/details` | `modules/approved-materials` |
| Location chart | `/warehouse/location-chart` | `modules/location-chart` |
| Material location | `/warehouse/material-location` | `modules/material-location` |
| Material's shelves | `/warehouse/material-location/:id/details` | `modules/material-location` |
| Distributed area | `/warehouse/distributed-area` | `modules/distributed-area` |
| Racks, Shelves | `/settings/racks`, `/settings/shelves` | `modules/racks`, `modules/shelves` |
| Stores, Locations | `/settings/warehouses`, `/settings/locations` | `modules/warehouses`, `modules/locations` |

Every page has a Raw / Packaging switch (`?type=0|1`). The switch only offers the kinds the user may see, and a kind the user may not see is never opened, whatever the address says.

## Permissions

| Action | Raw | Packaging |
| --- | --- | --- |
| Approved materials | `CanViewApprovedRawMaterials` | `CanViewApprovedPackagingMaterials` |
| Location chart | `CanViewRawMaterialLocationChartList` | `CanViewPackagingMaterialLocationChartList` |
| Material location | `CanViewRawMaterialLocationList` | `CanViewPackagingMaterialLocationList` |
| Move stock to another shelf | `CanReassignRawMaterialStock` | `CanReassignPackagingMaterialStock` |

Two corrections against `oryx-next`:

- Its material-location page checked the **location chart** view keys. The page has keys of its own, which the sidebar already uses; the page now checks those.
- Its move action checked `CanAssign…StockToShelves`, which is the permission for putting newly received stock on a shelf. Moving stock that is already shelved is the **Reassign** permission, which is what the backend lists under Locations.

A detail page reached by address checks the permission for the material's own kind, not the kind in the address.

## Approved materials

- List: material, **free to issue** (approved less reserved, red at zero), reserved for production, total approved. Paged and searched by the backend (header search).
- Detail tabs: stock by batch and shelf, bin card (header search filters it), reserved stock. Expiry dates are flagged when passed or within 60 days.

## Location chart

- Racks of the user's department on the left (`GET /warehouse/rack/by-department/summary`), the open rack in the address as `?rack=`.
- The open rack (`GET /warehouse/rack/{id}`): shelves in use, empty shelves named, batches, expired and expiring counts, and one table of every batch on every shelf, filtered by the header search (shelf, material, code, batch).
- `oryx-next` fetched a paged rack list and then each rack; this reads one summary and one rack.

## Material location

- List of the department's materials with warehouse stock, expired quantity, minimum / reorder / maximum levels and a status. `oryx-next` only had a picker, so stock problems could not be seen without opening each material.
- Status: at or under the minimum is **Critical**, at or under the reorder level is **Low stock**, otherwise **Optimal**. A material with no minimum and no reorder level is shown as **Levels not set** (`oryx-next` called these Critical when stock was zero and Optimal otherwise).
- Detail: total on shelves, earliest expiry, levels, and every shelf holding the material. Shelf records left at zero by an earlier move are not listed.
- The backend serves a material's levels only in the department list, so the detail page searches that list for the one material. If it is not found the levels are left out; nothing else depends on them.

## Moving stock

One dialog, used from both the location chart and a material's shelves. `POST /api/v1/material/batch/move/v2` (declared by hand: the backend's contract gives it no response type, so it is not generated).

Checked before anything is sent, matching `MoveMaterialBatchV2` on the server:

- at least one destination, each with a rack, a shelf and a quantity above zero;
- a destination cannot be the shelf the stock is on, and a shelf cannot be chosen twice;
- the quantities cannot add up to more than is on the shelf;
- only racks of the same kind of material in the user's department are offered, so the destination is always in the right warehouse.

Quantities are typed in the largest unit of the family (kg, L) and sent in the unit the shelf record is kept in, with that record's unit id, which the server requires. If the server refuses, the dialog stays open with its reason. After a move every shelf list (approved stock, rack, material shelves, stock levels) is read again through the shared `StockOnShelves` tag.

Differences from the `oryx-next` move form: it checked each line on its own but not the total against the shelf, nor the same shelf as destination, nor a shelf chosen twice, so those were only found by the server after submitting. It also refused any quantity under 0.1, which blocked moving small amounts; the only rule now is above zero.

## Putting received stock on shelves

`/warehouse/distributed-area` (`modules/distributed-area`). View: `CanViewDistributedRawMaterials` / `CanViewDistributedPackagingMaterials`. Shelve: `CanAssignRawMaterialsStockToShelves` / `CanAssignPackagingMaterialsStockToShelves`.

- Lists what has been delivered to the user's department store and is not on a shelf yet.
- **Put on shelves** uses the same destination rows as moving stock. The whole delivery is offered on the first line, and all of it has to be placed, on one shelf or several: the server closes the delivery as soon as anything is shelved, so a part left over could not be shelved later.
- `oryx-next` showed this action to anyone who could see the page; it now needs the assign permission, the one `oryx-next` had wrongly used for moves.

## Racks and shelves

`/settings/racks` (`modules/racks`) and `/settings/shelves` (`modules/shelves`). Permissions: `CanViewRacks`, `CanAddNewRack`, `CanEditRack`, `CanDeleteRack`; `CanViewShelves`, `CanAddNewShelf`, `CanEditShelf`, `CanDeleteShelf`.

- **Add rack**: location, name and first shelves. The name is suggested from the location (`G/03`: floor initial and the next number the location does not use) and shelf codes from it (`W/RM/G/03/A`). Two shelves on a rack cannot share a name or a code.
- **Edit rack**: name and description only, and **only when none of its shelves has a stock record**. The server saves a rack by replacing all of its shelves with new ones; on a rack in use that would cut its stock records off from their shelves. `oryx-next` allowed the edit on any rack. Shelves of a rack in use are renamed and added on the Shelves page, whose requests touch one shelf at a time.
- **Remove rack**: only when no shelf on it holds stock. **Remove shelf**: the shelf is read first, and one that holds stock cannot be removed. `oryx-next` had no removal at all (the code was commented out).

## Printing

Bin card (from the Bin card tab; up to 500 entries, narrowed by the search), location chart record (the open rack) and material location record. See [printing.md](printing.md).

## Stores and locations

- **Stores** (`/settings/warehouses`): add, edit and remove a store, with what it is used for. The server has a single permission for stores, `CanViewWarehouses`, so whoever may see stores may set them up. It needs its own add, edit and delete keys before these can be separated.
- **Locations** (`/settings/locations`): add, edit and remove a location in a store, each behind its own key (`CanAddNewLocation`, `CanEditLocation`, `CanDeleteLocation`). A raw, packaging or finished-goods store offers its fixed list of areas; other stores take a typed name.

The server saves a store by replacing its locations, and a location by replacing its racks. Saving or removing one that has children would remove them, with their shelves and the stock recorded on them. So a store can be changed or removed only while it has no locations, and a location only while it has no racks; the app says why otherwise. Racks follow the same rule (see above).

Receiving (checklists and goods received notes) is in [inbound-logistics-migration.md](inbound-logistics-migration.md).

## Tests

`modules/location-chart/lib/location.test.ts` (move rules, units, rack reading, stock levels) and `modules/location-chart/components/locations.test.tsx` (the five pages, permissions, the move flow and a refused move).

## Searchable shelving racks (2026-10-24)

The Rack field in the shared shelf destination row uses FormWizard's existing
searchable single select. Search filters the already loaded department racks
by their displayed location/rack label, ignoring case and surrounding spaces;
no extra endpoint or request is introduced. This applies to received stock,
transferred stock, returned materials and shelf moves that reuse the destination row. Changing a
rack still clears an incompatible shelf. Shelf choices, quantity validation,
permissions, audit metadata and stock writes retain their existing behavior.

Documentation updated: this warehouse stock note.

### Shelving component reuse

`PlaceStockDialog` is the common put-on-shelves dialog for distributed receipts
(via `ShelveStockDialog`), transfer allocations, and returned materials. Each
caller supplies its stock details, labels and `onPlace` API callback.
`MoveStockDialog` is a separate dialog for moving existing shelf stock, used by
Location Chart and Material Location. Both dialogs render the same `MoveLine`
fields, including the searchable Rack selector and dependent Shelf selector.
