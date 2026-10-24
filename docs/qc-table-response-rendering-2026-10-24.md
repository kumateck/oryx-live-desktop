# QC table response rendering — 2026-10-24

The GRN/ATR result view in Oryx Live Desktop rendered table configuration JSON
as a column heading, then flattened the saved answer to its editable columns.
This dropped medium labels, batch numbers, and the merged heading. The matching
Next renderer has a separate fix; changing Next alone does not update Live.

## Change

- The Live ARD response renderer now uses the configured grid with its original
  labels, row/column spans, merged cells, and saved answers at `row-column` keys.
- Reuse the existing question-table Zod parser and shared table contract.
- Show configured select labels and preserve zero readings.
- Decode wrapped and double-encoded JSON responses before reading cells.
- Blank print previews use the same read-only layout with empty result cells.
- Preserve legacy `{ headers, data }` tables.
- No API, saved record, formula, approval, audit-event, or workflow transition changes.

## Verification

18 tests pass across table renderer regressions, GRN/ATR filled/blank composition,
existing formula preview checks, and existing table configuration tests.
The production web build, including strict TypeScript validation, passes.
React Doctor reports existing app-wide issues and a maintainability warning for
TableValue's retained legacy fallbacks; it reports no error in the changed
rendering modules. The scoped UI detector reports no findings.
The local Vite app was visually checked at 1280×720 using the actual ARD
composition and Live theme styles. The two saved result cells render under
MacConkey Broth and MacConkey Agar, without serialized JSON or a fabricated
“Col 3” heading. These checks use synthetic responses; no production record was
changed and the remote application has not been redeployed by this task.

Documentation updated: this note records the Live-specific fix. Setup, services,
and workflow contracts are unchanged.
