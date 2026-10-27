# Quality and discrepancy workflow completion

This implementation addresses the blocking findings in [the parity review](parity-review-2026-10-27/README.md). It changes both `oryx-live-desktop` and the companion `oryx-backend`; deploy the backend contract before activating this UI release. Unrelated worksheet-template, full-procedure and R&D migration holds remain in place.

## Delivered behavior

| Finding | Result |
| --- | --- |
| QA rejection compatibility | Rejecting a Response requires an explicit **rework testing** or **disposal** choice. The request carries `responseRejectionOutcome`, with no default disposition. |
| Obsolete material retesting | GRN and expiry screens open governed retest requests. The register provides signed decisions, sampling, acknowledgement, linking or transactional creation of pinned testing, worksheet execution/review, OOS continuation and linked certificate issuance. The UI no longer calls the retired request/complete endpoints. Only compliant certificate issuance can extend expiry; failed certificates preserve expiry and hold the batch. |
| QC rework continuation | A task starts a separate response cycle, preserves original results and sampling context, displays cycle history, uses pinned form field membership, and submits the exact reviewed response to QA. A changed response cycle is refused by the backend. |
| Stock discrepancies | Shelf/batch counts preserve the system snapshot, require an observation and variance, enter approval, and reconcile through the existing audited ledger service. Reconciliation rereads the report and current shelf evidence. |
| Shipment discrepancies | Reports reference exact invoice lines and units. Approved shortages show supplier balances and create idempotent make-up invoices through the existing governed service, without changing received stock directly. |
| OOS investigations | Writes use explicit backend permissions and a current grant check. Initiation requires one subject, a current rejected response, an eligible state and no conflicting investigation. Disposal and permanent rejection cannot be reopened. Submission requires meaningful findings; QA approval also checks findings and current QC readiness. Authors/submitters cannot review their own investigation. |
| Generic approvals | Confirmations freeze reviewed evidence, reread assignment and source evidence without cache, and check current permission and identity immediately before mutation. Changed evidence requires a new review. A sent request cannot be blindly repeated from the same confirmation after an uncertain response. |
| Navigation gaps | Navigation is filtered against concrete file routes before permission filtering. Missing pages are hidden; a missing parent survives only as a heading for available children. Catch-all routes do not count as implemented destinations. |

## Integrity and access

New route families have typed module manifests and explicit read/action keys. Forms use React Hook Form, Zod and the shared lazy field composer; dialogs scroll their body while retaining their header and footer.

Governed worksheet files use an authenticated instance endpoint. Uploads require the assigned analyst, the correct chemical/microbial entry key and an in-progress worksheet. References are append-only and uploads serialize against instance transitions. Generic anonymous file routes cannot read or replace these files, and generic deletion cannot remove them. Protected reads use bearer-authenticated Blob requests. Storage errors do not report a saved file.

Entered worksheet strings and coordinates are retained, including tiny quantities and table/reagent sub-values. Constants, fixed cells, formulas and referenced results remain server-owned. Original and linked OOS retest worksheets stay accessible; QA signs an explicit disposition under the existing approval chain. Assignment and audited reassignment use separate permissions.

OOS keys use the names already used by Oryx Next: `CanInitiateOosInvestigation`, `CanViewOosInvestigations`, `CanSubmitOosInvestigation`, and `CanReviewOosInvestigation`. They are registered in the backend catalogue. Check intended role grants before rollout; there is no permission grant based on role name or implicit administrator bypass.

## Contract and rollout

The backend supports `dotnet API.dll --export-openapi /absolute/path/backend.json` from its build directory. This exports metadata before seeding, listeners or hosted workers start. Import it with `ORYX_OPENAPI_FILE=/absolute/path/backend.json bun run api:export`, then run `bun run api:generate` and `bun run api:check`. Do not hand-edit generated hooks. Binary protected file reads have a typed handwritten Blob adapter.

The customer-server compatibility policy accepts the reviewed companion contract only. The shell minimum is unchanged because this work adds no native bridge requirement. Existing backend workflow migrations must already be applied; this implementation introduces no new database migration.

