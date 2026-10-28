# Automatic GRN numbering

The receiving-area Create GRN dialog generates the number automatically and
shows it in a read-only FormWizard field. Its format matches Oryx Next:

`WHD/RM/26/008`

- Warehouse: `BWH` when the first selected material's department is beta,
  otherwise `WHD`, preserving the existing selection rule.
- Material kind: `RM` for raw material or `PM` for packaging.
- Year: the current local calendar year's last two digits.
- Serial: the existing prefix count plus one, padded to at least three digits.
  Longer serials retain all digits rather than wrapping.

This is a GRN-specific series, not the configurable Billing Sheet naming rule.
It reuses the existing GRN prefix/number helpers and generated configuration
count API; generated clients are unchanged. The model type must be exactly
`GrnNumber` (matching Next's enum and the backend's case-sensitive switch),
correcting the previous live request's unsupported `GRNNumber` spelling.

## Creation and failures

The dialog previews a number on opening. After reading the selected materials'
batches, it reads a fresh count and recomputes the current-year prefix immediately
before `POST /api/v1/warehouse/grn`. The submitted `grnNumber` is that refreshed
value. The other GRN fields, selected batch IDs and quarantine workflow remain
unchanged. Warehouse / Receiving Area audit headers are retained.

A failed count, null count, negative/fractional count, or unsafe integer blocks
creation and shows Retry number generation. The UI never invents a first serial
or sends an old preview after generation fails. The dialog can be closed while
the initial preview loads. Obsolete asynchronous results cannot update the
form after its numbering scope changes or the dialog closes.

The existing raw/packaging GRN permission is checked before preflight and again
before writing after asynchronous work. Backend authorization, validation,
quarantine changes and audit records remain authoritative. The count is not a
server reservation; refreshing it follows Next's behavior and does not make
concurrent creation atomic.

## Verification

Focused tests cover read-only generation, raw/packaging and beta prefixes,
serials beyond 999, a fresh issue-time count, audit headers, failed-count retry,
stale-preview write prevention and invalid count rejection. Existing receiving
workflow tests, web TypeScript/build checks and focused React Doctor diagnostics
are also run. This is a frontend change; publish the web assets to activate it.

Documentation updated: this note, `docs/services.md` and `docs/workflows.md`.
