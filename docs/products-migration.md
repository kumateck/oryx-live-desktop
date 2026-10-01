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

## Edit: packing style

`/production/products/:id/edit/packing-style`. The backend replaces a product's whole set of packing styles in one request, so adding, editing, and removing are kept as a draft on the page until "Save packing styles"; the page says when there are unsaved changes, can discard them, and asks before the user leaves.

- **A renamed style is updated, not replaced.** The backend matches a style by ID, or by label when no ID is sent. Oryx Next sends no ID, so renaming makes the backend add a new style and delete the old one, which it refuses when the old one is used in batch packaging records. The desktop sends the ID.
- **Labels must be unique**, since unsaved styles are matched by label.
- **Exactly one default.** Marking a style default clears the others; removing the default hands it to the first remaining style.
- **Expected yield is suggested, not overwritten.** The dialog offers "A full batch fills about N base packs" with a button to use it. Oryx Next recalculated the field whenever the dialog opened, replacing a yield that had been entered by hand.
- **Packing units** need at least one row, a unit and a positive quantity in each, and no unit twice; their order is saved.
- **Removal is confirmed**, and the dialog says the backend refuses styles used in batch packaging records; its reason is shown if the save fails.
- **If units of measure cannot be loaded**, the page says so with Retry, and adding is disabled rather than offering empty pickers.

## Edit: bill of materials

`/production/products/:id/edit/bom`. The formula's raw materials in step order, on the draggable table: drag a row (or use the keyboard) to change its step. Add and edit open a dialog; everything is a draft until "Save bill of materials", which creates the next version.

- **A material's unit, function, and specification are shown as soon as it is chosen**, with its quantity for a full batch. The specification number comes with the material; Oryx Next made one extra request per line to fetch it every time the page loaded.
- **A material can be in the formula once**, cannot be its own substitute, and needs a unit of measure; each problem is explained in the dialog.
- **An empty formula cannot be saved**, and the reason is shown on the page rather than in a passing toast.
- **Steps are numbered by position when saving**, so the saved order always matches what is on screen.
- **Archive asks first** and says what it does: the product is left with no active formula. It is offered only for the saved formula, not while there are unsaved changes.
- **A product with no formula shows an empty list**, not an error.
- **After saving the user stays on the page.** Oryx Next jumped to the packing materials section.

Backend behavior worth knowing (unchanged, shared with Oryx Next): saving a bill of materials deletes the product's earlier versions before adding the new one, so the detail page's "Outdated BOMs" is empty after any save; only an archived formula that has not been saved over remains.

## Packing materials

`/production/products/:id/edit/packaging`. Kept from Oryx Next: the fields (component material, packing style, prescribed quantity, packing allowance), the rule that a material is listed once for all packing styles or once per style, and saving the whole list in one request.

Improved:

- **Nothing the page does not edit is lost.** The backend deletes every packing material and re-adds what is sent. Oryx Next sent only its own fields, so a line's thickness, other standards, linked material, and substitutes were erased by any save. The desktop sends them back unchanged.
- **Edits are a draft until saved**, with "Discard changes" and a warning before leaving with unsaved changes.
- **The table appears at once.** Oryx Next waited for one specification request per line before showing anything. Here each specification cell fills in on its own, and a material just chosen shows the number it came with.
- **Conflicts are explained on the material field** in the dialog (already listed, listed for all styles, listed per style) rather than in a toast.
- **Quantities follow the units rule:** prescribed quantity and allowance are shown as entered; the total is calculated and capped at four decimals.
- **The allowance cannot be negative and the prescribed quantity must be above zero**, checked before the line is added.
- **Only saved packing styles can be chosen**, since a line needs the style's ID. With none saved the field says so.
- **An empty list cannot be saved**, with the reason on the page. **After saving the user stays on the page**; Oryx Next jumped to Procedure.

## Procedure

`/production/products/:id/edit/procedure`. Kept from Oryx Next: steps made of an operation, work centers, estimated time, a critical/automated flag, and responsible users and roles with an instruction each; drag to reorder; one operation per procedure; the rule that an automated step cannot carry a main instruction; copying the procedure to other products.

Improved:

- **A responsible party must be complete.** Oryx Next accepted a row with no user or role chosen and silently dropped it when saving. The desktop asks for the user or role and the instruction, and refuses the same person with the same instruction twice.
- **Analytical raw data stays with ATR.** It is offered only for the ATR instruction and is cleared when the instruction changes; Oryx Next kept sending a value left over from an earlier choice.
- **Copying does not leak this product's analytical raw data** onto other products; the review step says so. Oryx Next copied the IDs as they were.
- **Copying says what it does.** The backend replaces the target's whole procedure, so the confirm button reads "Replace procedure on N products" under a warning. Each failure is listed with the server's reason, not only the product name.
- **Only the saved procedure can be copied**, so another product never receives steps this one does not have yet.
- **Edits are a draft until saved**, with "Discard changes" and a warning before leaving. The step order is renumbered from the rows on screen when saving.
- **Validation messages appear on the fields** when the step is submitted; the Add button is not silently disabled.
- **Load failures are shown with Retry.** Oryx Next logged them to the console and showed an empty table, which a save would then have written over the real procedure.
- **A product without a department** gets an explanation (operations are listed by department) instead of an empty operation list.
- **After saving the user stays on the page**; Oryx Next jumped to STP.

Backend behavior worth knowing (unchanged): saving deletes every step and re-adds the list, keeping one step per operation. Step resources are not returned by the read endpoint and neither app sends them, so they do not survive a save.

## Not yet migrated

Four edit sections (specification, STP, ARD, packing order) and the print preview. In the edit area they are listed but cannot be opened yet.
