# Production schedules migration

Module: `apps/web/src/modules/schedules`. Pages under `/production/schedules`. Shown to production departments with `CanViewProductSchedules`; creating needs `CanCreateProductSchedule` and editing `CanEditProductSchedule`.

## Migrated

| Page | Path |
| --- | --- |
| List | `/production/schedules` |
| Create | `/production/schedules/create` |
| View | `/production/schedules/:id/details` |
| Edit dates and remarks | `/production/schedules/:id/edit` |
| Add products | `/production/schedules/:id/products/add` |
| Remove products | `/production/schedules/:id/products/remove` |

A row in the list opens the schedule. The row menu and the "Manage schedule" button on the schedule page offer the same actions, each behind its own permission (`CanEditProductSchedule`, `CanAddProductsToProductSchedule`, `CanRemoveProductsFromProductSchedule`). On an ended schedule they stay listed, switched off, with the reason.

Kept from Oryx Next: the list columns (code, products, start, end), batches of the same product and size counted together, the create form (code, dates, remarks, and product lines with batch count, batch size, packing style, and market type), one schedule product per batch, the batch quantity taken from the product's full batch size (halved for a half batch), and an ended schedule being closed to changes.

Improved:

- **Dates are checked the way the server checks them, before sending.** A date is the start of its day, so an end date of today has already passed and the server refuses it. Oryx Next let the user pick it and showed the server's error afterwards.
- **Editing explains the server's rule.** The server only accepts a change when the start date is after today. For a schedule that has already started the page says so, instead of failing on save.
- **The packing style follows the product.** Changing the product clears the packing style and picks the new product's default. Oryx Next kept the previous product's style, which the server could then save against the wrong product.
- **A product with no full batch size cannot be scheduled.** Oryx Next sent a quantity of 0.
- **Batch quantities are shown on each line** as the product, batch size, and count are chosen, with no extra request per product on save.
- **At least one product and one batch.** Oryx Next accepted a count of 0, which added nothing, and a schedule with no products.
- **The code is suggested and can be changed**, and a code already in use is reported on the code field. Oryx Next said the code could not be changed while leaving it editable.
- **The list shows each schedule's state** (upcoming, in progress, ended), and the menu says why an ended schedule cannot be edited.
- **Market types failing to load does not block the form**; the field is optional and the page says why it is empty.
- **Leaving with unsaved changes asks first.**

### Material forecast

Each product line has a Forecast button. It shows what the chosen batches need of every raw and packaging material against warehouse stock, using the same endpoint as Oryx Next.

- **Short materials are listed first, with how much is missing.** Oryx Next showed "Unavailable" with no amount.
- **A line above the tables says how many materials are short**, or that there is enough of everything.
- **Reserved stock is shown.** The server returns it but does not deduct it when deciding availability; Oryx Next did not show it.
- **The button says what it is waiting for** (product, packing style, batch count) instead of showing an error after it is pressed.
- **A failed load shows the reason with Retry.** Oryx Next showed two empty tables.
- **Materials that are neither raw nor packaging are still listed.** Oryx Next dropped them.

The server counts a material as available only when usable stock is more than what is needed, so exactly enough is shown as short with "nothing to spare".

## View

One page for the schedule and all its batches. Kept from Oryx Next: the schedule's dates and remarks, each batch's status, product facts, raw and packaging material tables, and starting production when the materials are there.

Improved:

- **Batches are a list beside the open batch**, grouped by product, each with its state. Oryx Next used two rows of scrolling tabs (products, then batches) with arrow buttons.
- **The open batch is in the address** (`?batch=`), so it survives a reload and can be linked. Oryx Next always reopened the first batch.
- **One request per batch opened.** Oryx Next loaded the production run of every batch of the product to label the tabs.
- **One rule for "enough stock".** A material is covered by what is reserved for the batch plus warehouse stock not reserved by any batch. Oryx Next used that rule for the Start button but a different subtraction for the stock column, so the two could disagree.
- **Short materials are listed first with how much is missing**, and the page says how many are short and why Start is off.
- **Start production asks first**, and says the batch can no longer be removed afterwards. It stays off until both material lists have loaded.
- **A material listed twice** (a substitute beside its parent) keeps both rows.
- **A batch not started before the schedule ended** is marked as such and cannot be started.

## Add products

The same product lines as on the create form, with the forecast. Kept: what is already on the schedule is shown above the form.

- **The form holds only product lines.** Oryx Next reused the whole schedule form with a hidden placeholder code and today's dates to get past validation.
- **Returns to the schedule**, where the new batches are, and says how many were added.
- All the product-line improvements from Create apply (packing style follows the product, batch quantities shown, at least one batch).

## Remove products

Batches grouped by product, size, packing style, and market. Kept: tick batches, or "take off N" to select the first N removable ones; batches in production or cancelled are locked.

- **Removal is confirmed**, listing exactly which batches go.
- **Batches are named** by batch number where they have one; Oryx Next called them "Row 1", "Row 2".
- **A refused batch shows the server's reason and stays selected.** Oryx Next reported only a count of failures and cleared the selection.
- **"Take off N" replaces the group's selection** and can be cleared. In Oryx Next each press added to it.
- **Requests go one at a time**, so the server is not sent many deletes for one schedule at once.

## Also on the schedule pages

A running batch opens its production board from the schedule page; see `production-board-migration.md`.

- **Purchase requisition from a short batch** (`components/detail/raise-shortage-requisition.tsx`).
- **All other stock**: the figure opens where the material is held, store by store and on production floors, and what is on its way in (`shared/stock/stock-availability-dialog.tsx`, shared with requisitions).
- **Monthly report** `/production/schedules/monthly-report` (`components/monthly-report.tsx`, `lib/monthly-plan.ts`): every batch of a schedule that runs during the month except cancelled ones, grouped by market, product and packing style, with expected batches (a half batch counts half), unit price, expected yield from the packing style, shippers and loose packs, and a grand total. Moving between months does not ask the server again. Printable.
  - The server cannot filter schedules by date, so every page is read once (250 a page), as Oryx Next does.
  - **The schedule endpoints do not send a batch's market** (neither the list nor the detail includes it), so Oryx Next grouped every batch under "Unspecified market". The page groups such batches under "No market recorded" and says why.
  - Shipper and loose totals are given only when every row has them, rather than a short total.
- Product flow and product requisition pages are not carried over: nothing in Oryx Next links to the flow page, and the requisition page is replaced by the shortage requisition above.

Backend behavior worth knowing (unchanged, shared with Oryx Next): the update endpoint accepts only the dates and remarks; the code and products sent with it are ignored. A batch that has started cannot be removed.
