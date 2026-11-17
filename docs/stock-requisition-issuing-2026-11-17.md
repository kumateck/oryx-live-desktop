# Issuing stock requisitions — 17 November 2026

Changes to the warehouse's **Issue stock requisitions** list, the issue screen and the printed voucher, plus the BMR/BPR request times.

## Awaiting issue and Issued (backend #1861, desktop #266)

The list has a status switch beside Raw / Packaging:

| Choice | Shows |
| --- | --- |
| **Awaiting issue** (default) | Requisitions neither issued nor rejected: awaiting approval and ready to issue |
| **Issued** | Requisitions whose own status is Completed |
| **All** | Everything, including rejected, as before |

`GET /api/v1/requisition/department` takes an optional `issued` query parameter: `true` for issued, `false` for awaiting.

The existing `status` parameter matches requisitions with *any item* in that status, so it could not separate them.

The contract change is recorded in `api-codegen.md` (digest `e4bf7bc3…a42a`).

## One batch per line (desktop, branch `claude/voucher-batch-columns`)

Each material's batches are listed in picking order: soonest expiry first, undated last, otherwise as set aside. Each batch is one line with labelled columns.

- **Issue screen ("Issued from"):** Batch No., AR No., Location, Quantity, Expiry.
  - Returned stock and expired batches are marked.
  - A material with several batches ends with their **total**.
  - A shortfall shows as "Set aside … · … short".
- **Printed voucher** (landscape):

  | # | Material | Qty required | Batch No. | AR No. | Location | Qty from batch | Expiry | ✓ |
  | --- | --- | --- | --- | --- | --- | --- | --- | --- |

  - The material, its code and its required quantity are printed once, spanning its batch lines.
  - Several batches end with a bold total line, or "Set aside … / … short".
  - A material with no stock set aside prints "None set aside".
  - The ✓ box is for the checker to tick each batch as it is picked.
  - A material's lines are kept together on a page.
- **Location** reads as a place, "G/01 · Shelf G/01/A", built from the shelf's rack and name. A shelf already named "Shelf 2" is not prefixed twice. Without either, it falls back to the recorded location, or "Location not recorded".

Logic: `modules/stock-issue/lib/batch-lines.ts`. Components: `batch-breakdown.tsx` (screen) and `voucher-table.tsx` (print).

## BMR/BPR requests show times (desktop #265)

The QA **BMR and BPR requests** list and each request's page show Requested and Issued as a date and time.

## Proposed: whole containers

Issuing whole sealed containers (18.75 kg requested → two 10 kg boxes, 20 kg issued, 1.25 kg returned by production) is designed but not built. See `oryx-backend/docs/whole-container-issue.md`.
