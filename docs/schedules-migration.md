# Production schedules migration

Module: `apps/web/src/modules/schedules`. Pages under `/production/schedules`. Shown to production departments with `CanViewProductSchedules`; creating needs `CanCreateProductSchedule` and editing `CanEditProductSchedule`.

## Migrated

| Page | Path |
| --- | --- |
| List | `/production/schedules` |
| Create | `/production/schedules/create` |
| Edit dates and remarks | `/production/schedules/:id/edit` |

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

## Not yet migrated

- Schedule details, with each product's materials, stock, and purchase and stock requisitions. Rows in the list do not open anything yet.
- Adding products to and removing products from an existing schedule.
- The material forecast on a product line.
- Product flow and product requisition pages.
- The monthly report.

Backend behavior worth knowing (unchanged, shared with Oryx Next): the update endpoint accepts only the dates and remarks; the code and products sent with it are ignored.
