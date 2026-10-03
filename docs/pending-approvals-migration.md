# My pending approvals

Frontend-only. No backend change. Rebuilt from `oryx-next` (`qa/pending-approvals`, `components/pages/qa/approvals`).

## Pages

| Page | Route | Permission |
| --- | --- | --- |
| What is waiting, by document | `/qa/pending-approvals` | `CanViewPendingApprovals` |
| Documents of one type | `/qa/pending-approvals?type=<Document>` | same |
| One request | `/qa/pending-approvals/:type/:id` | same; the server also refuses a request that is not waiting for the signed-in user |

Module: `modules/pending-approvals`.

## What each page does

- **By document.** One card per document type that has something waiting, with its count, most first. The full count is asked for; a server without it falls back to the older count.
- **One type.** The requests of that type: document, who asked, department, date, and how many approvers have already acted.
- **One request.** Who asked and when, the document itself laid out for reading, what earlier approvers decided and wrote, and **Approve** / **Reject**. Each opens a confirmation. A rejection has to give a reason; a comment on an approval is optional. Afterwards the page returns to the list of that type.

## Permissions

| Action | Permission |
| --- | --- |
| See the queue and open a request | `CanViewPendingApprovals` |
| Approve | `CanApprovePendingApproval` |
| Reject | `CanRejectPendingApproval` |
| Transfer approval rights | `CanTransferApprovalRights` |
| Workflows: view / create / edit / delete | `CanViewApprovals` / `CanCreateNewApproval` / `CanEditApprovalWorkflow` / `CanDeleteApprovals` |

The server defines all of these. `oryx-next` never checked the approve, reject or transfer keys: anyone who could see the queue could do all three. A role that approves today needs the approve and reject keys to keep doing so here.

## Documents that can be read and decided here

- **Procurement:** purchase order, billing sheet, shipment document, purchase / trial / stock requisition, supplier pricing agreement.
- **Production and stock:** production extra material, finished goods transfer note, stock adjustment, analytical raw data (material or product test results).
- **Sales:** customer quotation, production order, production order allocation, proforma invoice.
- **People and services:** leave request, overtime request, staff requisition, job request, payroll run, performance review.
- **R&D:** project, formulation, technology transfer.

Where the app already has the document's page, the same components are used (order lines and totals, billing sheet charges, requisition facts).

Notes on particular documents:

- **Analytical raw data** shows each test with its result beside its specification, counts the results that do not comply, and shows only the answers of the data sheet being approved (a batch can carry answers from other sheets). The certificate of analysis preview and starting an out-of-specification investigation are not here.
- **Supplier pricing agreement** shows the proposed price beside the current one and the difference between them, and says when approving would archive the agreement.
- **Technology transfer** is shown with its project and the formula being transferred.
- Customer quotation, pricing proposal, payroll run and performance review are read from endpoints the server publishes without a response type, so they are declared by hand in `api/evidence-api.ts`.

## Documents that are not decided here

| Document | Why | Where |
| --- | --- | --- |
| QC documents (`Qc…`) | Signing needs the approver to give their password again; the general approval request cannot do that and the server refuses it. | Quality Control (not in the desktop app yet) |
| Formula, procedure and template revisions | Reviewed on the revision's own page. | Not in the desktop app yet |
| Payment | Decided under payment approvals. | Finance (not in the desktop app yet) |

These show as cards with their counts but do not open. A document type the app does not know opens, shows who asked and the history, and cannot be decided.

## Transfer approval rights

`/qa/approval-rights-transfer`, module `modules/approval-rights-transfer`. Choose who the approvals are taken from (people with something waiting) and who takes them over (any active user, never the same person), then confirm.

A transfer does two things on the server: every request waiting for the first person moves to the second, **and the second replaces the first in every approval workflow**. The page says both before anything is sent, and the confirmation names both people.

`oryx-next` showed a table of the first person's pending approvals. The server refuses to show one user's queue to another, so that table could only ever fail; it is left out.

## Approval workflows

`/settings/approvals`, `/create`, `/edit/:id`, module `modules/approval-settings`.

- **List:** each document with its approvers in order and how long a stage waits before it is escalated.
- **Create / edit:** the document, the escalation time as days, hours and minutes, and the stages. A stage is a role or a named person. Stages can be moved up and down; their order on the page is the order they are asked in.
- **Delete**, after a confirmation.

Rules:

- **A document with no workflow is approved automatically** by the server, with nobody asked. The list and the delete confirmation say so, and a workflow cannot be saved with no stage.
- One workflow per document. Documents that already have one are shown as taken when creating.
- The document cannot be changed on edit.
- The five quality routes (test results to a QA role, extra material to the QA GM) take exactly one approver, which has to be a role.
- The same approver cannot be in a workflow twice.
- Changes apply to requests made afterwards; requests already waiting keep the approvers they were given.

## Changed from oryx-next, and why

| oryx-next | Now | Why |
| --- | --- | --- |
| Approve and Reject were offered on every type, including those whose page said "No details available". | A document is decided here only when it can be read here. | Nothing should be approved unseen. |
| A rejection could be sent with no comment. | A reason is required. | The requester has to know what to change. |
| The comment was a rich-text editor. | Plain text. Earlier comments that carry formatting are shown sanitised. | A decision note needs no formatting. |
| A request no longer waiting showed a generic error. | "Not waiting for you", with a way back. | The server's refusal means exactly that. |
| The list for one type showed whatever the server returned. | Rows of another type are left out. | The page is about one type. |
| Approving, rejecting and transferring were open to anyone who could see the queue. | Each has its own permission. | The server defines them; one permission per action. |
| The workflow's escalation time was typed as a clock time with AM/PM, and was blank on edit. | Days, hours and minutes, filled in on edit. | It is a length of time, not a time of day. |
| A workflow could be saved with no stage. | At least one stage. | With none, the server approves everything automatically. |

## Notes

- Approving a stock adjustment applies it: the recorded stock of each line becomes what was counted. The page says so above the lines.
- A staff requisition has no number of its own; the server sends its id as its code.
- A leave request whose paid days exceed the balance is flagged.
- A decision refreshes the queue and the lists the document appears in (orders, billing sheets, shipments, requisitions, the production board).

## Not migrated yet

- Delegating approvals for a period. The dialog in `oryx-next` never sent anything, so there is nothing to carry over; the server has an endpoint for it.
- For analytical raw data: the certificate of analysis preview and starting an out-of-specification investigation.
- The pages where QC documents, revisions and payments are decided.

## Tests

`modules/approval-settings/components/workflows.test.tsx` covers the workflow rules, the list, edit, create and delete, and the transfer page. `modules/pending-approvals/components/approvals.test.tsx`: naming and routing of document types, the reason rule, counts and their fallback, the list filter, the detail page (document, history, sanitised text), reject and approve request bodies, documents that cannot be decided here, a request not waiting for the user, and every readable document laid out from full and from empty data.
