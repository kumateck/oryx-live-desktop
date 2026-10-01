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

## Create and edit

`/production/products/create` (`CanCreateNewProductionPlan`) and `/production/products/:id/edit/info` (`CanEditProductionPlan`), both for production departments. They share one form: product information, units and quantities, specifications, manufacturing and compliance, and label claims.

### What Oryx Next does, and what changed

- **Quantities are entered in the base unit, and the form now says so.** Oryx Next's code converts the batch size from the largest unit before saving, but it looks the unit up by the picker's label ("Millilitre (ml)") instead of its symbol, so the conversion never runs and the number is saved as typed. The desktop keeps that saved meaning and shows a live line under the fields: "Enter quantities in ml. Full batch: 1,500 L. That is 300,000 composition units per batch."
- **The full batch cannot be smaller than one composition unit**, and quantities and price must be greater than zero.
- **The product code is suggested once, not overwritten.** It comes from the configured rule and the count of existing products. "Suggest again" re-reads it. Two people creating at once can be offered the same code; the backend decides whether it is accepted, and its message is shown.
- **After creating, the user lands on the new product**, where its other records are added. Oryx Next went back to the previous page.
- **Leaving with unsaved changes asks first** (links, sidebar, back, closing the window). Oryx Next discarded edits silently.
- **The edit form starts from the saved product in one step** and keeps what the user typed after a save. Oryx Next set 20 fields one by one after loading and refetched after saving.
- **If the form's lists fail to load, the page says so and offers Retry.** Oryx Next logged the error and showed empty pickers.
- **Empty optional text is sent as empty, never as the text "undefined"**; a missing price or department is left blank for the user rather than filled with zero.
- **Label claims** are saved in the product's description field, as in Oryx Next, and the detail page shows them under that name.

Shared pieces added: `shared/codes` (code rules), `shared/navigation/unsaved-changes.tsx`, `shared/skeleton`.

## Not yet migrated

The other eight edit sections (specification, packing style, bill of materials, packing materials, procedure, STP, ARD, packing order) and the print preview. In the edit area they are listed but cannot be opened yet; they total about 8,000 lines in Oryx Next and are the next work for this module.