Before production activation, verify the deployed contract and role grants, then run acceptance with restricted QC/QA/warehouse/logistics accounts against staging: rejection → separate rework → QA, compliant/noncompliant retest issuance, OOS hold/disposition, stale stock reconciliation, and concurrent supplier make-up allocations. Verify installed Windows at 125% and 150% scaling and the customer's deployment/rollback path. Local tests and browser fixtures do not replace these checks.

## Verification

| Check | Result |
| --- | --- |
| Web tests | 1,560 passed across 284 files, bounded to two workers. Includes explicit rejection outcomes, stale/revoked confirmations, retest assignment/acknowledgement and route access coverage. |
| Backend acceptance | 94 passed: selected-response OOS gates, permissions, response cycles, retests, worksheets, stock reconciliation and shipment shortages. Isolated in-memory test stores; this does not establish real PostgreSQL concurrency or external storage acceptance. |
| Root / gateway / desktop tests | 77 / 12 / 8 passed; one Linux-only root test skipped on macOS. |
| Workspace TypeScript, route generation, strict API generation, release fingerprint | Passed. Contract: 1,114 typed operations, 244 skipped; skipped operations remain an explicit backend typing backlog. |
| Production web / backend build | Passed. Existing large browser chunk warnings and backend compiler/dependency warnings remain. |
| Rendered browser fixtures | Retest, worksheet, OOS, rework, stock create/detail and shipment detail checked at 1280×720, 1366×768 and 853×480 as applicable. No horizontal overflow or browser exceptions. A long count confirmation kept its title/footer visible while the body scrolled. Smaller viewport is a scaling proxy, not native Windows validation. |
| UI detector / React Doctor | UI detector returned no findings for the new workflows. React Doctor: 68/100, 473 diagnostics including the same 15 existing errors. New missing dependency warnings were corrected; remaining warnings include complexity and static document/list keys. The scan is not a clean security/accessibility certificate. |

The backend still reports NU1903 for its existing AutoMapper 14.0.0 dependency: [GHSA-rvv3-g6hj-g44x](https://github.com/advisories/GHSA-rvv3-g6hj-g44x). The advisory lists patched releases 15.1.1 and 16.1.1. A backend-wide dependency upgrade and its compatibility/licensing review are outside these workflow repairs and remain a production release concern.

No production data was changed, no application was deployed, and native Windows/installed-update acceptance was not run. Use the rollout checks above before approving production activation.

## Posted UI and production follow-ups

Supplier/manufacturer editors now prepend newly added material rows and offer material-kind filters with live counts. Filtering preserves all entered rows for validation and submission, and invalid hidden rows are revealed. The shared multi-select uses Select All / Unselect All. See [supplier/manufacturer controls](suppliers-manufacturers-migration.md#material-editor-controls-2026-10-27).

Complete step is disabled for extra material awaiting approval **and** approved extra material awaiting warehouse issue. The final confirmation refreshes that evidence and rechecks permission. Final packing and the companion backend enforce the same issue requirement before changing records, and a mismatched batch/step is rejected. The legacy status value `Approved = 2` means issued; approval alone sets `InProgress = 1`. See [the production gate](production-board-migration.md#extra-material-completion-gate-2026-10-27).

Follow-up verification: the full web suite passed 1,576 tests across 285 files; the final focused checks passed after the multi-select interaction test was corrected to reopen the popover. The selected backend suite passed 98 tests. Web TypeScript, production build, route/API generation checks and diff whitespace checks passed. React Doctor reported no findings for the 17 changed tracked files; the broader branch scan still reports existing findings. Light and dark browser fixtures covered 1280×720, 1366×768 and 853×480, including pending/approved-unissued/issued extra-material states, filters and prepended rows, with no horizontal overflow or browser exceptions. These checks used simulated data and isolated test stores. Production deployment, native Windows acceptance and real database concurrency validation were not performed; existing rollout qualifications above remain applicable.
