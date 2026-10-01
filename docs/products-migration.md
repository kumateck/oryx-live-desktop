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

## Product detail

`/production/products/:id/details`. A header (code, creation, name, category, division, verification state, Verify and Edit for permitted users), summary groups, and eight tabs. The open tab is in the address (`?tab=`), so it survives reload and can be linked.

| Tab | Source | Notes |
| --- | --- | --- |
| Active BOM, Outdated BOMs | Product record | Batch quantity = material per composition unit × (batch size ÷ composition size) |
| Packaging, Packing styles | Product record | |
| Procedure | `GET /product/{id}/routes` | Loaded when the tab is opened |
| Product STP, Specifications, ARD | Analytical endpoints | Loaded when the tab is opened |

### Improvements over Oryx Next

- **Outdated BOMs show their materials.** Oryx Next listed only the version header for each.
- **"Label claim" shows the label claim.** Oryx Next showed the description in that row.
- **The ARD tab's STP column shows the STP number.** Oryx Next printed the test stage under that heading; stage now has its own column.
- **Packaging rows are numbered from 1**, not 0.
- **Saved rich text is rebuilt from an allowlist of elements** (`RichTextView`), so scripts, event handlers, and unsafe links in stored content cannot run.
- **Price is shown with its own unit**, not a hard-coded `$`.
- **A missing or zero composition size shows a dash** instead of an infinite batch quantity; the backend's unset date (`0001-01-01`) shows as no date.
- **Packing units and responsible people are listed in the row.** Oryx Next hid them behind hover cards that keyboard and touch users could not open.
- **A tab whose endpoint answers 404 is an empty tab**, not an error; a real failure shows the reason and a Retry.
- **"Not found" and "could not load" are different messages**; only the second offers Retry.
- **Tabs work from the keyboard** (arrow keys) and are announced as tabs.

Shared pieces added for later modules: `shared/detail` (`DetailGroup`, `DetailItem`, `Tabs`, `useTabParam`), `shared/format` (dates, words), `shared/rich-text/rich-text-view.tsx`.

## Not yet migrated

Create (`/production/products/create`), the edit tabs (info, BOM, packaging, packing order, packing style, spec, STP, procedure, ARD), and the print preview. Their links open the "not in the desktop app yet" page until built.
