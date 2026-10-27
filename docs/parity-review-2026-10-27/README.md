# Implementation review against Oryx Next — 2026-10-27

Implementation follow-up: [quality and discrepancy workflow completion](../workflow-hardening-2026-10-27.md) records the repairs, verification and remaining release acceptance. This review preserves the findings and inventories from before that implementation.

The migration has advanced substantially since October 20, but current source has confirmed backend compatibility regressions in QA rejection and material retesting, missing rework/discrepancy follow-through, and unfinished domain suites. Passing local tests do not establish parity against the newer backend.

This is a source review and local verification, not deployed acceptance. Only documentation and inventories were changed. No business records, application/backend implementation, permissions, production configuration, or deployment was changed.

## Snapshot and coverage

| Repository | Reviewed commit |
| --- | --- |
| Live, `testing` | `037ec2e6d5259fc0da754258092d3f0a70700246` |
| Next | `d98f45d251d54db535974e07aa0fe2e4d151b74f` |
| Backend | `e63b7ff424028f7dbb27b84ed4525b763ca10e77` |

All three worktrees were clean at the start. Enumerated every `page.tsx`, removed pathless groups and normalized parameter names. Neither frontend has `page.ts` files; no duplicate normalized page shapes were found. Excluded the catch-all when checking concrete navigation coverage. Historical mapped-flow and incomplete-baseline classifications are retained as compatibility leads, not newly accepted behavioral equivalence.

| Classification | Next routes | Meaning |
| --- | ---: | --- |
| Same route shape | 313 | Concrete Live page; detailed behavioral acceptance still required. |
| Mapped flow | 30 | Previously identified replacement journey; old links and exact equivalence unaccepted. |
| Missing, previously recorded | 13 | QA OOS (2), quality audits (3), R&D (7), user manual (1). |
| Missing, added since old audit | 12 | Material retests (2), response rework (2), shipment discrepancies (3), stock discrepancies (3), expiry details (2). |
| Explicitly deferred | 41 | QC worksheets (29), governed full procedures/workflow templates (12). |
| Next itself incomplete | 6 | Historical baseline caveat, not six complete features lost. |
| Legacy route decision | 1 | ID-less `/access-management/roles/edit`. |
| **Total** | **416** | Every baseline page classified once in [routes.csv](routes.csv). |

Live has **340 page files**, including its catch-all, and **27 shapes without a Next counterpart** ([live-only.csv](live-only.csv)). Its catalog contains **192 distinct destinations**, of which **26 have no concrete page** ([navigation-without-page.csv](navigation-without-page.csv)). Page/menu counts are not feature-completion percentages.

## Findings in priority order

### P1 — QA result rejection sends an obsolete payload

