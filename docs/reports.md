# Reports

Every report opens its filters through **Choose filters** / **Edit filters**. Generate applies a complete snapshot; changing or cancelling a draft does not change the displayed report. **Filter details** shows the submitted selections. Reset changes only the draft. A failed refresh preserves the last successful report; revoked access clears it.

Optional dropdowns accept multiple choices. Empty means all within the remaining scope. Required department choices remain single selections. Where an API accepts only one department, warehouse, vendor or customer, selected scopes appear as separate named sections with their own authoritative totals. Overlapping sections must not be summed.

Procurement mapping reports select material type, suppliers, manufacturers and then mapped materials by ID. Materials are dropdowns, not manually typed names. Changing a parent selection clears dependent choices. Warehouse department choices follow each backend operation: approved material and valuation reports use departments owning raw/packaging warehouses; stock summary/detail reports use material assignment departments (production/R&D). General departments are excluded from those warehouse selectors.

## Historical reports

Employee master, permanent staff grades, department attendance, quality material/product lists, warehouse reports, all store/inventory reports, finished-product stock and product lists have an **As of date (UTC)** filter. Transaction reports retain their existing date ranges; expiry and validity filters retain their own meanings.

An empty as-of date requests current records. A selected date requests recorded state at the end of that UTC day, capped at the server time for today. Live verifies `/api/v1/report/history/capabilities` before generation and freezes one instant across pages and selected scopes. The companion backend must expose protocol 1 with installed history capture. An older backend continues to serve current reports; historical generation is unavailable until it is upgraded. No historical request falls back to current totals.

The companion backend migration `20261027170000_ReportHistoryCapture` establishes an opening baseline and transactional row history. Past dates before that baseline are unavailable: existing inventory and HR data cannot reliably reconstruct every historical stock balance, grade or department assignment. This feature records what the system knew at the selected instant, rather than backdating later corrections. Review [the backend rollout guide](../../oryx-backend/docs/report-history.md) before deploying the backend. No customer migration is applied by this frontend change.

## Production schedules and readiness

The local companion backend implementation provides one read-only
`GET /api/v1/report/production-readiness` request with required `departmentId`,
`startDate` and `endDate`. Its response includes the complete market-grouped plan,
all seven readiness checks alongside every row, unique-product readiness,
quantities, current prices, totals and missing-definition warnings. A daily report
uses identical start/end dates; a monthly report uses the month's boundaries.
See [the endpoint contract](../../oryx-backend/docs/production-readiness-report.md).
Daily/monthly production schedules and product readiness now use this endpoint
through its generated reports-domain client. Report generation makes one request;
it does not fetch every schedule page and fan out into individual definition APIs.
The backend remains the source of quantities, checks and totals. The frontend
validates the response's completeness, configuration states, unique identities,
product summaries and requested scope before publishing it. Missing or inconsistent
responses cannot replace the previous successful snapshot; a 403 clears it.

Schedules show a single market-grouped matrix with expected batches, current unit
price/unit, expected yield, shippers, loose packs, packs per shipper, all seven
checks and overall readiness. Market subtotals and the grand total come directly
from the response. Product readiness shows one row per unique product with its
markets, batches and complete checks. Both views show applied scope, readiness
counts and a symbol/text legend. These are current configuration checks, not stock
availability or production/release authorization.

The dedicated read-only matrix uses existing shadcn Table/Badge components. It is
exempt from the generic renderer's five-column preview; other report lists retain
the existing datatable. Container queries move all seven labelled checks beneath
their product when width or increased font size requires it. At smaller widths,
quantities retain visible labels and long product/market names wrap. No essential
field depends on opening a row. Filters remain in the shared scrolling dialog.
Dense matrices reuse the existing datatable paging footer, starting at 30 rows.
Market subtotals and grand totals always cover the full server snapshot and are
labelled accordingly when paging. Print and export include every row.

Deploy the companion backend endpoint before enabling this frontend release.
An unavailable endpoint or department gives an explicit error rather than silently
falling back to the old request fan-out. No backend migration is required.

## Printing and export

Every generated report uses the shared system **Print** preview and native print dialog, including the company header, applied filters, generation time and printed-by footer. Production/readiness printouts keep each product's quantities and seven checks together in paired rows, repeat the table header and use readable black-on-white styling in both themes. Generic wide reports split into readable column groups with row references repeated. Excel and CSV export the complete snapshot, preserving zero and missing values. Production/readiness exports include every market row, check, identity, subtotal, grand total and product summary regardless of the selected screen view. They preserve the backend generation timestamp and never refetch during export.

## Verification

```bash
bun run --filter @oryx/web test -- src/modules/reports src/shared/reports
bun run api:check
bun run check
bun run build:web
```

Historical capability and optional `asOfDate` parameters are generated from the companion backend's offline OpenAPI export. The existing contracts, response schemas and authentication remain unchanged; the contract regression test verifies the additions. The separate legacy host-Nginx fingerprint policy retains previous approvals and adds the reviewed source contract. Customer Docker continues using focused compatibility checks.

Verification on 2026-10-27: the full frontend check passed (1,599 web tests; route/API checks and all workspace typechecks), and the production web build passed. Backend acceptance passed 41 focused tests, including a disposable real PostgreSQL fixture with raw warehouse and general-store stock changes, staff-grade history, owned product prices, rollback/deletion, source/history truncate protection and final-packing absence. UI interaction tests cover generation, applied details, keyboard dismissal and system print preview. The UI source detector found no issues. Browser rendering at Windows scaling remains unverified because local browser access is disabled in the Work settings. No customer backend migration or deployment was performed.

Readiness verification on 2026-10-28: the full repository check passed (including
1,639 web tests), as did workspace typechecks and the production web build. Final
60 focused report/export/datatable tests pass, covering dense paging, unchanged full
totals, complete paper output, single-request generation, incomplete-response
rejection, revoked access and the export menu retaining the exact snapshot. The
contract/codegen check and additive-contract regression passed. The design source
scan found no issues. React Doctor scored the ten report components/hooks 98/100,
with one pre-existing catalog array-lookup warning and no errors.

Browser checks used the real report workbench with a synthetic API fixture, in
light/dark themes at 1366×768 and 1280×720, plus effective 125%/150% viewport sizes
of 1024×576 and 854×480. Long names, 16px body text and a reserved 296px sidebar
were checked without document/content horizontal overflow; each visible product
retained all seven checks. The shared print preview was inspected, including the
black-on-white paper layout in dark mode. These are browser viewport checks, not
installed Windows/display-scaling acceptance. The browser's native CSV download
event check stalled; export-menu dispatch and actual workbook/CSV contents are
covered automatically. The temporary preview sources/server were removed. No
customer server access, backend migration, push or deployment was performed.
