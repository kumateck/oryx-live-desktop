# Issuing packaging over or under the requirement

Packaging comes in packs the store cannot open: rolls, cartons, bundles. A requirement of 18.75 kg of labels may leave the store as **20 kg** (two packs of 10) or **18 kg** (two packs of 9). Agreed with the user on 17 November 2026. Design: `oryx-backend/docs/whole-container-issue.md`. Backend #1863.

## Rules

- **Packaging only.** Raw materials are issued exactly as required.
- **The requirement is never changed or rounded.** Only what is handed over can differ.
- **A warehouse supervisor sets it**, with a reason for any difference, over or under.
- **No cap** beyond the batch's free stock.
- **Leftovers come back through Final Packing**, as partial returns on the material return note.

## Issue screen

On a packaging requisition that has not been issued, each line's row menu has **Set quantity to issue**. It is shown only to holders of `CanAdjustPackagingMaterialIssueQuantity`, which nobody holds until an administrator assigns it.

The dialog:
- shows the requirement;
- offers the **nearest whole packs**, when every batch set aside has the same known pack size;
- shows how far over or under the entry is, and asks for a reason when it differs.

Batches with an unknown pack size get no suggestion. That includes migrated stock, which records the whole quantity as one container.

Entering the requirement again clears the adjustment.

The line then shows "To issue 20 kg · 1.25 kg over" (or "Issued …" after issue), with the reason and who set it. The voucher prints the same under Qty required, plus the reason.

## At issue

The difference falls on the last batch in picking order, the one whose pack is opened:
- an over is taken from that batch's free shelf stock;
- an under is left from the last batch backwards.

Production's holding, the shelf and the bin card all carry what was handed over.

## Final Packing

The packing-material reconciliation receives the **issued** quantity, plus any extra deliveries. So:

- **An over** comes back automatically as leftover: received 20, packed 18.75, returned 1.25. The leftover goes back as a partial return on the batch's material return note, booked to the batch the extra came from.
- **An under** is covered by an extra-material request. If nothing more is delivered, it shows as the reconciliation's loss with its reason.

## Code

- `modules/stock-issue/lib/issue-quantity.ts`
- `components/issue-lines.tsx`, `issue-quantity-dialog.tsx`, `voucher-table.tsx`
- `modules/activities/schemas/final-packing-schema.ts` (`issuedPackagingSchema`)
