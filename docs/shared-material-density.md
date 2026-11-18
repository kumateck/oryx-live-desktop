# Shared material density and stock transfers

A verified density in g/mL is now stored on the material, shared by department links. Department stock units remain independent. Editing the measurement through the linked-material dialog requires the matching density permission in addition to existing link/edit access. The backend records the old/new measurement and actor in append-only history. Stock-level-only edits retain saved densities. The migration backfills only unambiguous positive measurements explicitly tagged with an active g/mL unit; untagged or conflicting measurements are not guessed. Older department measurements remain readable until a shared verified measurement is supplied.

Mass-to-volume and volume-to-mass internal transfers use the material density. Preview and issue use free approved physical shelf stock after reservations. Issue stores the source quantity/unit, request quantity, receiving quantity/unit and density adopted at issue. Receipt uses that saved conversion, requires the whole held lot in its receiving unit, verifies the actor's department and receiving shelves, and refuses repeated receipts. Split receipts distribute the exact original physical quantity across shelves, with the remainder assigned to the last shelf.

The lot and inventory ledger keep their original unit, avoiding mixed quantities within one lot. The holding view and receipt form use the receiving warehouse's saved unit. Warehouse shelf totals and linked-material reports convert using the material's shared density. Future BOM/source calculations use shared density; adopted production requirements and reservations retain their captured density so later edits do not change approved issue quantities. Reservation/forecast/report checks use those adopted measurements.

Deploy the companion backend and `AddSharedMaterialDensity` migration first. Two new keys under Warehouse / Linked Materials are `CanEditRawMaterialDensity` and `CanEditPackagingMaterialDensity`. The migration grants them, with matching access types, to roles holding `CanLinkRawMaterials` and `CanLinkPackagingMaterials` respectively so existing density editors retain access. Existing link/edit and stock-transfer issue permissions remain required. No live grants or stock changes are performed by development checks.

The OpenAPI change adds optional read fields only. Import with `bun scripts/import-shared-density.ts EXPORT.json`, then generate/check. Reviewed digest `54d15fbce18e5e1cf519c483f27d83da4960f8f6e41863cad71992a213d7d326`; removing exactly the eight new properties reproduces `8740d299…33f4b`.

Verification covers conversion in both directions, shared density permissions/audit, production reservations in a different physical unit, retained adopted density, duplicate receipt prevention, existing transfer concurrency, and PostgreSQL migration/grants/audit triggers. UI tests cover deny/allow density controls and receiving quantities. A rendered-browser check could not run because local browser access is unavailable for this chat.

The combined import with merged Unstart reservation operations has reviewed digest `e9f0e6838046b0db5121ed1611371bd6f8096c611c37a2eb22c0a9649e4bdcaa`. Removing the eight density fields reproduces the Unstart reservation digest; removing just the four reservation paths and four owned schemas reproduces the original density digest. Both predecessor reviews remain checked.

## Supplying store's unit (2026-11-18)

The supplying store reads an incoming transfer in its own stock unit: the list, the detail page, the picked batches and the issue confirmation show the backend's optional `supplierQuantity`/`supplierUoM` (for example 20,720 kg), with "Asked as 20,000 L" beside it. The issue request still sends the request-unit quantities, and the receiving store shelves in its own unit as before. Without those fields (older backend) the request quantity is shown. These are read through the module's zod schema only; the OpenAPI contract is not re-imported for these optional read fields.

The pending-approvals list for stock requisitions adds a Production batch column from the optional `batchNumber`/`productName` fields.
