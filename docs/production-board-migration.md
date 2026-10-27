# Production board migration

Module: `apps/web/src/modules/activities`. Shown to production departments with `CanViewPlannedProducts`.

| Page | Path |
| --- | --- |
| Production board | `/production/activities` |
| Batch | `/production/activities/:id/board` |
| Step | `/production/activities/:id/board/:stepId` |
| Extra material request | `/production/activities/:id/extra-material` |
| Final packing | `/production/activities/:id/final-packing` |

A batch that is in production opens its board from the schedule page ("Open production board").

## What each page is for

- **Production board**: every running batch of the user's department, in a column for the operation it is at. A card shows the batch number, product, size, schedule, the step's status, how long it has been there, and who is responsible. Clicking a card opens the batch.
- **Batch**: the batch's facts, a progress bar (steps completed out of all steps, and the step it is on), every step in order with its status, duration, and people, and the activity log. The current step is open with its actions.
- **Step**: one step on its own page, with its description, the people responsible and the instruction each holds, timing, the same actions, and links to the steps before and after.

The production board fills the available content height below its heading. Operation columns stretch to the same bottom edge, including empty columns; each batch list scrolls vertically within its column. The loading skeleton and overall empty state use the same available height. The shared `.page-fill` layout respects direct children marked `flex-1` so they can occupy the space left by fixed page headings.

## Rules

These are in `lib/step-policy.ts` and are the same wherever a step is shown.

- **Only the active non-critical step starts automatically** after its record checks settle; a person completes it. Upcoming steps wait until they become active. Critical steps still require a start from someone responsible for them. Opening a page never starts a critical step or carries out one of its records.
- **A critical step is carried out by the people responsible for it.** The server refuses anyone else; the page says so instead of showing buttons that would fail.
- **A step carried out through a record moves with that record.** The server starts and finishes these steps itself: a stock requisition starts its step when raised and finishes it when the stock is issued, and likewise the batch record, the test request, final packing, and the finished goods transfer. Such a step has no Start or Complete button; the page says what it is waiting for. Oryx Next decided this from the step's position in the procedure (hard-coded step numbers 3 to 15), which breaks as soon as a product's procedure is ordered differently.
- **Only the batch's current step can be acted on**, and nothing can be done on a cancelled batch.
- **A step cannot be started while an extra material request is waiting for approval.**
- **Completing a step and returning all materials ask first**, and say that they cannot be undone. A second click while a request is on its way is ignored, because starting a step issues materials.
- **A page reached by its address applies the same rule as the button that leads to it**, so typing the address of final packing or extra material does not open the form on the wrong step.

## Actions on a step

| Instruction | What the page offers |
| --- | --- |
| Any step without a record of its own | Non-critical steps start automatically; a person completes them. Critical steps are started and completed by their responsible people. |
| Stock requisition | Request stock: one voucher for every material the batch needs. Once raised, the status of the raw and packaging requisitions is shown. |
| BMR and BPR requisition | The batch record's status. |
| Analytical test request | Request analysis: product state and filled volume; the stage comes from the analytical raw data set on the step in the product's procedure. |
| Extra material request | A page listing the batch's materials; enter the extra quantity and unit for those that need more. Earlier requests are shown above the form. |
| Final packing | A page for the yield and the packaging material reconciliation. |
| Finished goods transfer | Send packed goods to the finished goods store, all at once or in parts. |
| Full return | Return every issued material and cancel the batch's production, with a reason. |
| Dispatch | Start and Complete. Oryx Next has no dispatch record; its button did nothing. |

## Improved over Oryx Next

