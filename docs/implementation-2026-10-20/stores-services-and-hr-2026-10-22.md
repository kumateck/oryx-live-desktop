# General stores, services and HR completion — 2026-10-22

User authorization: complete the HR items blocked by the server, onboarding, the CRM job request, `/formula`, the QA formula queues, and the 27 pending general stores/services routes; change and repair the backend where needed.

Everything here is **implemented in validation**: focused automated tests pass and the backend repair is local, uncommitted and undeployed (`oryx-backend`, branch `desmond-latest`). The running server must include the repair before any live acceptance.

## Backend repair (oryx-backend, uncommitted)

Stores:

- Per-store permission keys on every stock requisition, issue, return, damage/missing and purchase requisition endpoint (`StoreWorkflowAccess`).
- Issue tracking per requisition line. A requisition cannot be over-issued.
- Returns are limited to what was issued less earlier returns, and they restore stock.
- Damage edits and deletes post to the ledger.

Store procurement:

- Sourcing, trusted and open-market key classes.
- Open-market memo lines are no longer doubled.
- Purchase-order keys can read purchased items.
- A new `GET api/v1/items/choices` endpoint pages item choices instead of capping them.

Services:

- Every job request, order, execution, quotation, proforma, memo, vendor, provider and service endpoint checks current grants.
- Actors come from the token, never from the request body.
- Quotations close after a selection. Duplicate providers and invalid charges are refused.
- Proforma responses can only change their own lines, with non-negative prices and positive quantities.
- Each job order gets one memo, raised for the quotation its approved proforma was raised against and sent to that quotation's provider, with valid amounts and dates. Updates follow the same rules.
- `GET service-proforma-invoices?memoPending=true` lists approved proformas still waiting for a memo. Memo viewers can read proformas.
- Mark-paid requires an issued memo.
- A service cannot be deleted while job requests, job orders or service providers still use it.

HR:

- `Employee.UserId` links an account to an employee.
- `GET employee/me` returns the signed-in user's employee record.
- Goal and review ownership checks are in place. `GET performance/reviews/mine` lists the user's reviews.
- An assigned reviewer may read the reviewed employee's goals for that review's cycle, and no other goals.

Onboarding:

- The anonymous employee and user creation endpoints are gone.
- Invitations are hashed, expiring, single-use tokens. The invitation decides the email and the employee type, and the staff number is left for HR to set.
- A photograph can be added only just after the form is submitted.

Permissions:

- `CanViewFormulaBuilder` is now in the permission catalogue under R&D. Previously the navigation used it but no one could be granted it.

Migrations:

- `TrackStockIssueRequisitionLines`
- `LinkItemReturnsToRequisitionLines`
- `LinkEmployeesToUsersAndInvitations`

## Live pages

- **Stores:**
  - Stock requisitions (create, list, detail, issue)
  - Issue stock
  - Return items
  - Damage/missing
  - Purchase requisitions
  - Store procurement: sourcing, vendor quotations, quotation responses, price comparison, memo, open-market collection, purchased items
- **Services:**
  - Job requests: create, edit, acknowledge, assign, reassign, start, complete, cancel, delete, create job order
  - Job orders: list and detail
  - Service quote responses: record a quotation with charges and materials; edit while open
  - Service price comparison: compare quotations side by side, cheapest first, then select one after a fresh read
  - Service proforma requests: request, record the response with changed line prices, approve
  - Service memos: raise from an approved proforma, edit the draft, issue, mark paid
- **HR:**
  - Public onboarding at `/onboarding/:type?token=`, signed out. It reuses the employee form; the email is fixed and there is no staff number.
  - Personal goals, and "My goals and reviews" on `/hr/goals`
  - Self-assessment and manager assessment on `/hr/goals/reviews/:id`, each sent once after a fresh read
- **Other:**
  - `/crm/jobs/job-request` opens the services job request list. The reference page was that same list with no columns.
  - `/formula` is a calculation scratchpad on the existing mathjs evaluator. The reference evaluated text with `new Function` and treated `^` as XOR.
  - QA formula review and approval queues

Every write is confirmed explicitly and re-reads the record first. If the record changed, the write is refused and nothing is sent.

## Behaviour changes to tell users

- Oryx Next's onboarding form and its old invite links stop working. HR must send new invitations from Live.
- The onboarding link is built from `Onboarding:BaseUrl`, or else from the origin of the request. Set `Onboarding:BaseUrl` to the Live site address on the server.
- A second memo for one job order is refused. So is a memo whose quotation or provider does not match the approved proforma.

## Verification

- Web: 1,419 tests in 263 files pass (`vitest run --maxWorkers=2`). The production web build, TypeScript (web, desktop, gateway), the route check and the API check all pass.
- Node: 54 checks pass. Gateway: 9 checks pass.
- Backend: 1,303 pass and 57 are skipped. The 3 failures are the same ones that failed before this work: an R&D formulation status test, an R&D technology transfer test and a QC signature test.
- Every automated business write uses a mocked backend. Nothing was committed, pushed or deployed.

## Remaining

- Deploy the backend repair, run its migrations, then do live acceptance in the signed-in desktop app.
- Desktop visual checks at the target sizes have not been done.
- The negotiate-quotation endpoint has no screen. Oryx Next had none either.
