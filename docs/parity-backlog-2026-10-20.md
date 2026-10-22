# Parity backlog and source evidence — 2026-10-20

Companion to [the audit](implementation-parity-2026-10-20.md). Priorities below are recommended sequencing, not implementation authorization or a change to recorded holds. Every unmatched URL is in the [classified ledger](parity-routes-2026-10-20/README.md).

## P1: approval, quality and inventory journeys

| ID | Gap and evidence | Completion criteria |
| --- | --- | --- |
| P-01 | Formula reviewer route requires authoring access. Live [manifest](../apps/web/src/modules/questions/manifest.ts) and [revision panel](../apps/web/src/modules/questions/components/formula-revision-panel.tsx); Next [QA revision detail](../../oryx-next/src/components/pages/qa/formula-revisions/detail.tsx) and [queue](../../oryx-next/src/components/pages/qa/formula-revisions/queue.tsx). | Separate review/approval queues and views; grant their view and action permissions independently; read exact revision/hash, validation cases and history; reject stale/unauthorized decisions; retain server author/reviewer/approver restrictions. Test roles without CanEditQuestions. **Built 2026-10-22** (uncommitted): `/qa/formula-reviews` and `/qa/formula-approvals` with exact-revision detail; see quality-migration.md. Live acceptance with real review-only and approve-only users remains. |
| P-02 | Payment decisions point to a missing Finance workspace. Live [approval routing](../apps/web/src/modules/pending-approvals/lib/approval-documents.ts); Next [payment approvals](../../oryx-next/src/features/erp-expansion/cashflow/payment-approvals.tsx), [approval detail](../../oryx-next/src/features/erp-expansion/cashflow/payment-approval-detail.tsx), [register](../../oryx-next/src/features/erp-expansion/cashflow/payment-register.tsx), [cashflow](../../oryx-next/src/features/erp-expansion/cashflow/dashboard.tsx). | Register, record/read evidence, approval/rejection and reconciliation/reporting paths; correct currency totals, linked payable identities, no duplicate financial effects; exact permission/state gates and audit metadata. Use the Finance decision contract. |
| P-03 | Production incoming stock-transfer approval/rejection absent. Next [list](../../oryx-next/src/components/pages/production/stock-transfer-requests/index.tsx) and [actions](../../oryx-next/src/components/pages/production/stock-transfer-requests/columns.tsx); Live [warehouse issue adapter](../apps/web/src/modules/stock-transfers/transfer-api.ts). | Pending inbound/outbound visibility, reason/evidence and correct approve/reject transitions; issue remains a distinct warehouse action; approval/issue/receipt each observable and auditable. Test wrong department, rejection and already-processed requests. |
| P-04 | OOS can be initiated but the QA investigation workspace is absent. Next [investigation detail](../../oryx-next/src/components/pages/qa/oos-investigations/details/index.tsx); Live [start dialog](../apps/web/src/modules/pending-approvals/components/details/start-oos-dialog.tsx). | Investigator/reviewer list and detail, evidence and decisions, correct outcome/closure transitions and links back to the affected sample/result. Verify audit and access without changing the original result silently. |
| P-05 | Quality audit authoring/findings/CAPA journey absent. Next [audit detail](../../oryx-next/src/components/pages/audit/quality-audits/details/index.tsx), [findings](../../oryx-next/src/components/pages/audit/quality-audits/details/findings-panel.tsx), [CAPA](../../oryx-next/src/components/pages/audit/quality-audits/details/capa-section.tsx). | Audit list/create/detail, checklists/findings, linked corrective actions, lifecycle controls and permissions; distinguish from system audit-trail browsing. |

## Recorded holds / exclusions: decide scope before scheduling

| ID | Gap and baseline | Completion criteria when included |
| --- | --- | --- |
| D-01 | 29 QC worksheet routes absent. Scope exclusion recorded in [quality-migration.md](quality-migration.md); Next sources under `src/features/` and QC worksheet route exports. | Specifications/proposals, STP/template import and versioning, sampling groups, requests, test-room execution, review, OOS, certificates, water quality/monitoring and signed approvals. Preserve signature meaning/password re-entry, immutable released evidence and approval boundaries. Legacy QC forms do not substitute for this suite. |
| D-02 | 12 governed procedure/template/workflow routes absent. Hold recorded for 2026-10-15. Next [template lifecycle](../../oryx-next/src/components/pages/settings/full-procedures/templates/lifecycle.tsx), [template review](../../oryx-next/src/components/pages/settings/full-procedures/templates/review.tsx), [procedure review](../../oryx-next/src/components/pages/settings/full-procedures/procedures/review.tsx), [workflow review](../../oryx-next/src/components/pages/settings/full-procedures/workflows/review.tsx). | Area grants and ownership, all template kinds, draft/submit/review/approve/version handling, workflow authoring, linked procedure evidence and audit. Do not confuse product procedure editing or generic approval settings with governed revision review. |

## P2: remaining operational domains

