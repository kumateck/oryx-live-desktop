# Roles: first ERP module slice

## Workflow mapping

| Oryx Next behavior | Desktop implementation |
| --- | --- |
| Searchable role list | `/access-management/roles`, validated role DTOs, TanStack Table 9 paging and detail links |
| Create role with department type and permissions | `/access-management/roles/create`, Zod + React Hook Form + FormWizard, permission catalog loaded only on this route |
| Edit role details | `/access-management/roles/:id`, one role request by ID, separate details save |
| Edit role permissions | `/access-management/roles/:id`, permission picker shows one module at a time |
| Delete role | Confirmation dialog, server usage check, then guarded delete |
| Audit | `Module: Access Management`, `SubModule: Manage Roles` on requests |

## Dedicated permission workspace

`/access-management/permissions` uses the same contract as Oryx Next: load the full permission catalog and the chosen role's assignments, merge by module and permission key, and submit the entire catalog to the role permission endpoint. Both requests start together. New catalog actions start without access; catalog defaults are never inherited by an existing role. The catalog is shared through RTK Query and role assignments have role-specific cache tags. Only current-role data may populate the editor while switching roles.

The reusable permission picker is shared with role creation and detail editing. Compact shadcn module tabs sit across the top, with full names and enabled/total counts in hover and keyboard-focus tooltips. The module heading and Access switch follow. Submodules appear in a left column; permission names/descriptions and an Access column appear on the right. Only the selected content mounts, with each list scrolling independently. The submodule starts with the first group, as in Oryx Next, and also offers all submodules. At narrow component widths the submodule list becomes a select control; module tabs wrap to avoid horizontal scrolling.

The module access switch follows Oryx Next: turning it off clears every permission in that module, and turning it on enables them all. A partially enabled module remains active and its exact enabled count stays visible. Individual shadcn switches edit one action. Search checks the name, key, description and submodule. **Enable shown / Disable shown** affects visible permission keys; unrelated actions and other modules are preserved. When the catalog repeats one permission key in several workflows of the same module, those representations change together, matching Oryx Next.

The dedicated workspace fills the remaining content height. Its permission list scrolls internally, keeping the filters and Reset/Apply controls visible. Browsing modules or submodules preserves the draft. Switching roles with changes requires choosing to keep editing or discard; route navigation and window unload use the shared unsaved-work guard. Apply requires confirmation, preserves the draft on failure, and refreshes the signed-in session after success. View-only administrators can browse and search but cannot edit or save. Reset discards local edits under the existing `CanResetPermission` gate.

Focused tests cover catalog merging, absent assignments, submodule grouping, search, filtered bulk changes, module toggles, view-only controls, role switching, stale-role cache prevention, full-payload audit metadata, and failed-save retry. Live verification is read-only; real permission writes remain a release acceptance check.

The existing Oryx Next role form has only one selectable permission type, `Access`. The desktop picker preserves that behavior. Creation clears the catalog's default access values before an administrator chooses permissions, preventing an accidental all-access role.

## Authorization and cache

The UI uses the existing `CanViewRoles`, `CanCreateRole`, `CanEditRole`, `CanDeleteRole`, and `CanUpdateExistingPermission` keys to hide unavailable routes and controls; the backend remains the authority. Role creation, detail edits, permission saves, and deletion apply immediately, as in Oryx Next. Each invalidates only the changed role and the role list. A permission save also re-reads the signed-in user's own permissions, in case they hold that role.

## Release verification

Against the shared backend with a test account, verify: sign-in and restore; no-permission, view-only, editor, and administrator roles; create, edit, permission update, and delete; assigned-role deletion refusal; audit entries; token expiry and renewal; network interruption and retry. Check the list and detail at 1366×768 and 1280×720, including Windows 125% and 150% scaling.
