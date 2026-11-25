# Material stock trace and printable reports

Approved material details retain the stock, bin-card and reserved views and add Production floor, Consumed and Reconciliation under the material kind's stock-trace view permission. Each report begins with material information. Print stock by batch, Print bin card, Print reserved, Print production floor and Print consumed each fetch one complete, fresh print snapshot. Print material details combines all five sections with reconciliation totals and pending transfers. No report is limited to the visible table page or the former 500-entry bin-card cutoff.

Use the existing report components and print preview; Print stays disabled while the complete snapshot is missing, loading or invalid. The material, department and kind must match the requested snapshot. The print dialog holds one snapshot so totals and rows remain from the same read. `stockSince` is shared across the material's views and reports; it controls opening/receipts/outward movements, while positions and recorded consumption are current cumulative values. Reservations are already included on shelves. Pending full returns remain floor stock until the warehouse confirms receipt and shelving.

The separate raw/packaging view and print keys are registered by the companion backend. Its migrations copy existing approved-material view grants. Transfer shelf allocation uses the matching transfer-assignment permission. The backend remains authoritative for every read and mutation.

Import the four stock-trace endpoints and owned schemas with:

```sh
bun scripts/import-material-stock-trace.ts /path/to/metadata-only-export.json
bun run api:generate
bun run api:check
```

Reviewed contract digest: `ed5a4dba5d3d9e8ff51a650289ef4ec833d8b457a9f859be7fd205af072faa93`. Removing only stock-trace additions reproduces `f98896c0e66ab885fdcaf8049301dad3bb0476ed46f26e85566e97474ba0b643`. This source compatibility review does not deploy or apply migrations.

Full return is available from an open batch board before consumption, even when only one material kind has been issued. It cancels the batch, releases unissued holds, and sends issued stock to Material returns for warehouse shelf allocation. It does not instantly restore shelves. The server rechecks actual issues, consumption, stock evidence and permissions. Zero-difference quantity repair stays disabled and explains why.

COA/worksheet/approval/print result views show an existing average as its value and unit alone, with one matching specification range. Saved inputs stay available as evidence. Pending Edit COA is visible to its authorized original preparer from results and approval details; approved certificates remain read-only.

## Pending finished goods receipt

A production-approved FGTN that has not been received by the warehouse shows its actual **Transferred** quantity and **Awaiting warehouse receipt**. Allocation and stock balance explain that receipt is pending. **Receive transfer** opens the existing counted receipt workflow. It does not turn transferred quantities into warehouse stock before receipt. Once received, the existing received, allocated, pending allocation and remaining summaries apply.