| ID | Unfinished work | Definition of the missing journey |
| --- | --- | --- |
| P-06 | People: 29 HR routes plus onboarding and 2 shift-planning routes. | Employee create/edit/detail and attachments, attendance import/report/export, compensation, staff/leave/overtime requests, payroll configuration/runs/payslips, goals/performance and shift planning. HR dashboards and generic request approval evidence are partial support only. |
| P-07 | All 39 general stores/services routes. | General inventory configuration and movement, vendors, procurement sourcing/comparison/memos, requisitions/issue/returns, service providers, job requests/orders and service procurement. Keep these contracts distinct from pharmaceutical material procurement and stock. |
| P-08 | All 7 R&D routes. | Project create/edit/detail, formulation review and stability-chamber management, linked to trials/technology transfer as supported by Next. Reading an R&D document in the approval queue does not implement its authoring workflow. |
| P-09 | All 21 report routes. | Warehouse stock/valuation, store inventory, procurement, finished-goods transfers, HR and QC/QA reports with filters, complete pagination, totals, exports, permissions and reconciliation. Report counts include URL aliases, not 21 independent reports. |
| P-10 | CRM job-request page. | Deliver the dedicated job-request journey or document the intended replacement; existing generic job approvals and `/extrals/job-requests` are different entry points. |

Prioritize payroll/reconciliation parts of P-06/P-09 according to their financial impact; do not postpone integrity work merely because the domain appears in P2.

## P2/P3: navigation and compatibility

| ID | Work | Acceptance |
| --- | --- | --- |
| P-11 | 77 catalog destinations without a page. | Explicit available/deferred state or completed workflow; no permission change masquerading as a migration fix. Search and sidebar must describe actual availability. Include restricted users and all-permission users. |
| P-12 | Renamed URLs and consolidated dialogs. | Decide compatibility for `/signin`, old role edit URLs, singular template URLs, ATR/GRN two-ID links, `/complete*`, product edit/spec links and receiving checklists. Preserve record identity and query intent. Test redirects without write side effects; retire invalid ID-less edit deliberately. |
| P-13 | Six incomplete Next routes. | Decide complete versus retire: warehouse allocations/product allocation, product flow, invoice waybill creation and QA BMR/BPR dead screen. Keep working approved-products, issue-BMR and logistics waybill journeys distinct. |
| P-14 | Help and standalone R&D formula utility. | User manual/help and `/formula` expression utility require migration or documented retirement. Existing QC formula question builder is not an automatic replacement. |

## Acceptance backlog for source-present features

| Surface | Read-only comparison | Controlled workflow checks |
| --- | --- | --- |
| Test / approval / COA | Same representative saved assays, LoD, tables, rich text, attachments, blank versus true zero, stored governed results, specimen metadata and print layout. | Assignment ownership, save/draft/submit, approve/reject and immutable certificate generation using authorized test fixtures. Never mutate issued results during preview. |
| GRN / distribution | Same server status/code and payload aliases; quantities, expiry and allocation breakdown. | Permission/kind/department limits; reviewed plan, fresh allocation reads, no duplicate distribution, failure recovery and record reload. |
| Attachments | MinIO PDF/DOCX/XLSX and image fixtures, filenames and authenticated/protected reads; read-only selection/search/zoom/sheet tabs. | Verify no editing/saving writes, timeouts/cancellation and clear unsupported/encrypted/oversized errors. Source policy is not a claim that arbitrary formats are supported. |
| Existing commercial/production/warehouse pages | Per-field/action matrix, sorting/filter/pagination, attachments and export/print for matching routes. | State restrictions, required reasons, request contracts, audit headers and stale/failure/retry behavior; use representative restricted users. |
| Desktop / deployed release | Current asset/engine hashes, installed shell compatibility, target screen sizes and Windows scaling. | Signed installer/update/rollback and measured startup/route/memory behavior. Reinstall/manual shell upgrades remain documented limits. |

No new domain endpoints or workflow transitions were designed by this audit. For each implementation, inspect the current backend contract, authorization and validation before choosing an adapter; regenerated strict API hooks may need contract fixes. Generated-but-unused endpoints do not complete a workflow, and skipped generated endpoints may already have handwritten adapters.

## Evidence rules and known uncertainty

- `same-route` is an existence check; `mapped-flow` is a source-level journey mapping. Neither is an assertion that all controls, calculations or print layouts match.
- `unported` identifies missing Live screens relative to identifiable Next routes. Next itself was not fully exercised, so these are migration candidates rather than proof that every baseline action works.
- Historical notes conflict with newer source: QC product-spec completion and commercial certificate generation are now present; generic statements that all formula review is absent are outdated because an inline panel exists.
- The scalar-adapter guard is shared by both implementations. Missing input-only historical COA results cannot safely be reconstructed with current templates merely to improve presentation.
- Backend permission enforcement, concurrent mutation guarantees, installed Windows acceptance and deployed build freshness were not established by this source audit.

Documentation added: audit, backlog/evidence, complete classified route ledgers and the Next cross-repository index. No application behavior changed.
