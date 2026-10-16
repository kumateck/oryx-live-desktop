# Quality migration (QC, QA, settings questions and procedures)

Ports the Oryx Next quality screens to the desktop, **except the QC worksheets suite** (`/qc/worksheets/*`: worksheet templates and import, worksheet specifications and proposals, sampling point groups, test requests, test room, review, OOS cases, certificates, monitoring programs, worksheet water quality, QC approvals), which the user asked to leave.

`mathjs` and `exceljs` were added to `apps/web` with the user's approval (2026-10-14): mathjs for the formula engine, so results match the other clients, and exceljs for the Upload Center's `.xlsx` files.

## Scope and status

| Area | Oryx Next routes | Desktop module | Status |
| --- | --- | --- | --- |
| AI extraction settings | `/settings/qc/ai-extraction` | `modules/qc-ai-extraction` | Built |
| Issue BMR/BPR | `/qa/issue-bmr`, `/qa/issue-bmr/[id]` | `modules/issue-bmr` | Built |
| QA and QC analytical test requests | `/atr?type=`, `/atr/[id]/[batchId]`, print | `modules/analytical-test-requests` | Built |
| QC goods receipt notes | `/qc/goods-receipt-note`, `[id]`, `[id]/[batchId]`, print | `modules/qc-grn` | Built |
| Test completion (batches) | `/complete/*` | `shared/qc`, `shared/form-response` | Built |
| Material and product specifications | `/qc/material-specification/*`, `/qc/product-specification/*`, `/complete-section/*` | `modules/material-specifications`, `modules/product-specifications` (`:id/complete`) | Built |
| Standard test procedures | `/qc/material-stp/*`, `/qc/products-stp/*` | `modules/material-stps`, `modules/product-stps` | Built |
| Analytical raw data | `/qc/analytical-raw-data/*`, `/qc/product-analytical-raw-data/*` | `modules/material-ards`, `modules/product-ards` | Built |
| Routine QC | `/qc/routines`, `[id]`, `setup`, `tracks/[id]`, `certificates/[id]`, `water-quality` | `modules/qc-routines` | Built |
| Commercial certificates | `/qc/commercial-certificates/[id]` | `modules/commercial-certificates` | Built (generate button not yet placed on the approvals page) |
| Questions | `/settings/questions`, table and formula create/edit | `modules/questions` | Built |
| Templates | `/settings/templates`, `/settings/template/create`, `[id]/edit` | `modules/form-templates` (`/settings/templates/create`, `/:id/edit`) | Built |
| Full procedures | areas, four template kinds, procedure review | | On hold (user, 2026-10-15) |
| Workflow templates | `/settings/full-procedures/workflows/*` | | On hold (user, 2026-10-15) |
| Upload Center | `/settings/upload-center` and its settings card | `modules/upload-center` | Built |

Not ported: `/qa/bmr-bpr`. Nothing in Oryx Next links to it, it is not in the navigation, and both of its row actions do nothing (`onClick: () => {}`; "Sample Material" is permanently disabled). It is a dead screen, like products allocation.

## AI extraction settings

One card per provider (Anthropic, OpenAI): model, write-only API key, and Make active. Kept from Oryx Next: a blank key keeps the stored one; only the last four characters are shown. Changed: a provider without a key cannot be saved with a blank key (the server would store a model with no key); the permission is checked again before each write; the active badge is shown only when the active provider has a key, because the server reports the enum default (Anthropic) before anything is activated.

## Issue BMR/BPR

