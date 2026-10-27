# Oryx Live / Oryx Next implementation parity — 2026-10-20

Historical snapshot. Use the [2026-10-27 source review and refreshed route ledger](parity-review-2026-10-27/README.md) for current gaps, later implementations and backend compatibility regressions.

Oryx Live is a substantial but incomplete migration. Core procurement, logistics, warehouse, production and legacy QC flows have implementations. Major domain workflows and independent reviewer journeys remain missing. Matching a menu, endpoint or URL does not establish functional parity.

## Scope and evidence

Compared the local source trees in sibling repositories `oryx-next` and `oryx-live-desktop`, including every route page, the Live navigation catalog, module manifests, selected high-risk actions, shared attachment/formula components and migration notes. Both working trees were clean when inventoried.

- Next verified HEAD: `26220a236ea783879b3333cb51e7ac74a5e4ba90`.
- Live verified HEAD: `c10dea3d1a100602edad199b48fadd4c4dac034b`.

This is a source audit with focused local checks, not acceptance of every screen or the deployed sites on ports 3006/3011. No production records, inventory, approvals or file bytes were changed. No deployment occurred.

## Route inventory

There are **404 Next page routes** and **227 Live page routes**, including authentication, dashboards, utilities and Live's migration catch-all. Removing route-group folders and normalizing dynamic parameter names gives **208 identical URL shapes** and **19 Live-only shapes**.

All 404 Next routes are classified in the [route ledger](parity-routes-2026-10-20/README.md):

| Classification | Next routes | Meaning |
| --- | ---: | --- |
| `same-route` | 208 | Live has a concrete page at the same URL shape; behavior remains subject to acceptance. |
| `mapped-flow` | 30 | A corresponding journey exists under another URL, in a dialog, or as shared UI; exact equivalence and old-link conversion are not claimed. |
| `unported` | 114 | No equivalent complete Live screen identified; API/dashboard/approval-detail support alone does not replace it. |
| `deferred` | 41 | Absent suites with recorded scope exclusions/holds: 29 QC worksheet routes and 12 full-procedure routes. |
| `partial` | 4 | Formula review/approval queues and dedicated details are absent; inline lifecycle actions exist. |
| `next-incomplete` | 6 | Next itself has a broken, placeholder or no-op baseline. Requires a product decision, not a blind copy. |
| `legacy-route` | 1 | Next's role edit URL without an ID needs an explicit compatibility decision. |

These are route counts, **not a completion percentage** or a count of independent business features. Multiple URLs can render the same component. A Live-only route can replace a Next route. A route can exist while still lacking an action or field.

Detailed evidence and completion criteria are in the [prioritized backlog](parity-backlog-2026-10-20.md).

## What is not done

| Area | Finding | Existing Live coverage / distinction |
| --- | --- | --- |
| Finance | All 5 `/finance/*` routes absent: payments, payment details, payment approval queue/details and cashflow. | Billing charges/payment initiation exists. General pending approvals deliberately sends Payment decisions elsewhere, but the dedicated Finance screens do not exist. |
| HR / people | 29 of 31 `/hr/*` routes absent, plus onboarding and 2 shift-planning routes: **32 absent routes**. | Designations, leave configuration, HR dashboards and some generic approval evidence exist. Employee operations, attendance, compensation, leave/overtime/staff-request management, payroll, payslips, goals and performance journeys are not migrated. |
| General stores / services | All 39 `/extrals/*` routes absent. | Includes general inventory, receiving/issue/returns, stock and purchase requisitions, vendors, service providers, job requests/orders and service procurement. Ordinary pharmaceutical procurement is implemented separately. |
| Reports | All 21 `/reports/*` routes absent. | Dashboard KPIs, schedule monthly reports and local exports do not replace the warehouse, valuation, stores, procurement, FG transfer, HR and QC/QA report workspace. Includes two procurement URLs using one Next component. |
| R&D | All 7 `/rnd/*` routes absent. | Generic approval details can read R&D documents. Project authoring/editing, formulation review workspace and stability-chamber management are absent. |
| Quality audit / investigations | 3 `/audit/quality-audits/*` and 2 `/qa/oos-investigations/*` routes absent. | The existing audit-trail viewer is a different feature. Starting an OOS investigation from a rejected result exists; investigation list/detail/review/closure journeys are missing. |
| QC worksheets | All 29 `/qc/worksheets/*` routes absent. | Separate from implemented legacy GRN/ATR testing, STPs, specifications, routine QC and COA rendering. Historical quality migration records an intentional exclusion. |
| Governed procedures | All 12 `/settings/full-procedures/*` routes absent. | Areas, governed template kinds, procedure review and workflow-template authoring/review are missing. Historical notes record a 2026-10-15 hold. Ordinary product procedures, STPs and approval-workflow settings are different implemented features. |
| Formula review / approval | 4 dedicated QA routes missing; editor-only substitute has an access gap. | Server validation, submit, record-review and approve actions exist inline. Reviewers/approvers without question-edit permission cannot reach that page. |
| Production transfers | 2 `/production/stock-transfer-requests*` routes absent. | Warehouse can issue approved transfers and receive/shelve stock. It does not provide production's incoming-request approval/rejection journey. |
| Other gaps | CRM job-request page, user manual and standalone R&D expression-builder page absent. | The standalone `/formula` utility is distinct from the implemented QC question/formula builder. |

