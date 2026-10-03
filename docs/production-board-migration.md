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

- **Nothing changes because a page was opened.** Every start, completion, request, and return is something a person chooses to do. Oryx Next started "automated" steps from the browser of whoever happened to have the board open.
- **A critical step is carried out by the people responsible for it.** The server refuses anyone else; the page says so instead of showing buttons that would fail.
- **A step carried out through a record moves with that record.** The server starts and finishes these steps itself: a stock requisition starts its step when raised and finishes it when the stock is issued, and likewise the batch record, the test request, final packing, and the finished goods transfer. Such a step has no Start or Complete button; the page says what it is waiting for. Oryx Next decided this from the step's position in the procedure (hard-coded step numbers 3 to 15), which breaks as soon as a product's procedure is ordered differently.
- **Only the batch's current step can be acted on**, and nothing can be done on a cancelled batch.
- **A step cannot be started while an extra material request is waiting for approval.**
- **Completing a step and returning all materials ask first**, and say that they cannot be undone. A second click while a request is on its way is ignored, because starting a step issues materials.
- **A page reached by its address applies the same rule as the button that leads to it**, so typing the address of final packing or extra material does not open the form on the wrong step.

## Actions on a step

| Instruction | What the page offers |
| --- | --- |
| Any step without a record of its own | Start step, Complete step |
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
  - Everything is on one page; Oryx Next split it over three tabs, so errors on a hidden tab only showed as "Some fields have errors".
  - Worked-out figures (expected packs, after samples, gain or loss, shippers, leftovers, what to return, loss per material) are calculated from what is entered and cannot be typed over.
  - Packed, rejected, and sampled cannot add up to more than was received. Oryx Next silently returned zero.
  - The packing record is saved first, then the leftovers are returned. If the return is refused, the page says the packing was saved and offers to send only the return again. Oryx Next sent both at once, so either could succeed without the other.
  - Once recorded, the page shows the record and offers no second entry.
- **Failures show the server's reason with Retry.** Oryx Next logged several of them to the console and showed an empty page.

## Checking

Unit tests cover the rules (`lib/activity.test.ts`): step policy, progress and durations, the board, the stock voucher, the test request, extra material, the transfer rules, and the final packing calculations. Page tests (`components/activities.test.tsx`) cover the board, a batch's progress, starting and completing a step, a critical step seen by someone not responsible, that opening a page sends nothing, the stock requisition, and a cancelled batch.

The dialogs for the test request and the finished goods transfer, and the extra material and final packing pages, are covered by their rule tests only; they have not been exercised against a live server.
