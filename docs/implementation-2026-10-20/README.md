# Five-domain implementation — progress on 2026-10-22

User authorization: complete production internal stock transfers, reports, HR, general stores/services and Finance using Oryx Next as reference; correct baseline defects and omit no supported behavior.

All 101 reference routes, plus `/crm/jobs/job-request` and `/formula`, are now implemented in validation. [scope.csv](scope.csv) tracks them. Live acceptance waits on deploying the backend repair; see [stores-services-and-hr-2026-10-22.md](stores-services-and-hr-2026-10-22.md). Implemented does not mean full acceptance: fields, actions, permissions, state transitions, audit, failure handling, exports and attachments must all be verified.

## Current implementation

- Production transfers: incoming/outgoing lists, status filters, details and confirmed approve/reject; fresh ownership/state/material/quantity/permission checks and frozen confirmation evidence. Request creation checks current stock and permission. Warehouse issuing/receipt still needs integrated acceptance.
- Finance: five routes for payments/receipts, recording, assigned-stage review, cashflow, aging and currency/rates. Dedicated review endpoint, maker-checker, fresh evidence and assignment preflight. Automated tests cover stale/unassigned/self-review and refused decisions. Full live acceptance remains.
- Reports: all 21 reference routes and embedded variants are implemented through 33 report definitions, plus HR report aliases. Complete paginated reads, explicit contract normalization, snapshots, all-field details, readable print, Excel and CSV bundles. Production plans retain half batches; readiness distinguishes missing and unavailable definitions. The local desktop generated a live material stock summary with 991 rows. Other report/backend combinations remain to be checked in the signed-in app.
- HR: employee register, complete profile authoring/details, family/history, photo attachment retry, designation/warehouse assignment, status/type/email changes and invitations implemented. Attendance summary/day pages and validated workbook preview/upload added. Leave, overtime and staff requisition workflows are now implemented with focused tests. Compensation, payroll configuration, runs, reconciled approvals, payslips and original export viewing are now implemented with focused tests and a passing web build. Performance cycles, team goals and review creation/details/assigned decisions are implemented in validation. Personal goals and assessment submission require a server ownership contract; shift planning/calendar, confirmed assignments/replacements and validated/reconciled workbook import are implemented in validation. Public onboarding remains in progress. Department employee export now scopes and revalidates active employees before generating the shift template.
- General stores/services: store-vendor registration, full details, editing, deletion and complete-register search are implemented in validation. Service and contractor register/detail/CRUD/attachments are also implemented in validation, with a matching locally tested contractor backend repair. Inventory configuration CRUD/details/attachments, available stock/ledger, confirmed receiving decisions and damage/missing creation are now implemented in validation. Remaining issue/return/damage maintenance, procurement and job workflows remain pending.

## Checks so far

- Report/Finance/transfer/route coverage run: 280 passing tests.
- Employee, Finance, report/export and route coverage run: 284 passing tests, including profile status preservation, stale-record refusal, and retrying a photograph without repeating the profile write.
- Web TypeScript passed including attendance, department export and the session persistence fix.
- Session persistence now uses atomic serialized encrypted saves and renewal independent of page cancellation. Session regression checks pass. The backend refresh-token ownership fix is applied locally and its isolated renewal test passes; it is not deployed, so real desktop quit/relaunch acceptance remains.
- Documentation updated: `session-and-access.md`, `services.md`, `workflows.md`, and this progress note.
- All automated business mutations use mocked fetch. Live app checks are read-only. No deployment or production business mutation has been performed.

See [hr-requests-and-session.md](hr-requests-and-session.md) for the new workflows, server blockers, current verification and proposed backend patch.

See [reports-and-hr.md](reports-and-hr.md) for contracts and known baseline defects. Backend contracts are unchanged; client preflight cannot replace server authorization, concurrency control or audit guarantees.

Latest full verification before the store-vendor addition: 1,254 web tests, 54 Node checks and 9 gateway tests pass; web TypeScript and the production build pass. Store-vendor/route verification adds a focused 306-check run; its production build passed. Documentation updated: this progress index, `hr-requests-and-session.md`, scope.csv, `session-and-access.md`, `services.md`, and `workflows.md`.

See [payroll.md](payroll.md) for exact payroll contracts, permissions, server gaps and verification. Documentation updated for this stage: payroll.md, scope.csv, this index, services.md and workflows.md.

See [performance.md](performance.md) for the performance implementation, 26 focused checks and the remaining account/employee ownership prerequisite. Full parity is not claimed.

See [shifts.md](shifts.md) for the three new shift routes, actual server status mapping, import contracts and remaining server limitations. The 314 focused shift/workbook/route checks pass. The full suite (1,254 web, 54 Node, 9 gateway) and production web build passed after these performance/shift changes.

See [store-vendors.md](store-vendors.md) for the vendor route, full-register search workaround, permissions and remaining backend limitations.

See [services-and-contractors.md](services-and-contractors.md) for the four new service/provider routes, attachment safeguards and the locally tested backend association/deletion repair. The repair is not deployed. Focused frontend/route suites pass (323 plus one attachment interaction); nine backend tests pass.

## Latest verification — 2026-10-22

- Complete web suite: **1,280 tests / 244 files pass**, no unhandled errors, using `bun run --filter @oryx/web test --maxWorkers=2`. Two worker-start timeouts in an earlier resource-constrained run were resolved by bounding concurrency. An existing STP signature test now waits for its lazy password and meaning controls before asserting empty-password validation; signature/password/no-write assertions remain unchanged. The date-field test likewise independently awaits both lazy renderers.
- Node 54 and gateway 9 checks passed in the complete run; contractor backend maintenance 9 focused tests pass. The earlier refresh-token ownership regression passes separately.
- Production web build and TypeScript pass, including vendors/services/contractors. Routes and generated API checks are current. Known large editor/workbook chunk warnings remain.
- No production ERP mutation, notification send, commit, push or deployment was performed. Installed-app visual, packaged-shell restart and deployed-backend acceptance remain pending.
- Inventory: **all 103 tracked routes are implemented in validation** (101 reference routes plus `/crm/jobs/job-request` and `/formula`). The latest checks are in [stores-services-and-hr-2026-10-22.md](stores-services-and-hr-2026-10-22.md): 1,419 web tests, 54 Node checks, 9 gateway checks and the production build pass; backend 1,303 pass, with 3 failures that predate this work.

Documentation updated for this stage: this index, scope.csv, performance.md, shifts.md, store-vendors.md, services-and-contractors.md, remaining-gaps.md, Live services.md/workflows.md, and backend service-provider-maintenance.md/services.md/workflows.md.

See [inventory-and-stock.md](inventory-and-stock.md) for seven new inventory/stock routes, exact permissions, original read-only attachment controls and matching backend integrity repairs. Focused 353 frontend and 51 backend tests pass; the server repair is not deployed and desktop/session/target-screen acceptance remains.
