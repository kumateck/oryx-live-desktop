# Performance migration — 2026-10-21

## Implemented in Live

Four reference routes: performance cycles, team goals, reviews and review detail. Domain manifests protect data hooks. Untyped OpenAPI performance operations remain listed in `api-untyped-operations.md`; a shared, handwritten RTK Query adapter validates actual controller/repository DTOs with Zod, without modifying generated files. Read responses reject missing identities, malformed enums and duplicate cycle identities; successful writes alone invalidate the performance tag. Writes send HR/Performance audit headers.

Cycles retain type, dates, counts and all three statuses. Creation validates the ordered period, name length and duplicate name/period. Separate activation/closure confirmations freeze the displayed evidence and reread the cycle immediately before writing. Only Draft → Active → Closed is offered; reopening is refused. The backend currently accepts arbitrary transitions and has no concurrency token; client checks do not replace backend guards.

Team goals require both `CanViewTeamGoals` and the backend's actual `CanViewOwnGoals` read permission. The reference only checks team access while its endpoint requires own access. The personal-only page does not request the global goal register because the current API cannot bind the signed-in account to an employee. Team lists retain server paging, cycle filters and every field in the detail dialog. Create/edit/delete actions use exact keys, fresh complete employee/cycle goal reads, stable evidence and active employee verification. Goal dates must fall in the cycle, weights are integers 1–100 and total at most 100%, duplicate titles are refused, and progress is consistent with NotStarted/Completed. Closed cycles are protected. Soft deletion retains the backend audit behavior.

Reviews retain employee/cycle/reviewer identity, all statuses, explicit rating zero, both comments and submission timestamps, every submitted goal rating, approval flag and history. Start-review requires an active cycle, two distinct active employees and the backend's `CanManagePerformanceCycles` permission. Approval/rejection uses the dedicated HR page, fresh review evidence, actual assigned pending stage, requester separation, current permission and signed-in account identity before writing. Approval also reads every current goal and verifies exact coverage, unique ratings, percentages, total goal weight 100% and both submitted assessments. Generic pending approval decisions are disabled for PerformanceReview and link to the dedicated workflow.

## Incomplete / server prerequisites

Self-assessment and manager submission are **not complete**. ReviewerId references Employee, while ReportingManagerId references User. Neither session nor EmployeeDto exposes an authoritative user/employee link. The current submission endpoints enforce status but not ownership or reviewer assignment and upsert arbitrary goal IDs without employee/cycle validation. Do not compare user IDs to employee IDs or treat an email guess as authoritative ownership. A server-owned identity/ownership contract and corresponding tests are required before enabling these two writes or personal goals. The refresh-token and contractor-maintenance source repairs are applied locally; no backend performance ownership repair has been applied.

Cycle closure still relies on the user reconciling reviews; the server does not validate outstanding review states. Goal/assessment updates have no concurrency token. Backend approval stage selection also needs integration coverage. These are recorded gaps, not a claim of full parity.

## Checks

26 focused tests pass across performance rules, mocked approval interactions, dedicated approval entry, generic approval regressions and the date renderer. Cases include explicit zero values, stale evidence, foreign/missing/duplicate goals, invalid weights and dates, self/unassigned decisions and a refused write without replay. Web TypeScript and the production build passed. The complete suite passed: 1,254 web tests, 54 Node checks and 9 gateway tests. The full suite before performance had 1,214 passing web tests and one asynchronous date-field assertion failure; the test now independently awaits each lazy renderer and passes. No real performance records, approvals or notifications were created. Visual acceptance remains pending the running server/session repair.

Documentation updated: this file, the implementation index and scope.csv, services.md and workflows.md.
