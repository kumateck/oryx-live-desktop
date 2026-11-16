# Document review (Checked by)

A record of a reviewed document type is checked before it goes for approval. The server owns the rules
(`oryx-backend` `docs/document-review-design.md`); the desktop shows them.

- `shared/reviews`: the review API (zod-checked, `api/v1/document-review`), the Review panel, its
  action dialog and `useDocumentSigners` for prints.
- **Review panel**: on a record's page. It shows the status, Prepared / Checked / Approved by, the
  history and only the actions the server allows (`canConfirm`, `canReturn`, `canResubmit`). The
  caller passes the keys for the record's stored kind; each action is re-checked before it is sent.
  A correction slot opens the record's own edit dialog while the review is open.
- **Prints**: `useDocumentSigners(record)` gives the Prepared by, Checked by and Approved by lines.
  Lines nobody has signed stay blank.
- **Pages**: My pending reviews (`/qa/pending-reviews`, `pending-reviews` module) and Document
  reviews settings (`/settings/reviews`, `review-settings` module).
- **Documents** (phase 1, then phase 2's first batch):
  - Purchase orders: the check is the review, and finalising again corrects a returned order.
  - Purchase requisitions: Correct requisition edits quantities while the requisition is in review.
  - Stock requisitions: corrected through the batch Repair action.
  - Billing sheets: Edit is unblocked while the sheet is in review (it stays blocked while it waits
    for approval), and the sheet and charges prints carry the signatures.
  - Staff requisitions, overtime requests and leave requests: the page's own Edit action corrects them.
  - Job requests and packing lists: their Edit actions correct them while they wait. A packing list edited
    after its check goes back to review as a new submission.
  - Stock issues: the voucher page shows the issue's check as its Review panel; a returned issue is
    corrected through the issued-material repair.
  - QC formula revisions: the review page shows the Review panel (status, history, Return to draft);
    the review itself is still recorded below it, with the definition hash and a reason.