The list shows every batch manufacturing record production requested, with its status (awaiting issue or issued, from the server's `issuedDate`). The record page shows the product, schedule and department; the batch details form (batch number, manufacturing and expiry months, batch size and unit, packing style from the schedule); and the raw and packaging materials the batch needs against warehouse stock, where "other stock" opens the shared store-by-store availability dialog.

Kept from Oryx Next: the suggested batch number (`shared/codes/batch-number.ts`: last letter and digits of the product code, a year letter, and the next serial from the ProductBatchNumber count), and the months (made this month or up to five years ahead; expiry after it, within ten years), sent as the first and last day of the month.

Changed:

- **Issuing is confirmed.** It completes the production step and stamps the issuer, so it is an explicit confirmed action, not a side effect of "Save changes".
- **An issued record is read-only.** The backend issues again whenever asked, overwriting the issue date and logging a second "issued" event; Oryx Next let a user do that. The desktop shows the issued details instead of the form.
- **The two writes are ordered and the half-done case is handled.** The details are saved first; if the issue then fails, the page says so and the button becomes "Retry issue", which repeats only the issue.
- **Batch size has a unit picker** limited to the product's unit family, instead of a free-text unit.
- The permission is checked before each of the two writes.

## Shared foundations

- `shared/questions`: question and formula type numbers and labels, specification references, the table-question model (`table-question.ts`, tested), its builder (configure, preview, cell setup, export and import, delete row or column, all confirmed), the analyst's table input and read-back view, and a QC equipment option loader.
- `shared/forms/async-option-picker.tsx`: the paged async choice without a form binding.
- `shared/form-response`: the form template model, answer parsing and serialising in Oryx Next's stored formats (`answers.ts`), per-field validation, the answer form hook (reloaded drafts never overwrite what the person changed), the response writer, and the answer sheet.
- `shared/formula`: the governed formula engine (`core`, `builder`; Oryx Next's 81 tests pass unchanged), the formula builders and evaluators (`ui`: Simple, Uniformity, Universal), result helpers (`compute`), the governance API with validated responses (`governance-api.ts`), and `formula-preview.ts`.
- `shared/ard-view`: the analytical raw data sheet, its print, worksheet headers for materials and products, compliance inference, and the certificate of analysis preview.
- `shared/qc`: AR and issue numbers, the analyst picker (now for any permission list), the assignment sheet, the reassign panel and assignments dialog, and the test entry screen. Used by material (GRN), product (ATR) and routine testing.
- `shared/specifications`: numbering, reference and revision-date rules (tested), the specification schema, the tests view (groups tests sharing a group name), the completion table, the detail layout, and the approval hook (`VerifiableRecord` 0–6).
- `shared/stp`: the controlled STP document model (tested), its API (review, editor session, upload and download declared by hand), the signature and new-draft dialogs, the review actions, version history, the document editor, the STP dialog and record views. The products page uses the same document API, so its tags are defined once.
- `shared/ard-records`: the ARD record schema (keeps what the pages do not edit), the file upload, and the detail view with its printable blank worksheet.

### Formula system

Copied from Oryx Next and made to compile under the desktop's strict settings with no `any` (optional props widened, unchecked index reads guarded, two forms rewritten on the desktop `FormWizard`). Two replacements:

- **SHA-256** (`core/sha256.ts`, tested against Node's). Oryx Next fell back to crypto-js when Web Crypto was missing. The desktop renderer can be served over intranet HTTP, which is not a secure context, so Web Crypto is not there. No crypto-js dependency.
- **Formula rendering** (`ui/math/expression-view.tsx`). Oryx Next typeset formulas with MathJax from a CDN, which the desktop's content policy blocks. The desktop draws the mathjs parse tree as stacked fractions, radicals, powers and subscripts, loading only mathjs's parser so list pages stay light.

Complex formulas are not ported: Oryx Next no longer dispatches that type.

## Questions

The list filters by type and searches; the configuration column shows each formula. Standard questions open in a dialog (options for single choice, dropdown and checkboxes; instrument questions always take several answers). Table questions and formula questions have their own pages.

The formula page builds the formula, lets each variable come from the formula itself or from another form field, runs the generated checks in the app as a provisional preview, and saves a governed draft revision. On an existing question the revision panel runs the server's validation, then submit for review, record review and approve, each with a reason and its own permission. A revision in review is read-only.

Changed: changing the formula type starts the builder afresh (a definition for one type means nothing to another builder); Submit for review is offered only after the server's checks all pass.

## Templates

List with type filter, edit, copy and delete. The editor sets the name and what the template is for (analytical raw data or specification), and its tests: rich-text name and specification, drag to reorder tests and questions, group several tests, pick questions per test (filtered to the template's type), and required and default answer per question. Saving an edit sends only the difference: deletions first, then creations and updates in order.

Changed: the template type is visible and editable (Oryx Next kept a hidden default of analytical raw data). If a write fails partway, the page says how many changes were saved and reloads the template so nothing is resent blindly. The formula-placement and form-revision panels in Oryx Next's template folder are not reachable from any of its pages, so they were not ported.

## QC goods receipt notes

Raw and packaging lists behind their own permissions. A note shows its batches; each batch offers the step its status allows, each with the raw or packaging permission for that step:

- take sample (AR number suggested as `QCD/RM|PM/yy/0001`; the sample cannot exceed what was received)
- assign test (the issue number is given here)
- start test (only once the material has analytical raw data; confirmed)
- enter results, reassign analysts, view assignments, check results
- request and complete retest
- print the worksheet (blank until results are in)

Results show the full analytical raw data with print, and the certificate of analysis preview, where each test's compliance is inferred and can be corrected before the certificate is generated.

## Analytical test requests

QA sees new requests (`?type=0`) and takes samples. QC sees its queues: sampled, acknowledged, assigned, under test, test taken, released. Each step has its own permission; Oryx Next checked a permission only on reassign and retest. Receiving a sample gives the AR number by stage (`QCD/IP|BP|FP/yy/0001`; Oryx Next used the wrong stage for bulk). Results and the certificate work as for materials, adding composition, pack style and shelf life. Once submitted, the certificate shows its state (pending, approved, revision required) instead of offering to generate it again.

## Test entry

Shared by materials and products. Each analyst sees only the fields given to them, can save each answer as a draft, and submits once every field of the form has an answer (theirs, or already saved by another analyst).

Changed from Oryx Next:

- **Submit saves unsaved edits first.** Oryx Next finalized the existing draft and dropped anything typed since the last per-field save.
- **Assignment sends only form fields.** Oryx Next also sent its "assign all" and per-test shortcut pickers as if they were fields.
- **A file answer is sent only when new files are chosen.** The server adds the files on every save, so resending duplicated attachments.
- Checkbox answers saved as JSON are read back correctly (Oryx Next split them on commas).

## Specifications

Material (raw and packaging, each behind its own permissions) and product specifications: list, create, edit, details, approve and delete, and **test references** (`/complete-section` in Oryx Next, here `:id/complete`), where QC picks the pharmacopoeia reference for each test of the template.

- Numbers are suggested from the series: `QCD/SPC/RM|PM/001`; products `BMP|NMP/IPC|B|FP/SPC/001` by the first product's **division** (Oryx Next guessed from the department name containing "beta").
- The revision date must be after the effective date and today. A new specification is due tomorrow, as before; an edit keeps its saved due date.
- Editing saves the specification, then the materials or products it covers (only the difference). If the second write fails the page says the specification was saved and a retry sends only the link change.
- Approval is confirmed and uses the kind's own key. **Oryx Next approved packaging specifications with the raw key.**
- The template picker is not filtered by type: Oryx Next saved every template as analytical raw data, so filtering would hide the templates specifications use.

## Standard test procedures

Material and product STPs: list, create and edit (dialog), details, delete, and the **controlled document** page.

- **Oryx Next checked no permission on these pages.** Each action now has its key (`CanCreate|Edit|DeleteRawMaterialStp`, packaging and product equivalents); the review steps need the STP's edit key, which is what the server checks.
- An STP is kept per item and shares its number. Creating one attaches the document to **every** STP made (Oryx Next attached it only to the first product STP). A failed upload after a create is retried without creating again.
- The document page offers the step its status allows: submit (confirmed), record review, approve or reject (each signed with the person's own password and the meaning of the signature), and start a new draft of an approved document (with a reason, optionally a new file). Versions are listed newest first with their signatures, and each can be downloaded.
- The Word editor is the organisation's ONLYOFFICE document server, loaded from the address the server gives for the session (checked to be a web address). **It runs inside the app's window**, so that server must be trusted; it is opened only on the document page, not on the STP details page, because opening a session can take the edit lock.

## Analytical raw data

Material and product ARDs: list, create and edit (dialog), details with the printable blank worksheet and attachments, approve and delete.

- A material record takes the material's STP, specification number and the specification's template (shown, not typed); a product record takes the STP chosen for a stage and that stage's specification. Without them the page says what is missing.
- **The server overwrites every field on update**, so the analysis type, certificate items and uniformity-of-weight link are sent back as they were.
- Approval uses the kind's own key. **Oryx Next approved packaging ARDs with the raw key.**
- Files that fail to attach after a save are retried without saving the record again.

## Routine QC

Routine tests (`/qc/routines`): scheduled and emergency water and environmental routines, their samples or monitored areas, each analysis's worksheet, approval, and certificates; routine setup; water quality coverage.

- These endpoints are not in the server's API description and check **no permission**. The keys Oryx Next defined gate every screen and action: view, create (routines, samples, assigning worksheets), perform (results, submit for approval, certificates), setup view/manage, microbial applicability, water view/manage. Oryx Next left microbial applicability, the commercial microbial ARD and the water hold ungated.
- A worksheet is given to one analyst (the server reads back no per-field list), then entered on the shared test entry screen and submitted for approval (confirmed). Once checked or pending it is shown read-only.
- Certificates are generated once, confirmed, when every analysis of a water sample (or every area's single microbial track) is approved.
- Oryx Next asked for the **R&D batch, batch record and production step as typed IDs**. The desktop offers pickers: R&D project then trial batch; batch record then its production steps.
- The routine ARD and microbial ARD editors choose which worksheet fields the certificate reports. Oryx Next flagged an incomplete row at the wrong position when earlier rows were not chosen; the desktop flags the row itself.

## Certificates of analysis

Routine and commercial certificates are shown as issued (a fixed copy of the approved results) and can be printed. A combined water certificate links to activating its coverage. `GenerateCoaButton` (`modules/commercial-certificates`) generates the commercial certificate of an approved material batch or product test request, confirmed, and opens it. It sits on the approvals ARD page next to the certificate preview and OOS action, shown only once the response is approved: a material ARD generates from its material batch, a product ARD from the test request of the activity step that was tested.

## Upload Center

Material stock, product stock, attendance and shift schedule uploads, each tab behind its key, with the settings card under Inventory.

- Each sheet is read in the app, its columns found by name, every row checked (required cells, numbers, batch months), and rows can be corrected or removed. **A sheet with problem rows cannot be submitted**; Oryx Next sent whatever was left.
- Material quantities are uploaded in the smallest unit of their family, as stock is stored; the preview shows the largest. Batch dates are edited as months (expiry on the month's last day).
- Cells that start like a formula are kept as text. The reviewed sheet can be exported.
- **The server checks no permission on the stock uploads**, which set stock directly. They are gated on `CanCreateMaterialStockAdjustment` (material) and `CanApproveFgtn` (product), the closest keys that change stock; the user confirmed these on 2026-10-15.
- exceljs (930 kB) loads only when a sheet is opened, so other pages stay light; it is the build's only chunk over 500 kB.

## Next steps

1. Full procedures and workflow templates, when taken off hold.

Also confirmed dead and not ported: `/complete-test` (nothing links to it).

Not verified in a running app: signed-in pages cannot be opened in the Browser pane here, so this was checked with `bun run check` (typecheck, 957 web tests, route and API checks) and the production build.
