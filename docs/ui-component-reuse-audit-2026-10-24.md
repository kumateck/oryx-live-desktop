# Oryx Live UI component reuse audit — 2026-10-24

## Scope and method

Source audit of `apps/web/src/modules`: 559 non-test TSX files were scanned for
structurally similar JSX, followed by manual comparison of related forms,
shared implementations, imports and active consumers. The scanner found 57
candidate file pairs, mostly calls to components that are already shared.
That number is not a count of defects or missing reusable components.

The six groups below are verified opportunities to share a smaller field group,
view or form shell. They are not six wholly identical workflows. This audit is
not an exhaustive semantic comparison of every screen or runtime API behavior.
No application source, permissions, approval rules or stock records changed.

## 1. Controlled STP fields and document rules — high priority

Separate implementations:

- `modules/products/components/stp/stp-form.tsx:16` and its field config at 31,
  used by the product's STP edit section.
- `shared/stp/stp-dialog.tsx:28` and field config at 49, used by standalone
  product and material STP dialogs.

Both implement STP number, summary/description, DOCX replacement and a reason
for replacing an approved document. Product-local `modules/products/lib/stp.ts`
separately implements document statuses, `documentLocked` and `documentProblem`,
which also exist in `shared/stp/stp-document.ts`. Error return conventions differ
(the local helper returns the sentinel `reason`; the shared helper returns text).

Extract controlled-document fields/status presentation as a shared unit usable
inside a page or dialog. Converge status and replacement validation deliberately.
Keep owner selection, link updates, permissions and save orchestration in each
flow. The standalone product/material dialogs already share `StpDialog`; they
are not themselves two independent copies of that dialog.

## 2. Specification fields and date validation — high priority

Separate field configurations:

- Product edit: `modules/products/components/spec/spec-dialog.tsx:42`.
- Standalone product QC: `modules/product-specifications/components/product-specification-editor.tsx:92`.
- Standalone material QC: `modules/material-specifications/components/material-specification-editor.tsx:77`.

Number, revision, effective/revision dates, supersedes, template and notes repeat.
The standalone editors already share base schema/request helpers, but each
rebuilds the field config. Product-local `modules/products/lib/specification.ts:11`
and `shared/specifications/specification-rules.ts:15` separately implement
`earliestRevisionDate`; the local specification schema uses the local helper.

Use one specification field-config builder and common date rules. Keep optional
reference, test-stage and product/material selectors configurable. Preserve
single-product context versus multi-item linking and separate API mutations.

## 3. Analytical raw data metadata fields — medium priority

Separate implementations:

- Product edit: `modules/products/components/ard/ard-dialog.tsx:12`.
- Standalone product QC: `modules/product-ards/components/product-ard-dialog.tsx:89`.
- Standalone material QC: `modules/material-ards/components/material-ard-dialog.tsx:78`.

Description, attachment upload/accept rules, existing attachments and contextual
STP/template facts are built separately. Product forms also share specification
number editing. Some file/record utilities are already shared under `shared/ard-records`.

Extract common ARD metadata fields and facts/attachment presentation. Keep
stage/STP/material selection and record-creation/upload retry orchestration
separate. Material ARD is not interchangeable with product ARD as a whole.

## 4. Product quality tables in view and edit pages — medium priority

The read-only product detail uses
`modules/products/components/detail/quality-tabs.tsx` (`SpecificationsTab:41`,
`ArdTab:57`). Edit sections separately render
`modules/products/components/spec/spec-table.tsx:14` and
`modules/products/components/ard/ard-table.tsx:13`.

Specification number, stage, revision dates, STP and template columns overlap,
including record links and formatting. They use separate display models.

Share normalized record/column builders for common fields. Add edit actions,
file counts and context-specific columns at the caller. Retain genuinely
different read-only/edit features and query access rules.

## 5. Request detail facts — low risk, straightforward reuse

These local `Fact` components have identical JSX:

- `modules/stock-requisitions/components/requisition-detail.tsx:23`.
- `modules/store-purchase-requisitions/components/purchase-pages.tsx:73`.
- `modules/job-requests/components/job-pages.tsx:124`.

`modules/schedules/components/schedule-summary.tsx:15` and
`modules/formula-reviews/components/formula-revision-detail.tsx:19` have close
variants for emphasis/monospace. They repeat a label above a value inside a `dl`.

Promote a compact shared definition-list fact. Existing `DetailItem` is horizontal
and `KeyFact` is a larger card; neither is a direct replacement without a variant.
Keep page layouts and domain values at the caller.

## 6. Supplier relationship editor shell — lower priority

`modules/suppliers/relationship/contact-dialog.tsx:45` and
`modules/suppliers/relationship/certification-dialog.tsx:59` repeat the dialog,
FormWizard body, error presentation, Cancel/Save footer and saving spinner.
Their fields, permissions and request transformations differ.

Extract only the supplier-editor shell, keeping schemas, permission checks and
mutations local. `SettingsFormDialog` demonstrates an existing similar pattern,
but lives inside another module; use a proper shared contract rather than
importing that module's internal component directly. Avoid a universal CRUD
component that takes ownership of unrelated domain behavior.

## Already shared or intentionally separate

- Shelving receipts, transfers and returns share `PlaceStockDialog`; shelf moves
  use a separate `MoveStockDialog`. Both use `MoveLine`, including rack search.
  They are already reused. Their location inside other modules is a separate
  ownership concern, not duplicate implementations.
- Generic table/list matches already use `ServerDataTable`, `ListDataTable` or
  `ClientDataTable`; repeated props are not a second table implementation.
- QC and warehouse batch tables have different actions and display models.
  Common small cells may be shared, but their workflow tables should stay distinct.
- Requisition, purchase-order revision and shipment-invoice quantity cells
  already use shared editable cells. Removal, revision and partial-invoicing
  semantics differ; similar names alone do not justify merging their editors.

## Suggested order and verification

Start with specification/STP fields and common domain validation; these have the
largest risk of regulated rules diverging. Compact facts are a small independent
cleanup. Then consolidate ARD metadata and common table columns as appropriate.
For form consolidation, preserve permissions, approval gates, identifiers,
serialization, audit headers, upload retries and unsaved state. Use existing
focused interaction tests plus relevant validation cases and TypeScript checks.

No tests were run for this documentation-only audit. No runtime refactor was
performed. Documentation updated: this audit report.
