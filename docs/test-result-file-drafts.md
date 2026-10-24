# Test-result file drafts and saved attachments

## Behavior and causes

File answers are submitted as base64 data URLs but read back as an attachment
marker plus metadata. Comparing a selected file's name/size fingerprint with the
marker (`stored-files`) left its draft button unsaved after successful upload.
The batch, product-test and routine answer models also stripped attachment
metadata, so the file input reopened empty with no saved-file links.

The response writer now acknowledges the exact submitted fingerprint on a
successful draft response. The saved check updates immediately; a later edit
still differs from that acknowledgment and remains unsaved. Final submission
skips acknowledged drafts, preventing the same selected file from being sent a
second time just because its server marker differs. The response ID is retained
immediately for later writes/finalization before the refetch completes. Local
acknowledgments are scoped to the form/test context; permissions are rechecked
after asynchronous file conversion and before the request.

A shared stored-answer schema retains attachment metadata for material batches,
product analytical test requests and routine worksheets. The existing upload
field receives persisted attachments and opens them through AttachmentOpener.
Attachment keys include the reference because the backend may return the same
model ID for multiple files. Browser file inputs are not repopulated. Existing
saved files satisfy required validation, including metadata-only response rows.
No delete control is introduced for persisted files.

## Backend association and error handling

The backend previously created a draft's FormResponse without assigning its ID
before passing that ID to SaveBlobItem. A first attachment could be stored
against Guid.Empty rather than the eventual persisted field ID. The new
FormDraftAttachments helper assigns the field ID first, preserves it for later
files, and propagates storage failures instead of reporting success.

The draft API request/response contract and base64 format are unchanged, as are
revision, assignment, context, finalization, approval, and audit rules. A draft
saved check indicates storage success; it does not mark the test checked,
approved, or released.

## Existing uploads and verification

A read-only production aggregate found 15 FormResponse attachments, of which
five had Guid.Empty ModelId and no matching result field. No file contents were
read, no records were repaired and no live upload was performed. Those existing
files require a confirmed batch/test and an auditable association repair; the
code fix does not infer their destinations from timestamps or reassign them.

Regression tests cover saved status without refetch, skipping repeat upload on
submit, restored multiple attachment links, required-file completion, edits made
during upload, and failed storage. Backend tests cover stable first/subsequent
attachment IDs and response context/revision guards. TypeScript and the web build
are checked. React Doctor reports no errors in the changed paths; an existing
routine finalization loading-flag warning remains outside this upload change.

Deploy both backend and frontend fixes. No migration is needed. Documentation
updated: this note and the frontend/backend services and workflows docs.
