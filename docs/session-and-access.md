# Session, permissions, and the signed-in user

## Session

The desktop uses the same backend as Oryx Next, unchanged. It signs in with `POST /api/v1/auth/login`, sends the access token as a bearer header, renews it with `POST /api/v1/auth/login-with-refresh-token`, and builds the session from `GET /api/v1/user/authenticated` and `GET /api/v1/permission/user/{id}`. A permission counts as held when its module is active and its types include `Access`, the same rule as Oryx Next.

The access token is kept in memory only. The refresh token is also kept in `sessionStorage` so a reload restores the session; nothing is written to `localStorage`, and the session ends when the window closes. `SessionProvider` (`apps/web/src/shared/auth`) holds the validated public view: user ID, name, email, department, avatar path, and granted permission keys.

| Situation | Behavior |
| --- | --- |
| Startup | The stored refresh token, if any, is exchanged before any protected route renders. A server fault shows a retry; it is never treated as signed out. |
| Wrong credentials | "The email or password is incorrect." The password field is cleared and focused. |
| Disabled account | Explained on the login screen. The backend reports wrong credentials as 400 and a disabled account as 412, so the error code in the response decides which message is shown. |
| Too many attempts (429), server fault, no connection, unreadable reply | Each has its own message. Requests time out after 15 seconds. |
| API request returns 401 | The token is renewed once and the request repeated. Concurrent requests share one renewal, because the backend replaces the refresh token each time. If renewal fails, the workspace closes, its cache is discarded, and the login screen says the session ended and returns the user to the same page after sign-in. |
| Window regains focus or the network returns | The session is re-read after at least a minute, so permission changes are picked up. A failed background check never closes the workspace. |
| Sign-out | The backend has no sign-out endpoint, so signing out discards this window's tokens and tells other open Oryx windows to do the same. The refresh token stays valid on the server until it expires. |

## Permissions

The desktop retains the exact Oryx Next permission keys and active-module / `Access` semantics. No backend code or role assignments are changed. An authenticated user is not automatically authorized for ERP pages or mutations.

### One permission model

`shared/auth/access.ts` defines `PermissionRequirement`: a single key or an `AccessRule`. Rules require authentication, all named keys, or at least one named key. Empty key lists deny access. A rule may also require the backend department type. `SessionProvider` indexes permissions centrally; guards reuse the shared context rather than rebuilding an index per component.

`useAccess()` provides:

| Method | Use |
| --- | --- |
| `has(key)`, `can(rule)`, `allows(requirement)` | Render-time decisions for buttons, panels, tabs, and navigation. |
| `allowsNow(requirement)` | Execution-time decisions using the latest server-confirmed session, including callbacks retained by an open dialog. Revocation takes effect before the next render; sign-out and session expiry invalidate it immediately. |

Loading, signed-out, disabled, and startup-error sessions grant no access. There is no implicit administrator bypass or permission-name guessing.

### Page guards

The workspace's `RouteAccess` resolves the most specific module route rule before mounting the page. Forbidden pages never mount their data hooks. Unknown module roots deny access. An authenticated personal landing page does not grant access to undeclared children; Account, Appearance, and personal IT ticket routes are explicitly declared.

```ts
export const manifest = {
  id: "roles", label: "Roles", root: "/access-management/roles", order: 20,
  access: { kind: "all", permissions: ["CanViewRoles"] },
  routes: [
    { pattern: "/access-management/roles/create", access: { kind: "all", permissions: ["CanCreateRole"] } },
  ],
} satisfies ModuleManifest<"roles", "/access-management/roles">;
```

A permission-based module's descendants inherit its root rule unless a more specific route overrides it. Create, edit, department-restricted, and separately permitted pages must declare overrides. Literal paths win over parameters, and the longest matching module root wins. The access-denied screen offers Back, Home, and Refresh access without granting access locally.

For query-selected lists, declare `query: permissionTabs(viewPermissions)` on the manifest root, or on a specific route. The guard checks each choice before mounting the page. A forbidden or invalid choice redirects with replacement to the first allowed choice, preserves other filters and the fragment, and removes `page`. No allowed choice means access denied. The shared `useKindTabs` also checks selection and normalizes restricted choices on pages that own their own tab state. Record detail pages retain checks against the record's real kind; a URL parameter must never grant access to another kind of record.

`modules/route-coverage.test.ts` discovers workspace route files and checks that each has an owning access policy. It explicitly asserts discovery found pages, so an incorrect glob cannot silently pass. Keep more specific deny/allow tests for business-sensitive pages; coverage alone does not prove an inherited rule is the correct one.

### Action guards

Use `PermissionGuard` for visibility and shared `TableMenu` / `DropdownButton` item `require` for menu actions. Requirements accept the same single-key, all/some, and department rules as routes. Menus recheck the current session on selection. An omitted menu requirement means an authenticated personal/local action; ERP writes must always specify their actual permission.

