# Settings migration

Desktop implementation: 2026-10-02. This is integration with the existing backend; no backend files were changed.

## Screens and access

| Screen | Route | View | Mutations |
| --- | --- | --- | --- |
| Alerts | `/settings/alert` | `CanViewAlerts` | `CanCreateNewAlerts`, `CanEditAlerts`, `CanEnableDisableAlerts`, `CanDeleteAlerts` |
| Approval workflows | `/settings/approvals` | `CanViewApprovals` | `CanCreateNewApproval`, `CanEditApprovalWorkflow`, `CanDeleteApprovals` |
| Sites | `/settings/sites` | `CanViewSite` | `CanCreateSite`, **`CanEditWorkSite`**, `CanDeleteSite` |
| Signature settings | `/settings/signature` | `CanViewSignatureSettings` | `CanCreateSignatureSettings` |
| Change password | `/settings/change-password` | `CanViewChangePassword` | `CanChangePassword` |

The registry guards routes; controls enforce individual action permissions. Approval create and edit also have specific route rules. Sidebar entries already exist in the Oryx navigation catalog. Pages remain thin and lazy through the route generator.

## Integration and data integrity

- Alerts use generated Settings endpoints, server pagination/search, an enabled/all filter, and scoped `SettingsAlert` cache tags. Recipient role and user directories load only when an editor opens. Edits read a complete record, preserve both recipient kinds, channels, seconds, and fractional TimeSpan ticks. System alerts cannot be edited or removed; authorized delivery toggles remain available. Existing events are read-only because the backend update operation does not change `NotificationType`.
- Approval workflows use generated Approvals endpoints and `ApprovalConfiguration` tags. Edit reads the complete configuration, retains each stage's `required` flag and exact escalation TimeSpan, sorts original stages by `order`, and sends consecutive positive orders after moves. Each submitted stage has one assignee. Protected analytical-result/extra-material policies require exactly one role. Legacy document keys remain editable without replacement. Changing the selected policy never silently removes existing stages; validation explains incompatible configurations. Search and pagination are server-owned; neither list offers unsupported server sorting.
- Sites reuse the collection module's public `CollectionWorkspace` contract. Name/description validation, table menus, confirmation, and scoped caching stay shared with configurations. Dedicated reads and writes carry **Settings / Sites** audit headers; existing `/settings/config?collection=sites` continues using its Configurations audit context.
- Signature settings support drawing, typed names rendered into a PNG, and PNG/JPEG/WebP uploads up to 2 MiB. Only the active field renderer mounts. The current account ID is supplied explicitly; no other-account selection is exposed. Legacy absolute file URLs are normalized to whitelisted same-origin signature paths. Upload success is confirmed by re-reading the authenticated profile and comparing downloaded stored bytes against the submitted image with `cache: no-store`. A failed verification keeps the draft. Uploaded signatures use a contained preview to show the complete image.
- Password change uses generated **POST `/api/v1/auth/user-reset-password`** with current, new, and confirmation passwords and **Authentication / Change Password** audit headers. Passwords are not trimmed, logged, or persisted. HTTP 200 is insufficient: `success` must explicitly be `true`. Only then are fields cleared and this device's session signed out. The client does not claim that all other devices' sessions are revoked.

Editors use existing shadcn controls and the shared typed FormWizard. Growing dialogs have a central `DialogBody` with visible header/footer and a dirty-draft close confirmation. Module-owned Zod schemas reject incomplete records before an edit can overwrite values. Errors use the shared API error formatter and remain visible for retry.

## Existing backend limitations

1. **Password change is currently defective in the checked-in backend.** `APP/Repository/AuthRepository.cs`, `ChangePassword`, calls `ChangePasswordAsync(user, model.NewPassword, model.NewPassword)` instead of supplying `model.CurrentPassword` as the old password. Normal changes therefore fail. The desktop sends the correct DTO and displays failure; it does not substitute the privileged/reset-password flow. Actual successful password changes require a separately authorized backend correction.
2. **Timed delegation does not persist.** `ApprovalRepository.DelegateApproval` only checks whether the target user exists. Settings explains that delegation is unavailable and does not offer a false-success form. Permanent rights transfer is a separate workflow and is not substituted for timed delegation.
3. **Signature upload can silently fail with HTTP 204.** `UserController.UploadSignature` ignores repository failure and catches exceptions as No Content. Stored-file verification compensates on the client; a missing, inaccessible, or different image is not announced as saved.
4. Alert update/delete/toggle can return success for a missing record. The client uses complete reads, protected actions, and invalidation, but does not claim stronger backend transaction guarantees.

## Verification

Focused automated coverage includes TimeSpan bounds and fractional preservation, mixed alert recipients, system-alert restrictions, lazy directories, failed-save draft retention, stage reordering and required flags, protected single-role policies, Sites audit headers, self-service password payloads and HTTP 200 rejection, and signature HTTP 204/read-back verification. Breadcrumb regression coverage checks explicit-parent merging, query-selected parents, repeated record names, and current-page semantics.

Reproduce:

```bash
bun run --filter @oryx/web test src/modules/settings-support src/modules/alerts src/modules/approval-settings src/modules/change-password src/modules/signature-settings src/modules/sites src/modules/collection-configurations src/shared/navigation
bun run typecheck
bun run routes:check
bun run api:check
bun run build:web
```

Authenticated live writes and visual checks at 1366×768 / 1280×720 with Windows scaling have **not** been verified. Existing desktop browser tabs were signed out during inspection. No live customer records were modified by these automated tests. React Doctor's full-workspace scan includes unrelated existing warnings; its supplier `setInterval` cleanup error is a state-setter false positive, and signature save resets busy in `finally` whenever still mounted.