[DecisionDialog, line 28](../../apps/web/src/modules/pending-approvals/components/decision-dialog.tsx#L28) sends only comments. The backend [Response rejection branch](../../../oryx-backend/APP/Repository/ApprovalRepository.cs#L2803) now requires `ResponseRejectionOutcome` for material/manufacturing-batch results and otherwise returns `Response.RejectionOutcome: Select rework or disposal.` Next already presents and submits that choice through its [approval dialog](../../../oryx-next/src/components/pages/qa/approvals/details/comments.tsx) and [disposition mutation](../../../oryx-next/src/lib/redux/api/response-rework.ts).

Live's [generated body](../../apps/web/src/shared/api/generated/approvals.ts#L575) and saved OpenAPI schema expose only comments. Material/product result rejection therefore fails against the reviewed backend, regardless of comment. This finding does not establish that approval fails.

Required: review/export the current contract and regenerate, add an explicit validated disposition choice, preserve specific reject permission, and test rework and disposal against handler validation. Never silently choose a disposition.

### P1 — Material retest controls call deliberately disabled endpoints

Live's [request/completion dialogs](../../apps/web/src/modules/qc-grn/components/batch-dialogs.tsx#L61) call `/material/batch/:id/request-retest` and `/complete-retest`. Both backend [methods](../../../oryx-backend/APP/Repository/MaterialRepository.cs#L3046) unconditionally return `MaterialRetest.UseWorkflow` conflicts. Live still offers a caller-entered expiry date; the backend now requires an issued compliant COA linked to a governed retest.

Next's [retest actions](../../../oryx-next/src/components/pages/qc/material-retests/detail/actions.tsx) cover assigned password-confirmed decisions, sample recording, acknowledgement and creating/linking a test request. Live has no equivalent module/adapter or `/qc/material-retests` pages. Its expiry lists also lack the two detail/request entry points. This concerns material retests, not the separate product ATR retest actions.

Required: migrate the governed journey and expiry entry points; reconcile its dependency on the held worksheet/test-request/COA suite. Replace obsolete controls without restoring unsafe backend endpoints.

### P1 — Rework has no QC continuation in Live

The backend creates rework tasks and starts a distinct new Response with history through [ResponseReworkService](../../../oryx-backend/APP/Services/QcWorksheets/ResponseReworkService.cs#L46). Next's [detail](../../../oryx-next/src/components/pages/qc/response-rework/detail.tsx) offers start, rejected/new results, history and navigation to the new test. Live has no `/qc/rework-tasks` pages or service call.

Rework created in Next against the shared backend thus lacks a corresponding Live queue/start/history journey. Fixing the rejection payload alone does not complete this workflow. Implement exact new-response routing, specific permissions, fresh task-state validation, preserved old results and safe duplicate/lost-response handling for both material and product stages.

### P1 — Stock/shipment discrepancies and their decisions are missing

Six Next routes cover creation/list/detail. [Stock detail](../../../oryx-next/src/components/pages/supply-chain/warehouse/stock-discrepancies/detail.tsx) reconciles approved variances; [shipment detail](../../../oryx-next/src/components/pages/supply-chain/logistics/shipment/discrepancies/detail.tsx) supports supplier-shortage follow-up. Neither has a Live module/page. Existing stock adjustments use separate contracts and do not establish equivalence.

`StockDiscrepancy` and `ShipmentDiscrepancy` are absent from Live's [readable approval types](../../apps/web/src/modules/pending-approvals/lib/approval-documents.ts#L13), so generic approval details disable decisions. That refusal is safe but leaves the task unfinished.

Required: count/evidence capture, document-specific permissions, assigned-stage decisions, supplier make-up balances, stock/bin-card/ledger reconciliation, stale snapshots and duplicate-write handling. Do not enable generic decisions before evidence is readable.

### P1 — OOS initiation lacks a write-time permission check and sufficient server gates

The launch button checks `CanInitiateOosInvestigation`, but [dialog submission](../../apps/web/src/modules/pending-approvals/components/details/start-oos-dialog.tsx#L50) never calls `usePermissionAction(...).check()`. After a permission refresh removes the launch button, an already-open dialog remains mounted and can submit.

The backend [controller](../../../oryx-backend/Api/Controllers/OosInvestigationController.cs#L12) requires authentication without the action-specific permission. [Initiation](../../../oryx-backend/APP/Repository/OosInvestigationRepository.cs#L17) reopens ATR testing or quarantines the batch without checking for an existing investigation or an eligible current state. This server weakness is shared infrastructure, not a newly introduced Live-only backend defect. The dialog warns about duplicates instead of preventing them.

Required: check current permission inside validated submit and enforce it server-side; validate subject/state/existing investigations and safe retry behavior. Finish the investigation workflow too: Live currently tells users to continue in the web app.

### P2 — Generic approval confirmation also misses its final access/evidence check

The [detail page](../../apps/web/src/modules/pending-approvals/components/approval-detail-page.tsx) gates launch buttons, but [DecisionDialog](../../apps/web/src/modules/pending-approvals/components/decision-dialog.tsx#L24) never rechecks `decisionPermission(type, decision)` before writing or rereads document evidence while confirmation is open. Backend assignment checks remain; this is not evidence that arbitrary unassigned users can decide records.

Required: current permission/identity check immediately before writing, fresh pending assignment and document evidence, refusal after changes, and tests revoking access with an open dialog. Preserve document-specific ownership/state/reconciliation checks.

### P2 — Navigation advertises unavailable screens and has drifted from Next

[visibleNavigation](../../apps/web/src/modules/navigation/navigation-model.ts#L35) checks permissions but not availability. The 26 destinations in the CSV reach the [migration catch-all](../../apps/web/src/pages/(workspace)/[...rest]/page.tsx) or an access fallback rather than their workflow. The imported catalog also omits Next's newer retest, rework and two discrepancy entries.

Required: explicit availability policy for held/unavailable destinations, reconcile retired baseline entries, and add route-availability/catalog freshness checks. Existing route-coverage tests check permissions only for pages already present, so cannot catch these omissions.

## Remaining domains and scope decisions

| Area | Outstanding work |
| --- | --- |
| QA OOS | Register/details, investigation findings and corrective/preventive fields, submit, QA review, release/rejection follow-through. Initiation does not complete it. |
| Quality audits | Create/list/detail, checklist/findings, CAPA linking and status actions. The access-management audit log is a different feature. |
| R&D | Seven routes, including project workspaces with formulations, trial batches, methods, stability/pull points, technology transfer and development reports; formulation reviews and chambers. Approval readers do not replace execution/authoring. |
| QC worksheets | All 29 routes remain absent under the exclusion recorded in `quality-migration.md`: templates/import, specs/proposals, requests, test room, review/signing, OOS, certificates, monitoring/water and setup. Retest integration now depends on resolving this scope. |
| Governed procedures | Twelve routes remain on hold: areas, four template kinds, procedure review and workflow templates. Ordinary STPs/product procedures/approval configuration are separate implemented features. |
| Compatibility/help | Thirty historical mapped flows need old-link/parameter/print acceptance; ID-less role edit needs a decision; user manual remains absent. |

The six historical incomplete Next routes are warehouse allocations, product-allocation list/detail, schedule product-flow, invoice waybill creation and `/qa/bmr-bpr`. Their old classifications are retained. This review does not revoke exclusions/holds or authorize their implementation.

## Implemented areas and acceptance still outstanding

Finance, production transfer review, all 21 reference report routes, HR/payroll/performance/shifts, general stores/services, onboarding, CRM job requests, `/formula` and four independent formula review/approval routes have concrete Live pages. The ledger shows **101 formerly unported routes and four formerly partial formula routes now matching**. Do not rebuild them from the old backlog.

Acceptance remains for exact deployed backend/session version and real restricted accounts; assigned-stage/maker-checker decisions; transfer issue/receipt and stock reconciliation; report totals/exports; payroll generation/rejection/resubmission and bank details; shift import reconciliation; invitation expiry/single use; ownership; attachments and failure/retry behavior. Existing notes document server limitations; route presence cannot close them.

Older notes describing backend repairs as **uncommitted** are stale: the reviewed backend tree is clean and includes the repairs. Deployment/migration status was not inspected, so neither deployed nor undeployed is asserted. Old anonymous-employee-read claims are also stale: the current employee controller has class-level `[Authorize]`. Action-specific employee read authorization still merits separate backend review.

## Desktop and maintenance leftovers

- Signed installers and automatic shell updates remain absent as documented in `deployment.md`. The customer-server package now implements contract fingerprint/minimum-shell checks and atomic activation/recovery; the old blanket claim of no compatibility gate is stale. Installed-client coverage and customer systemd/Nginx acceptance remain unverified.
- Target Windows 1366×768 / 1280×720 and 125%/150% scaling, dense/long records, keyboard/accessibility, outages, packaged quit/relaunch and update/restart/rollback acceptance were not run. No measured performance budget is claimed.
- Every Live route page meets the 200-line limit. Large imported formula components still contain broad casts/`unknown` and hand-rolled controls. Confirmed accessibility example: the expression textarea and constant fields in `shared/formula/ui/types/expression/universal/panels/expression.tsx` (808, 841, 849) lack associated accessible labels.
- React Doctor scanned 2,372 files: **68/100**, **15 errors / 449 warnings**. Eight root-boundary errors point to test fixtures, not production branches. Object-URL warnings overlook caller revocation; two impure-updater errors target custom synchronous setters. Five render-time ref writes need concurrent-render/session review; no business failure was reproduced. `.strict()` deprecation warnings do not establish broken Zod 4 parsing. The remaining diagnostics are hypotheses, not 464 confirmed bugs.
- Production build succeeds with large chunk warnings: ExcelJS about 930 kB, main index 528 kB, rich text editor 461 kB before gzip. These are emitted sizes, not measured startup/memory results.
- `docs/api-codegen.md` and old audit counts lag the generated backlog: **1,092 typed / 243 skipped operations** now. Skipped operations are not a count of missing features. `api:check` verifies generation against the saved contract; it does not prove freshness against backend source. The missing rejection field demonstrates this gap.

## Verification performed

| Check | Result |
| --- | --- |
| Bun | 1.3.14 |
| Route/API generation checks | Passed; saved-contract caveat above |
| Workspace/web/desktop/gateway TypeScript | Passed |
| Web suite, bounded to two workers | **1,528 tests / 280 files passed** |
| Root Node tests | **75 passed** across initial run plus focused rerun; one Linux-only flock test skipped on macOS. HTTP listener initially hit sandbox `EPERM`, then passed with loopback permission. |
| Gateway | **12 passed**, with loopback permission |
| Desktop unit tests | **8 passed** |
| Production web build | Passed with chunk warnings |
| React Doctor | Completed with diagnostics; its failed exit reports findings, not compilation failure |
| Inventory | 416 unique baseline shapes classified once, 340 Live pages, 26 unavailable destinations, no route page over 200 lines |

Backend tests, live API acceptance, production writes, deployed-site inspection, customer installation and Windows visual testing were not run. No commit, push or deployment was performed.

## Recommended completion order

1. Align the contract/QA rejection payload, replace obsolete material retest controls and add rework continuation.
2. Close OOS write-time/server authorization, state and duplicate handling; finish investigations and audits/CAPA.
3. Deliver stock/shipment discrepancies with assigned decisions, supplier balances and ledger reconciliation.
4. Resolve worksheet/procedure holds before dependent governed retest/signature work; complete R&D.
5. Reconcile availability/deep links; accept implemented modules using identical Next/Live fixtures and validate the installed Windows release.

Documentation added: this report and its three CSV inventories. The historical audit links here for current status. Architecture and workflow behavior were not changed.