Shared `ConfirmActionDialog` and `ConfirmDeleteDialog` require an explicit requirement. They disable submission and explain permission loss while open, then recheck immediately before invoking the action. Existing record status, ownership, assignment, stock, and approval gates still apply independently of the permission guard.

Direct form submissions and multi-stage actions use `usePermissionAction`. Check inside the validated submit callback, immediately before the mutation; checking only before asynchronous validation is insufficient.

```tsx
const permission = usePermissionAction(record ? permissions.edit : permissions.create);
const submit = form.handleSubmit(async (values) => {
  const denied = permission.check();
  if (denied) { setError(denied); return; }
  const result = await save(values);
  // Keep the domain's existing server-error handling and success behavior.
});
// Submit button: disabled={saving || !permission.allowed}
```

If an action awaits a preflight query, or saves details and then uploads attachments, recheck before the next write. Report partial completion accurately; never retry a successful first write just because the second was blocked. Bulk operations check each item before sending it. Keep draft editing, cancel, and discard available after an action permission is revoked.

Execution checks cover shared confirmations and account administration, supplier/manufacturer forms, supplier relationship forms, settings editors, material forms, product editing, and production step commands. Other domain workflows retain their existing permission and business guards. New or modified mutation handlers must use this execution check; a hidden button alone is insufficient.

### Permission refresh and server decisions

The session refreshes when the window returns from the background or connectivity returns, subject to the existing one-minute threshold, and after saving role permissions. A backend `403` emits a permission-refresh event: concurrent failures coalesce into one refresh, with a five-second throttle. The failed mutation is **not repeated**, and a `403` does not sign the user out. A `401` continues to use the existing single token-renewal flow.

A failed background refresh preserves the last confirmed session and unsaved work. This means frontend permission freshness depends on successful server reads; backend authorization remains essential. The existing backend has endpoints guarded only by authentication, so frontend guards must not be described as endpoint security. Integration work does not add or modify backend policies.

### Verification

Tests cover route precedence and ownership, department restrictions, undeclared personal routes, tab fallback without mounting forbidden content, retained callbacks after revocation, open confirmations and menus, view-only supplier actions, and `403` refresh without mutation retry. Session tests retain active-module permission parsing and authentication failure coverage.

## User and avatar

`useCurrentUser()` returns the signed-in user. `UserAvatar` shows the photo and falls back to initials while it loads, when the user has none, or when it fails to load. The backend returns the avatar as an absolute `http://` address; the app keeps only its file path on the current origin and accepts only `/api/v1/file/avatar/<file>`, so it also loads when the site is served over HTTPS. The header menu shows name, email, and department, with links to Account and Appearance. `/settings/account` shows the same details, lets the user refresh their access after an administrator changes it, and signs out.

## Navigation

The icon rail lists the Oryx Next sidebar groups the user may see; the sidebar shows the selected group's entries, with headings that collapse. `bun run nav:import` regenerates `apps/web/src/modules/navigation/catalog.generated.ts` from the Oryx Next sidebar, so titles, addresses, and permission keys stay identical while both applications exist. An entry is shown when the user holds any of its permission keys; a heading with nothing visible under it, and a group with nothing visible, are hidden. Group icons are chosen in `group-icons.ts`; a new group fails the type check until it has one. Addresses are the same as in Oryx Next (Roles is `/access-management/roles`). A destination whose screen has not been moved yet opens a page saying so. The header search covers the same visible entries.

## Page headings and breadcrumbs

Nested pages (create, detail, edit) start with `PageHeader` from `shared/navigation/page-header.tsx`: a title and a breadcrumb. With nothing else on the right, the breadcrumb sits there, level with the title; when the page has actions they take the right side and the breadcrumb moves above the title. Pages with a richer heading use `PageBreadcrumbs` on its own.

The start of the trail (group, heading, list page) comes from the sidebar entry the address belongs to, so it always matches the navigation. The page adds the rest: `crumbs={[{ label: product.name, to: detailPath }, { label: "Edit" }]}`. Only real pages are links; a `null` label shows a placeholder while the name loads; long names are truncated with the full name on hover.

Oryx Next builds its breadcrumb from the address segments, which links to addresses that are not pages (`/production`, `/production/products/<id>`) and shows record IDs as "Details".

## Feedback messages

Sonner (the shadcn `Toaster`, mounted once in `main.tsx` and following the Oryx light/dark profile) reports the outcome of an action: saved, submitted, deleted, or refused, with the server's explanation as the description. Import `toast` from `sonner` directly. Keep a message inline, not in a toast, when the user must read it to continue: form validation, login failures, a page that failed to load, and errors inside an open dialog.

## Not covered yet

- The backend has no login rate limit or account lockout, and no endpoint to revoke a refresh token on sign-out. These are backend matters shared with Oryx Next.
- In the installed shell, the refresh token should move from `sessionStorage` to operating-system protected storage through the preload bridge. Until then a restart of the app requires signing in again.
- Forgot/reset password, department switching, and avatar upload exist in Oryx Next and are not migrated.
