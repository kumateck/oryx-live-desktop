# Correct two opening batches from RMG002 to RMG001

Demo correction completed on 24 November 2026. `GLB-M/028/0620` (100 kg) and `GLB-M/033/08/21` (50 kg) now belong to RMG001, Glibenclamide. Their imported spreadsheet rows already said RMG001 / Glibenclamide BP/EP, but resolved to RMG002 / Griseofulvin. The repair changes only MaterialBatches.MaterialId and the posted migration line’s ResolvedMaterialId, with update timestamps. Original sheet values, batch IDs, quantities, shelf allocations, opening movements and ledger rows are preserved. All remaining RMG002 batches were verified unchanged, including HH241001 and HH260414.

The client correction was completed after demo. For any subsequent guarded run, supply the actual connection through PGHOST, PGPORT, PGUSER and a protected PGPASSFILE. Do not paste credentials into the command or chat. The script resolves material IDs independently by current code/name and batch identity, so it does not assume the client has demo UUIDs.

Rehearse first (updates are rolled back), review the saved report, then apply:

```sh
bun scripts/repairs/material-identity/index.ts --database CLIENT_DATABASE --output /secure/path/rmg001-preview.json
bun scripts/repairs/material-identity/index.ts --database CLIENT_DATABASE --output /secure/path/rmg001-applied.json --apply
```

The expected database is mandatory. Locks and a serializable transaction protect the two-batch check and update. Exact opening quantities, mg units, raw material identities and migration provenance must match. Every actual FK dependency is checked, including newly added tables. Any reservation, testing/issue/return evidence or changed stock stops the transaction. The two opening batches are not cloned and no stock is added or removed. A rerun preserves already corrected identities. Reports are created exclusively with mode 0600 before execution; use a new report path for each run. Existing report-history triggers remain active.

Demo before/after evidence: `/private/tmp/oryx-rmg001-demo-rehearsal.json` and `/private/tmp/oryx-rmg001-demo-applied.json`. Client execution completed in the live API’s database `oryx_migration_20261101` on 24 November 2026. A rollback rehearsal passed first, then both batches were corrected and independently verified. All remaining RMG002 batches and shelf quantities were unchanged. Docker is not required.

Client before/after evidence was saved privately in `/private/tmp/oryx-rmg001-client-rehearsal.json`, `/private/tmp/oryx-rmg001-client-applied.json` and `/private/tmp/oryx-client-material-after.json`. Application history triggers remained enabled.
