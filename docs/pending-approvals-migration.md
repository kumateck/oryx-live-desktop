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

- **Analytical raw data** shows each test with its result beside its specification, counts the results that do not comply, and shows only the answers of the data sheet being approved (a batch can carry answers from other sheets). The certificate preview and OOS investigation actions are described below.
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

## Analytical raw data: certificate and OOS investigation

- **Certificate of analysis** (`components/details/ard-certificate.tsx`): a print preview of the certificate from the recorded results, with each test's result, specification and compliance. Nothing is generated or saved. A test with no result is "Not recorded"; Oryx Next printed "Complies". Oryx Next also printed "Each uncoated tablet contains" and an empty composition on every certificate, and a fixed comment; those are left out.
- **Start OOS investigation** (`components/details/start-oos-dialog.tsx`), on results rejected earlier and sent again, with `CanInitiateOosInvestigation`. The certificate number, name, batch and the rejection reason are filled in. The dialog says what the server also does: a material batch goes back to quarantine; a product's test request (found from the tested step) goes back to testing. The server does not check for an investigation already open, so the dialog says to start one only once. The investigation is continued in the web app until Quality Assurance is migrated.

## Delegating approvals

Built with a backend change in `oryx-backend` (the old `POST approval/delegate` only checked that the user existed and saved nothing; the Oryx Next dialog never called it). See `oryx-backend/docs/approval-delegation.md`.

- **My pending approvals** has a Delegation panel (`components/delegation-panel.tsx`): **Delegate my approvals** (who, first and last day, an optional reason), the delegations the user gave and received (including ones ended in the last 30 days), and **End** / **Give back** after a confirmation.
- Whole local days: the first day starts at midnight, or now when it is today; the last day runs to the next midnight. At most 90 days and one delegation at a time; the server enforces both.
- Requests reached through a delegation show **For <name>** in the list, and the request page says the decision is recorded as that person's, with a note that the user made it.
- Signed QC documents are never delegated.
- The three endpoints are declared by hand (`api/delegation-api.ts`) until `contracts/openapi/backend.v1.json` is exported again from a backend that has them.

## Not migrated

- The pages where QC documents, revisions and payments are decided.

## Tests

`modules/approval-settings/components/workflows.test.tsx` covers the workflow rules, the list, edit, create and delete, and the transfer page. `modules/pending-approvals/components/approvals.test.tsx`: naming and routing of document types, the reason rule, counts and their fallback, the list filter, the detail page (document, history, sanitised text), reject and approve request bodies, documents that cannot be decided here, a request not waiting for the user, and every readable document laid out from full and from empty data.

## Formula evidence in COA approvals (2026-10-19)

Analytical raw-data approvals and their certificate preview share `ArdResultsTable`. A formula answer gets a full-width calculation row beneath its test/specification, rather than showing serialized response JSON inside the narrow result column. Ordinary observations keep their existing presentation and compliance treatment.

The local read schemas retain `question.type`, `question.options[].name`, response-side question metadata, and the existing `formulaGoverned`, `formulaResultFinalized`, `formulaExecutionId`, and `formulaDisplayResultsJson` fields. No endpoint or mutation contract changes. Formula settings returned with an answer take precedence; otherwise the template supplies the definition. Legacy wrapped settings are normalized before the existing read-only preview renders the readings and equations. Approval previews never use the debug formula override.

Governed answers display only the server-stored authoritative results, including their draft/finalized indication. Missing authoritative values show an explicit unavailable message and never fall back to browser recalculation. Non-governed answers reuse the existing simple/universal/uniformity previews. Missing formula settings show a configuration message instead of raw JSON. Percentage results render a normal `%` in the native math renderer. Shared worksheet summaries stack at narrow widths and omit empty groups.

Existing response-ID filtering, recorded compliance flags, approval/rejection/OOS permissions, transitions, and audit responsibilities are unchanged. Rendering and opening the certificate preview perform no writes. Integration coverage includes both surfaces, two sample calculations, missing settings/readings, response metadata, governed results, and isolation from other documents' answers.
