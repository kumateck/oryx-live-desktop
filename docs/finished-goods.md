# Finished goods: operator interface and backend contract

The coordinated implementation starts at finished goods transfer-note generation
and continues through receipt, stock reconciliation, packing-list reservation,
parallel loading/commercial preparation, actual invoice, waybill, departure,
delivery and recall. The detailed operating rules, industry benchmark sources,
permissions, migrations and validation log are in the backend's
`docs/finished-goods-workflow.md`.

## Pages and existing components

- Transfer notes: Receive the actual count; zero or short receipts need discrepancy
  evidence. The note detail offers permission-specific QA hold/release and historical
  reconciliation actions. Shippers/packs use the saved stock conversion.
- Approved products: compact stock summaries distinguish on-site, reserved and
  available quantities for every batch/packing style. The list reads its summary
  data once, with no per-row requests. Missing/invalid conversions are surfaced.
- Packing lists/allocations: existing review/approval and packing-list edit components
  remain. Record loading, prepare waybill, confirm Costing and obtain commercial
  clearance independently; departure is the gated stock issue. Customer/PO/proforma/
  actual-invoice/waybill references, transport details and invoice history remain visible.
- Proformas keep their own identity after invoice issuance. PO verification is an
  explicit task and uploading a file is evidence only. Actual invoices have their
  own list/detail endpoint and print their issued number/date and frozen pack prices.
  Historical missing line snapshots are reported instead of printing current prices.
- Product recalls have division/search/page controls, stock/quarantine and consignee
  tables, authority-decision history, notifications, recoveries, disposition, Finance
  resolution links and closure/reopening. The printable report includes the traced
  consignments, held stock, recovered goods/disposition and decision history.

Forms reuse FormWizard/FormDialog, existing date/select/upload fields and Zod.
Lists reuse the existing datatables and actions; documents reuse PrintPreviewDialog,
PrintHeader, PrintFacts, PrintTable and PrintSignatures. Task-specific checks run
again immediately before every mutation. A 403 is never automatically retried as a
write. Sensitive new powers need administrator assignment after migration.

## Ownership and regeneration

`fg-dispatch` owns the commercial/physical consignment controls and exports an
explicit `public.ts` contract for transfer-note and recall consumers. `product-recalls`
owns its routes, manifest, navigation composition, forms, state schema and report.
The domain navigation extension is idempotent when the upstream catalogue includes
the same route. Generated API clients are never edited manually.

To refresh only the reviewed finished-goods contract additions from a local API export:

```sh
bun scripts/import-finished-goods.ts /tmp/oryx-finished-goods-openapi.json
bun run api:generate
bun run api:check
bun run routes:check
```

`contracts/openapi/reviewed/finished-goods-scope.json` names the exact added paths,
schemas, DTO fields and allocation statuses. The contract regression removes only
that scope and verifies the earlier approved costing fingerprint remains unchanged.
Coordinate API and desktop deployment: retired status-only loaded/delivered actions
cannot supply the evidence required by this workflow.

## Rollout

The user's pipeline applies backend migrations. Existing transfer notes are deliberately
blocked from new allocation/loading/departure until signed stock, conversion and
historical departure evidence are reconciled. Do not clear flags in bulk. Follow the
backend operator guide and assign QA/FG/Costing/Finance tasks before enabling users.
Costing confirmation records an approved external manufacturing-cost basis. Recall
Finance resolutions record approved credit/refund/replacement evidence; they do not
create duplicate accounting entries or replacement stock movements.

## Validation record

Backend workflow/finance/costing/QA and permission checks passed (122 combined,
plus the separately enabled costing PostgreSQL check). The PostgreSQL finished-goods
migration and concurrent reservation test passed against a disposable database;
there are no pending EF model changes. Repository/contract checks passed (200;
18 optional/platform checks skipped). The focused interface suites passed (82),
and the final control/delivery-evidence suite passed (23). TypeScript and the web
production build passed. React Doctor reported no issues on the changed scope.
Built screens were reviewed at desktop and narrow widths using mocked records;
waybill printing uses the shared preview, with print disabled while data is loading
or unavailable. No live/demo deployment or application database migration occurred.