Deferred suites remain parity gaps. Their historical holds are reported separately from accidental bugs; this audit does not change their scope or authorize implementation.

## Confirmed behavioral gaps

### 1. Independent formula reviewers need question-edit permission

Next's dedicated QA review/approval pages use their respective view permissions and revision-specific read APIs. Live's [question manifest](../apps/web/src/modules/questions/manifest.ts) requires **both `CanViewQuestions` and `CanEditQuestions`** for `/settings/questions/formula/:id/edit`. That is the only page mounting its [formula revision panel](../apps/web/src/modules/questions/components/formula-revision-panel.tsx).

The panel correctly distinguishes `CanReviewFormulaRevision` and `CanApproveFormulaRevision`, but the outer route denies users before those actions can render. A local policy evaluation confirmed denial even when all formula-review/approval permissions plus `CanViewQuestions` are granted. This reproduces a source-level access problem; it does not establish the cause of every reported super-account denial.

Required work: dedicated read-only QA queues/details with separate view/action permissions, exact revision selection, evidence and history. Keep server separation-of-duties and definition-hash validation; do not grant edit access merely to let someone review.

### 2. The sidebar advertises screens that do not exist

The [generated catalog](../apps/web/src/modules/navigation/catalog.generated.ts) contains 194 path-bearing entries, 192 distinct destinations including query variants. **77 destinations have no concrete Live page**. Visibility checks permissions, not migration completion; users granted those permissions can encounter a migration placeholder. See [all 77 destinations](parity-routes-2026-10-20/navigation-without-page.csv).

The [catch-all](<../apps/web/src/pages/(workspace)/[...rest]/page.tsx>) explicitly says the screen has not been moved. That is different from a permission rejection. Some destinations point to deferred or already-broken Next screens. Decide which remain visible with an explicit availability state; build the actual workflows before representing them as available.

### 3. Dedicated signing and payment queues are not replaced by generic approvals

[Approval routing](../apps/web/src/modules/pending-approvals/lib/approval-documents.ts) deliberately excludes Payment, formula/procedure revisions, `Qc…` documents and governed template revisions from generic decisions. QC signing requires password re-entry. The missing dedicated suites therefore leave real user journeys unfinished despite a working generic queue. Do not route these documents through generic approve/reject to close the gap.

### 4. Production transfer approval is missing, although issue/receipt exists

Next's production transfer list reads new inbound requests and exposes approve/reject mutations. Live's [warehouse transfer UI](../apps/web/src/modules/stock-transfers/components/transfer-pages.tsx) lists approved/issued transfers and exposes issue; its [API adapter](../apps/web/src/modules/stock-transfers/transfer-api.ts) does not connect approval/rejection. Preserve the separate stages when implementing production review.

## Existing implementation that should not be rebuilt as missing

| Previously reported area | Current source result | Remaining acceptance |
| --- | --- | --- |
| Literal HTML tags in test content | Shared sanitized rich-text display and Next-derived question/formula views exist. | Check representative saved data, formula types, table/attachment questions and dark/light themes against Next. |
| COA approval / assay rendering | Detailed approval worksheet, compact COA results, issued-certificate display and formula-envelope readers exist. Generate-approved-COA is wired into approval detail. | Real-data comparison for assay/LoD, zero/missing readings and governed stored results. Never invent missing bindings or recalculate an issued snapshot from today's template. |
| GRN Unknown status / distribution | Shared batch-status reader, explicit missing/unrecognized labels and reviewed distribution dialog exist. Distribution re-reads allocations and permissions before mutation. | Compare actual payload aliases and approval status against Next; verify authorized distribution/reload/duplicate/failure behavior in a test environment. Unknown raw codes remain explicitly unknown. |
| Attachments | Shared read-only PDF/DOCX/XLSX and image preview is integrated across file entry points; no Open original action. | Other formats remain unsupported, and size/package/encryption restrictions apply. All attachments entering the viewer does not mean all formats render. Real MinIO fixtures and installed Windows/scaling coverage remain necessary. |
| Users / roles / warehouses | Role changes and store create/edit use dialogs; role editing has a new route. | Old deep links and independent view/edit permissions need acceptance. |
| Test completion | Batch/ATR test, assign/reassign, specification completion and certificate preview have domain routes/dialogs. | Legacy `/complete*`, two-ID ATR/GRN links and parameter conversions need a compatibility decision. |
| Product/schedule work | Product info/spec details moved; shortage requisitions are raised from schedule details. | Confirm preserved actions, not identical URLs. |

