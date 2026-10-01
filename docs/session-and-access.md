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
| Window regains focus or the network returns | The session is re-read at most once a minute, so permission changes are picked up. A failed background check never closes the workspace. |
| Sign-out | The backend has no sign-out endpoint, so signing out discards this window's tokens and tells other open Oryx windows to do the same. The refresh token stays valid on the server until it expires. |

## Permissions

Three layers, all reading the same permission keys from the session:

1. **Routes.** Each module manifest declares `access` (the rule for everything under its root) and optional `routes` for pages that need something different. `RouteAccess` in the workspace shell resolves the most specific rule for the current address and renders the access-denied page instead of the page, before the page requests data. Pages do not repeat this check.
2. **Navigation.** Manifest navigation entries carry their own rule and are hidden when it fails.
3. **Actions.** Wrap a button or section in `<PermissionGuard require="CanCreateRole">`, or call `useAccess()` for `has(key)` and `can(rule)` when the result drives logic.

```ts
export const manifest = {
  id: "roles", label: "Roles", root: "/roles", order: 20,
  access: { kind: "all", permissions: ["CanViewRoles"] },
  routes: [{ pattern: "/roles/create", access: { kind: "all", permissions: ["CanCreateRole"] } }],
  navigation: [...],
} satisfies ModuleManifest<"roles", "/roles">;
```

A rule is `authenticated`, `all` of a list, or `some` of a list. An empty list never grants access. Routes outside every module root (such as `/settings`) need only a signed-in user. These checks decide what the user sees; the backend policy on each endpoint decides what the user can do.

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
