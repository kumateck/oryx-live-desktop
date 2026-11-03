# Issued BMR records

Quality Assurance → **Issued BMR records** (`/qa/issued-bmrs`) lists only already
issued BMRs for product batches. It is separate from BMR/BPR requests. Search by
batch number, product name or code. Retired records keep their history but have no
correction actions.

Row actions:

- **Correct batch number:** fix a text typo with a reason. Only the number changes;
  a duplicate is refused and entered values stay available after a failed save.
- **Request date revision:** propose manufacturing/expiry months with a reason.
  Current dates stay active until another permitted person approves the request.
- **History and revisions:** review previous/current values and reasons. An
  approver can approve or reject another person's pending revision after reviewing
  the date changes and recording a decision reason. Requesters cannot self-approve.

The dedicated permissions are `CanViewIssuedBmrRecords`,
`CanCorrectIssuedBmrBatchNumber`, `CanRequestIssuedBmrRevision` and
`CanApproveIssuedBmrRevision`, under Quality Assurance / Issued BMR Records. Every
mutation requires list access plus its action grant; the backend enforces current
access and department scope too. Existing issue permissions do not grant this page.

Applied changes update linked live batch data atomically, retaining an audit trail.
Amounts, stock events, test results, quality status, issuer and issue dates are not
editable here. Issued certificates stay fixed and use the separate certificate
revision workflow; previously printed/exported artifacts remain historical copies.

The matching backend migration `20261103160129_AddIssuedBmrCorrections` must be
applied before release and the four permissions assigned as appropriate. The
generated API is additive: five issued-BMR endpoints and nine schemas, reviewed
under digest `72b0d96542fd4728f86f4dc0f80986021abed7569010420a0734296e12bb219f`.
No customer database, stock or deployment is changed by local implementation.
