# HR requests and desktop sign-in — 2026-10-21

## Scope and contracts

Oryx Live now has leave, overtime and staff requisition registers, dedicated authoring/editing pages and detail routes. They use existing generated HR endpoints, exact permission keys, Module/SubModule audit headers, server paging/search/filtering, frozen editor evidence and fresh preflight reads. Generated API definitions and the backend are unchanged. All forms use shared FormWizard, RHF and Zod. Read-only file previews and shared approval history are reused.

Leave supports all four numeric categories, category/status/department filters, ordered dates, eligible designation leave types, active employees, permanent-staff official duty, two-weekday absence/contact validation and single-day exit passes. Request and file upload are separate confirmed stages. A failed attachment retries only the saved request's files. Unconfirmed creation blocks resubmission until the user checks the register. Details retain all contract fields, zero totals, attachments, approval history and a printable request with explicit print scope. Pending/rejected/reapplied detail edits do not silently reapply a rejected request; reapplication is an explicit action.

Overtime supports department/status filters, configured code suggestions with manual entry, date and 12-hour clock input, justification, multiple active employees from the department and its immediate child departments, complete employee details and approval history. The scoped employee endpoint is reread before every save. Only pending requests can be edited or deleted. This intentionally protects approved/closed requests from a backend update endpoint that currently lacks a status guard. Deletes remain soft deletes with server deletion audit fields.

Staff requisitions retain integer staff counts, designation/department, both qualification fields, budget and appointment zero values, required-by date, justification, additional requirements and separate additional requests. Department/designation membership is revalidated before saves; new/pending state is rechecked before updates or deletion. Filter dates apply to the required-by date, matching the repository rather than incorrectly labeling them creation dates. A new selected deadline uses the end of that day to satisfy the existing server's full-timestamp comparison. An unchanged existing timestamp is preserved.

Permissions remain `CanView/Create/Edit/Recall/CancelLeave...`, `CanView/Create/Edit/DeleteOvertimeManagement`, and `CanView/Create/Edit/DeleteStaffRequisition` with their existing exact keys. No role-based bypass or backend approval decision was added. Mutation errors remain visible; no automatic business write replay occurs after a temporary renewal, network or server failure.

## Server gaps retained explicitly

- Leave recall accepts only an employee ID and selects its first approved request, including historical requests. Live requires exactly one approved request for the employee across complete pages and matching request identity. Ambiguous recall is refused, rather than choosing a different request.
- Recall always credits annual leave on the current server, even for official duty/non-deducting leave. Live refuses recall unless this is leave with a verified balance-deducting type. Correct support for other recalls requires a server balance calculation fix.
- Cancellation records status but currently does not restore annual leave deducted at creation. Confirmation explicitly identifies the HR reconciliation requirement. No client-side balance mutation attempts to compensate.
- Updating official duty/exit passes currently requires a leave type on the server, although creation does not. Live explains and validates that contract. A request without an eligible type cannot be correctly edited until the server fixes its update rule.
- Overtime total hours truncate fractions and become negative overnight on the server. Live displays exact requested fractional same-day hours alongside the reported whole hours and refuses new/edited overnight periods. Overnight support needs a server contract/calculation change.
- Reapplication resets approval records on the server; the UI states this and does not disguise it as a normal edit. Several backend actions use authentication without fine-grained authorization/concurrency guarantees. Frontend preflight cannot eliminate a race with another client.

## Desktop session repair

The shell now serializes encrypted vault reads/writes/deletion, writes a private temporary file and flushes it before atomic replacement, and drains pending persistence on close/quit. Confirmed login/renewal awaits persistence. Page cancellation affects only that caller's wait, preserving shared renewal through StrictMode/remounts. Late restoration/renewal cannot resurrect a signed-out session. Temporary renewal failures preserve tokens and an established workspace. Storage errors are surfaced without exposing token contents.

An additional backend source defect prevents reliable renewal: `JwtService.SaveRefreshToken` creates a refresh token without assigning its `UserId`; `AuthRepository.LoginWithRefreshToken` then authenticates `details.UserId`. The database audit hook also overwrites `CreatedById` with the current request user, so it is not a safe ownership fallback for anonymous login. [backend-session-repair.patch](backend-session-repair.patch) records the one-line source repair now **applied locally in oryx-backend with the user’s explicit approval**. It is not deployed. `RefreshTokenOwnershipTests` passed: actual JWT issuance and repository renewal from a fresh in-memory database context preserve the owner. Existing ownerless tokens cannot be safely repaired by the desktop; a new login after a corrected server issues an owned token is needed. The server's separate expiry/disabled-account enforcement also needs authoritative backend review.

The local desktop currently returns the generic customer-server failure while restoring its saved session. This is consistent with the local source defect but does not prove the deployed backend matches this checkout. Real signed-in close/quit/relaunch acceptance remains outstanding. The encrypted token has not been discarded for this server error.

## Verification

- Current combined web regressions: 131 passing tests in 26 files, covering employees, reports/export, Finance, transfers, requests, attendance and session behavior.
- Node route/registry/cache/vault checks: 25 passing tests.
- Latest web TypeScript check passes; desktop TypeScript previously passed for the persistence changes. Source formatting uses the already installed formatter. No generated API or dependency changes.
- React Doctor download/execution was rejected by automatic approval review because of potential private-source/telemetry egress. No workaround or download was attempted. Local tests, type checks and source review continue.
- All business mutation tests use mocked APIs. No live HR, inventory or Finance mutation, deployment or notification send has been performed.

The overall five-domain implementation is not complete. Compensation/payroll, performance, shift planning/import, public onboarding and general stores/services remain pending, along with integrated/live acceptance of implemented domains. See scope.csv and README.md.