Evidence: [COA rendering note](coa-approval-formulas-2026-10-19.md), [attachment audit](attachment-audit.md), [read-only viewer details](attachment-viewers.md), `modules/quarantine-area/hooks/use-distribution.ts` and `shared/material-batches/batch-status.ts`.

## Baseline defects and shared limits

Six unmatched routes are not sound Next implementations: warehouse allocations, product-allocation list/detail, schedule product-flow, invoice waybill creation and `/qa/bmr-bpr`. Source evidence and alternatives are recorded per route. Do not count these as six complete features lost in Live.

The governed scalar adapter's rejection of worksheet/source-aware configurations is byte-identical in both repositories (`src/formula/builder/scalar-adapter-guard.ts` versus Live's shared formula copy). The universal adapter is separate. This is a shared supported-scope limit, not evidence that Live alone lacks the whole formula engine.

Live uses active-module `Access` grants, query-kind restrictions, department constraints and separate action permissions. A super/admin role name does not itself bypass route policy. Do not remove those guards to make source parity appear complete; compare the actual session payload and required permissions for each rejected route.

Generated API coverage records **1,078 typed operations and 246 skipped operations** in [api-untyped-operations.md](api-untyped-operations.md). Skipped operations have insufficient strict contracts. Several are already covered by handwritten adapters, so 246 is neither the number of missing screens nor proof that all those features are blocked.

## Completion order and acceptance

1. Repair independent formula-review access; deliver dedicated queues and exact revision/evidence views.
2. Finish production transfer review, Finance/payment decisions, and QA OOS/audit follow-through with correct transitions, audit metadata and retry behavior.
3. Reconcile the recorded scope holds before scheduling QC worksheets and governed full-procedure/template signing. Preserve password re-entry and separation of duties.
4. Complete people/payroll, general stores/services, R&D and report workspaces as domain migrations; shared evidence viewers do not complete those domains.
5. Resolve obsolete/deep-link routes and menu availability; separately decide whether incomplete Next screens should be completed or retired.
6. Accept existing flows against Next using the same non-production fixtures and representative restricted users, then validate the release actually served to the desktop.

Each workflow needs: fields/attachments and print/export comparisons; exact view/create/edit/decision permissions; department/kind/state gates; validation and status transitions; audit fields; failures, stale data and duplicate actions. Use controlled test data for writes. Route presence alone cannot close any of these checks.

Separate desktop release-readiness work remains: signed installers, automatic shell updates, an evidenced API/minimum-shell compatibility gate, and measured Windows 125%/150% scaling and performance acceptance. [Deployment notes](deployment.md) already document unsigned/manual shell upgrades. These are native release gaps, not regressions against a browser application.

## Verification and documentation

- Re-enumerated every page file in both trees; no duplicate normalized Next shapes; classified all 404 exactly once.
- Compared all 192 distinct navigation destinations against concrete Live routes, excluding the catch-all.
- `bun run routes:check` passed.
- Focused Live web suites (`route-coverage`, `formula-question`, `approval-ard-actions`): **231 tests passed in 3 files**.
- Native Node navigation/module-registry/route-generation suites: **22 tests passed**.
- Direct route-policy evaluation reproduced the review-only formula denial.
- No full build, full regression run, deployed-site inspection or all-page manual acceptance was performed for this documentation-only audit. The existing route-coverage suite tests Live pages, not completeness against Next.

Documentation added: this report, its classified route/navigation CSVs and evidence/backlog companion; Next receives a cross-repository audit index. Older migration notes describe historical milestones and can be stale (notably product-spec QC completion and commercial COA generation, both present now). Current source and this dated inventory take precedence for this snapshot. Service contracts, runtime behavior and workflow transitions were not modified.
