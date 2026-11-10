# Warehouse migration stock top-ups

Warehouse › Stock Movement › **Migration Stock Top-ups** (`/warehouse/migration-top-ups`) is where stores staff enter stock that was in the stores at go-live but missed by the opening-balance count, for example an order received a few months before the system was in use. Each entry is a *migration top-up* of the opening balances: it adds to a matching lot or creates a separate lot while preserving existing stock.

It is the hand-entry counterpart of the Excel top-up in Settings › Upload Center. Both create the same draft, and both go through the same review and approval.

## Flow

1. **New top-up**: enter the reason, then add one line per material batch in a dialog. The list stays on the page, and lines can be edited or removed, like the product BOM, packaging and procedure editors. Each line has:
   - material kind (raw or packaging), then the material, picked from the department's linked materials;
   - batch number and AR number, both optional. A line without a batch number is kept as its own lot;
   - shelf, picked from the department's raw or packaging store;
   - quantity, in the unit set on the material's department link. For an mg or ml material a dropdown offers mg, g or kg (ml or L); any other unit (pcs and similar) is shown as a fixed label;
   - optional manufacturing, expiry and retest months (month and year only), and an optional GRN or waybill reference.
2. **Submit for approval**: a confirmation states that adding stock cannot be reversed after approval. The user must tick that they checked every line against the physical stock before the list is sent (`POST /api/v1/stock-migrations/top-ups` with `exactDates: false`). Nothing is added to stock at this point.
3. **Review and approve** (`/warehouse/migration-top-ups/:id`): this is the same page as the Upload Center draft review. The backend checks every row:
   - unknown or unlinked materials, wrong store types and invalid dates block approval;
   - a batch already in stock, or already in another waiting top-up, is a warning. The warning says whether the AR number, manufacturing, expiry and retest months match the batch on the shelves;
   - a retest date that has already passed is a warning.

   Approval needs `CanApproveOpeningBalances` and is hidden from someone without it. A line whose batch matches a lot on the department's shelves (same batch number, AR number, manufacturing, expiry and retest months) adds its quantity to that lot. Other numbered lines remain separate if the AR number, unit or date months differ; blank batch numbers always remain separate lots. New lots use month-start manufacturing and month-end expiry/retest dates.

## Permissions

| Action | Permission |
| --- | --- |
| See the page and drafts | `CanViewOpeningBalances` |
| Enter and submit a top-up | `CanUploadOpeningBalances` |
| Correct, re-check or discard a draft | `CanCorrectOpeningBalances` |
| Approve (adds the stock) | `CanApproveOpeningBalances` |

The backend enforces each of these permissions. Stock is entered for the signed-in user's own department; a user without a department is sent to the Upload Center instead.

## Dates

All three dates use month/year pickers, including corrections of older drafts.
The backend accepts older clients sending `exactDates: true` but normalizes the
working dates to months before checking and approving. Matching considers the
month and year of historical dates, so 1 February and 29 February 2028 match.
The existing lot's saved dates and original import evidence remain intact.
A correction leaves the saved retest month unless explicitly cleared
(`clearRetestDate`). Missing batch numbers produce review warnings, never a
batch-number approval blocker.

Already-approved split lots retain their original record IDs and audit history;
this change does not perform a historical inventory consolidation.

## Contract

These optional fields are added to the backend contract (backend kumateck/oryx-backend#1723, migration `AddStockMigrationRetestDates`):

- `StockMigrationLineDto.retestDate` and `exactDates`;
- `UpdateStockMigrationLineRequest.retestDate` and `clearRetestDate`;
- `CreateStockTopUpRequest.exactDates`.

The reviewed contract digest is
`634929a7cfb2eb8ccdcca0bd24fc2c02b7b1ce63d502efdabfe82474469bcf99`. Its predecessor without these fields is
`fa46de385e587bca0821ff164522fedda3dca60d5e0b044336bd7093fe87d238`.
