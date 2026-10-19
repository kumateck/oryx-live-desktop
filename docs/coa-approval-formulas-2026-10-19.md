# COA approval formula rendering — 2026-10-19

Fixed the approval view's plain-text rendering of serialized formula answers. The approval parser had removed the question type/settings and authoritative-result fields before the UI rendered the recorded values.

Changes:
- Preserve the formula metadata already returned by the forms API.
- Reuse read-only formula previews for Assay and Loss on Drying; place them in full-width rows on both the approval and certificate preview.
- Preserve authoritative stored results for governed formulas without client recalculation.
- Use explicit unavailable states for missing configuration/authoritative values.
- Display percentage results without the old LaTeX escape and make worksheet summaries fit their content width.

No API endpoint, result write, formula arithmetic, compliance decision, approval transition, permission requirement, or audit event was changed. No live COA was approved or generated.

Verification: focused approval and rendering tests, TypeScript/production web build, React Doctor on the tracked diff, and browser checks using synthetic simple and two-sample Assay data. Local light/dark previews include simulated 150% scaling at 1280px; packaged Windows verification remains separate.

Documentation updated: `docs/pending-approvals-migration.md` and this note. Setup, commands, and service responsibilities are unchanged.
