# Planned products: list page

`/production/products` (same address as Oryx Next), permission `CanViewPlannedProducts`, production departments only.

| Oryx Next behavior | Desktop |
| --- | --- |
| Server-paged list of the user's department's products, searchable | `ServerDataTable`, 50 per page, search by name or code |
| Product, classification, production, regulatory, quality columns | Same columns; quantities use the shared unit helper (`shared/units`) |
| "Check" action (`CanVerifyProduct`) | "Verify" button, shown only to permitted users and only while the product is unverified |
| Create (`CanCreateNewProductionPlan`) | Link to `/production/products/create` |
| Production-department-only page | Access rules can now require a department type; the session carries the user's department ID and type |

Differences: the department filter is required, so a user without a department sees an explanation instead of every department's products. A failed verification shows the server's reason in a toast.

Not yet migrated: the product detail page (`/production/products/:id/details`), create, and the edit tabs (info, BOM, packaging, packing order, packing style, spec, STP, procedure, ARD). Their sidebar and row links open the "not in the desktop app yet" page until built. Verification with real backend data is pending.
