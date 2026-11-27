# STP revisions (structured STP content)

Date: 2026-11-27. The desktop side of the backend's structured STP revisions (`oryx-backend/docs/stp-revisions.md`). The flow copies the [approved vendor list](approved-vendor-list.md): drafts, submission to review ("Checked by") and approval, corrections while in review, and new revisions of the approved one.

## Where it lives

- `shared/stp-content/`: everything both STP modules share. The list, detail, editor and import pages, the read-only content view, the dialogs (revise, submit, delete) and the approval evidence. The pages take the module's routes for a kind (`StpRoutesFor`) and the kinds the module shows; a revision of another kind is not shown.
- `modules/material-stps`: `/qc/material-stp/revisions` (raw and packaging, `?type=0|1`), with `new`, `import`, `:id`, `:id/draft` and `:id/edit`. The STP list has a **Revisions** button; an STP's page has **Structured content** and, when it has a Word document, **Import document content**.
- `modules/product-stps`: the same pages under `/qc/products-stp/revisions`.
- Pending reviews open a revision from its variant (its kind). Pending approvals show the revision's content and decide with the approve or reject key of its stored kind, read from the evidence.

## Pages

- **Revisions**: every STP number of the kind with its current and in-preparation revision. Opening a number (`?stp=`) lists its revisions and offers **Import Word STP**, **Start blank** (no revision yet) and **New revision** (from the current one), each only while nothing is in preparation and only with its key.
- **Import**: upload a .docx, or with `?from=` read the STP record's current document version. The proposal is shown beside the values to check (Medium "Check" and Low "Missing" confidence, with the reader's flag) and the document warnings. Nothing is saved until **Create draft from this** (first revision), **Replace the open draft's content** (keeps the draft's numbers and reason) or **Start a new revision with this** (revise, then save the draft).
- **Editor**: running header, sections 1.0 to 4.0, reagents (one per line) and procedure notes, then the 5.N tests with their steps, conditions blocks and notes, each movable. A test keeps its key; a new one gets its key on save. Saving a draft and correcting send the version the page read.
- **Detail**: running header with Prepared / Checked / Approved by, the content as printed, the Review panel, and the actions for the revision's state.

## Keys

Each task has a key per kind (`stpRevisionKeys(kind)`), checked with `usePermissionAction` before each write and on menu items with `require`. The manifests guard each page with its task's key; the material pages accept either kind's key and the record's stored kind decides the rest. All keys are granted to nobody on deploy.

## Not done yet (step 4)

Word export and print, the specification ↔ STP test link, and sidebar entries for the revisions pages (they are reached from the STP lists).