- **One request for a batch's steps.** The board and the step page read the same run, which carries every step and the log. Oryx Next asked for the product, the stock lists, the requisitions, the batch record, and the extra packing again for each step card.
- **Records are asked for only when the step involves them**, and only for the current step.
- **The board stays current by itself**: it is read again every 30 seconds while the window is in view and when the window regains focus. Oryx Next relied on a push from its own web server, which the desktop app does not go through.
- **Progress is shown**: steps completed out of all steps, the current step, how long each step took, and how long the batch has been running.
- **Stock requisition**: materials that cannot be requested (no unit, no quantity) are named before sending. Oryx Next's remarks were typed into a field that was never sent.
- **Test request**: the request is saved first and the step started after it, so a refused request does not leave a started step. Oryx Next sent both at once.
- **Extra material**: quantities are checked against what the warehouse has free, the unit is chosen per line, and earlier requests are listed. Oryx Next had this check written but never ran it.
- **Finished goods transfer**: the quantity is checked against what is left, and a transfer is marked partial by the server's own rule (anything but one transfer of everything packed), so the remainder of an earlier partial transfer is accepted.
- **Final packing**:
  - Summary and three tabs follow Oryx Next. The active tab is carried in `?tab=` so reload restores it. Yield uses the numbered batch-record table with plain text calculated values. Failed validation opens the relevant tab and shows each field's error.
  - Worked-out figures (expected packs, after samples, gain or loss, shippers, leftovers, what to return, loss per material) are calculated from what is entered and cannot be typed over.
  - Material entry units come from `toLargestUnit` applied to the raw total received in its smallest family unit. They remain stable while editing; displayed quantities use the same converter, and entries/returns convert back to raw API quantities. Small weights use g or mg instead of being forced into kg and displayed as `< 0.0001 kg`.
  - Packed, rejected, and sampled cannot add up to more than was received. Oryx Next silently returned zero.
  - The packing record is saved first, then the leftovers are returned. If the return is refused, the page says the packing was saved and offers to send only the return again. Oryx Next sent both at once, so either could succeed without the other.
  - Once recorded, the page shows the record and offers no second entry.
  - Immediately before saving, the client reloads the active step, assignment, packing style, issued materials, and existing record. Changed or unreadable data blocks the write. Permissions are checked again after those reads and before the return write.
  - Pack and sample counts must be whole finite numbers. Measurements and material amounts must be finite and non-negative; missing return units block saving. Split issue lines are merged once and an unmatched extra material blocks saving rather than being dropped.
  - Double submissions are locked for the entire save/return sequence. A definitive rejected return can be retried without resending packing. Uncertain outcomes (network errors, unreadable responses, or server errors) require checking the server records before another write.
- **Failures show the server's reason with Retry.** Oryx Next logged several of them to the console and showed an empty page.

## Checking

Unit tests cover the rules (`lib/activity.test.ts`): step policy, progress and durations, the board, the stock voucher, the test request, extra material, the transfer rules, and the final packing calculations. Page tests (`components/activities.test.tsx`) cover the board, a batch's progress, starting and completing a step, a critical step seen by someone not responsible, that opening a page sends nothing, the stock requisition, and a cancelled batch.

Final packing also has regression coverage in `lib/final-packing.test.ts` and `components/final-packing/final-packing.test.tsx` for validation, unit conversion, duplicate submission, stale steps, invalid reads, missing return units, and the save/return failure sequence. These use a simulated API; the flow has not been exercised against a live server. The other dialogs and extra material page retain rule coverage.

### Backend requirements for final packing

The inspected backend `ProductionScheduleRepository.CreateFinalPacking` inserts the record and then completes the step in separate saves. `ReturnLeftOverStockAfterProductionEnds` separately inserts the return note and its lines. The controller requires authentication, but these methods do not themselves check current-step ownership, reconcile quantities, or deduplicate repeated requests. Client checks cannot close races between sessions or recover an atomic transaction after a browser reload.

Production hardening therefore also requires backend validation and authorization, a unique packing record per batch, a transaction covering packing/step/return intent, and idempotency keys for packing and returns with a durable operation status to query after uncertain responses. Pending returns currently survive only while this page remains open; leaving or reloading after a partial save requires staff to reconcile the saved record and return note. Do not treat the desktop guard as a substitute for those server guarantees.

## Extra-material completion gate (2026-10-27)

Manual **Complete step** remains visible and disabled while any batch extra-material request awaits approval or warehouse issue. A status message distinguishes those two waits. The backend's legacy extra-material status `Approved` (`2`) means **issued**; approval alone moves a request to `InProgress` (`1`). Earlier requests now label these states “Awaiting warehouse issue” and “Issued”. A mixture of issued and outstanding requests still blocks completion.

The active batch's extra-material evidence refreshes every 30 seconds while focused, on focus and on reconnect. Loading, failed reads and malformed evidence disable completion. Confirmation rereads the requests without cached evidence, then rechecks permission before sending the update. Final packing also checks the gate before its write because it completes a step. The companion backend refuses manual completion and final packing before changing records when any request has not reached issued status; a pending approval also refuses a new step start. No DTO, database migration or generated endpoint change is needed. Deploy the companion backend guard with this UI.

Verification: pending, approved/unissued, mixed requests, all-issued and no-request cases; stale confirmations; unreadable evidence; final-packing preflight; direct backend completion/start and packing refusal, valid issued final packing, and rejection of a mismatched batch/step. The selected backend quality/discrepancy/production suite passed 98 tests. Browser fixtures checked both waiting states and the enabled issued state at 1280×720, 1366×768 and 853×480 with no horizontal overflow or browser exceptions. Native Windows and real database concurrency acceptance remain separate from these local checks; the final-packing transaction/idempotency limitations above are unchanged.
