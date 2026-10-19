# QC test rendering — 2026-10-19

Compared the desktop analytical answer sheet and formula evaluators with Oryx Next's completion controls and the supplied screenshots.

- Section/field descriptions use the existing allowlisted rich-text viewer instead of exposing HTML tags. Stored inline black text cannot make dark-mode descriptions unreadable.
- Formula dispatch normalizes JSON strings and legacy envelopes and displays an error for unreadable definitions. Each evaluator loads directly; builders are excluded from the evaluation import path.
- Custom field failures have local retry and application error reporting, preserving other unsaved answers.
- Worksheet groups respond to their container width, omit empty sections, and use unique input IDs. Calculations and data tables remain visible.
- Destructive action icons and labels explicitly use the red theme token.

## Contract and integrity

No API endpoint, mutation payload, formula arithmetic, result precision, assignment/permission requirement, approval transition, or audit event was changed. Input metadata and existing formula response JSON are preserved. UI verification uses synthetic data; no live quality results are submitted.

## Verification

Regression tests cover safe rich descriptions, nested/wrapped definitions, Loss on Drying result 0.50, Assay controls/table readings, retained response JSON, disabled fieldsets, malformed-definition feedback, and retry without losing another answer. The web build includes TypeScript checking. Browser previews exercise light/dark themes and simulated 125%/150% scaling at 1280px, checking the central content for horizontal overflow. These previews do not replace packaged Windows verification.

React Doctor was run against the branch comparison; it reports existing issues in the wider migration, including formula builder state/effect patterns. Unrelated migration code was left outside this rendering task.

Documentation updated: `docs/forms.md`, `docs/actions.md`, and this delivery note. Setup, commands, service endpoints, and regulated workflow behavior did not change.
