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

The existing Oryx Next role form has only one selectable permission type, `Access`. The desktop picker preserves that behavior. Creation clears the catalog's default access values before an administrator chooses permissions, preventing an accidental all-access role.

## Authorization and cache

The UI uses the existing `CanViewRoles`, `CanCreateRole`, `CanEditRole`, `CanDeleteRole`, and `CanUpdateExistingPermission` keys to hide unavailable routes and controls; the backend remains the authority. Role creation, detail edits, permission saves, and deletion apply immediately, as in Oryx Next. Each invalidates only the changed role and the role list. A permission save also re-reads the signed-in user's own permissions, in case they hold that role.

## Release verification

Against the shared backend with a test account, verify: sign-in and restore; no-permission, view-only, editor, and administrator roles; create, edit, permission update, and delete; assigned-role deletion refusal; audit entries; token expiry and renewal; network interruption and retry. Check the list and detail at 1366×768 and 1280×720, including Windows 125% and 150% scaling.
