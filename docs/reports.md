# Reports

Every report opens its filters through **Choose filters** / **Edit filters**. Generate applies a complete snapshot; changing or cancelling a draft does not change the displayed report. **Filter details** shows the submitted selections. Reset changes only the draft. A failed refresh preserves the last successful report; revoked access clears it.

Optional dropdowns accept multiple choices. Empty means all within the remaining scope. Required department choices remain single selections. Where an API accepts only one department, warehouse, vendor or customer, selected scopes appear as separate named sections with their own authoritative totals. Overlapping sections must not be summed.

Procurement mapping reports select material type, suppliers, manufacturers and then mapped materials by ID. Materials are dropdowns, not manually typed names. Changing a parent selection clears dependent choices. Warehouse department choices follow each backend operation: approved material and valuation reports use departments owning raw/packaging warehouses; stock summary/detail reports use material assignment departments (production/R&D). General departments are excluded from those warehouse selectors.

## Historical reports

Employee master, permanent staff grades, department attendance, quality material/product lists, warehouse reports, all store/inventory reports, finished-product stock and product lists have an **As of date (UTC)** filter. Transaction reports retain their existing date ranges; expiry and validity filters retain their own meanings.

An empty as-of date requests current records. A selected date requests recorded state at the end of that UTC day, capped at the server time for today. Live verifies `/api/v1/report/history/capabilities` before generation and freezes one instant across pages and selected scopes. The companion backend must expose protocol 1 with installed history capture. An older backend continues to serve current reports; historical generation is unavailable until it is upgraded. No historical request falls back to current totals.

The companion backend migration `20261027170000_ReportHistoryCapture` establishes an opening baseline and transactional row history. Past dates before that baseline are unavailable: existing inventory and HR data cannot reliably reconstruct every historical stock balance, grade or department assignment. This feature records what the system knew at the selected instant, rather than backdating later corrections. Review [the backend rollout guide](../../oryx-backend/docs/report-history.md) before deploying the backend. No customer migration is applied by this frontend change.

## Printing and export

Every generated report uses the shared system **Print** preview and native print dialog, including the company header, applied filters, generation time and printed-by footer. All rows are printed; wide reports split into readable column groups with row references repeated. The screen retains the existing datatable, with **View all fields** for wide rows. Excel and CSV export the complete snapshot, preserving zero and missing values.

## Verification

```bash
bun run --filter @oryx/web test -- src/modules/reports src/shared/reports
bun run api:check
bun run check
bun run build:web
```

Historical capability and optional `asOfDate` parameters are generated from the companion backend's offline OpenAPI export. The existing contracts, response schemas and authentication remain unchanged; the contract regression test verifies the additions. The separate legacy host-Nginx fingerprint policy retains previous approvals and adds the reviewed source contract. Customer Docker continues using focused compatibility checks.

Verification on 2026-10-27: the full frontend check passed (1,599 web tests; route/API checks and all workspace typechecks), and the production web build passed. Backend acceptance passed 41 focused tests, including a disposable real PostgreSQL fixture with raw warehouse and general-store stock changes, staff-grade history, owned product prices, rollback/deletion, source/history truncate protection and final-packing absence. UI interaction tests cover generation, applied details, keyboard dismissal and system print preview. The UI source detector found no issues. Browser rendering at Windows scaling remains unverified because local browser access is disabled in the Work settings. No customer backend migration or deployment was performed.
