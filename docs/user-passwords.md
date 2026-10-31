# Change user password — 2026-10-31

`/settings/user-passwords` lets one account, `dkadusei@kumateck.com`, set a new password for any other user. Everyone else sees neither the menu entry nor the page; opening the address shows the access-denied screen before anything loads.

## Using it

1. Pick the user (search by name or email; active and disabled accounts are listed).
2. Type the new password twice. The checklist under the field shows the server's rules as they are met: at least 8 characters, a digit, a capital letter and a symbol. Passwords are sent exactly as typed, spaces included.
3. Choose **Change password**, then confirm in the dialog.

On success the page says so and clears the form. The user's other sessions are signed out and they need the new password to sign in. If the server refuses, the reason is shown under the form and what was typed is kept.

## How access is limited

- **Backend (the authority).** `POST /api/v1/auth/admin/user-password` (backend `docs/admin-user-password-reset.md`) checks the caller's stored email and returns 403 for anyone else. It writes an activity-log entry naming the admin and the target, never the password.
- **Route and menu.** `shared/auth/password-admin.ts` holds the address and the `account` access rule. The module manifest (`modules/user-passwords/manifest.ts`) uses it, so `RouteAccess` refuses the route for anyone else. The sidebar entry ("Change User Password", under System Settings next to Change Password) carries `accounts` and is shown only to that account. The email comes from `GET /api/v1/user/authenticated`, not from the token.
- **Action.** Saving rechecks the rule with `usePermissionAction` just before the request, and the confirmation dialog does too.

To change the allowed account, update `passwordAdminEmail`, the backend's `UserPasswordAdminRepository.PasswordAdminEmail`, and the entry in `scripts/import-navigation.ts`, then run `bun run nav:import` (or edit the generated catalog entry to match).

## Code

| Part | File |
| --- | --- |
| Route page | `apps/web/src/pages/(workspace)/settings/user-passwords/page.tsx` |
| Form, rule checklist | `modules/user-passwords/components/` |
| User search, save | `modules/user-passwords/hooks/` |
| Validation | `modules/user-passwords/schemas/user-password-schema.ts` (rules from `shared/auth/password-rules.ts`) |
| API hooks | `modules/user-passwords/api/user-password-api.ts` (generated `usePostApiV1AuthAdminUserPasswordMutation`) |

The contract adds only this operation and its request schema (backend `feat/admin-reset-user-password`), and the new contract fingerprint is approved in `deploy/customer-server/release.json`. The page needs that backend change deployed first.

## Tests

`modules/user-passwords/user-passwords.test.tsx`: the route rule and menu entry allow only that account (any letter case) and refuse other users, users with every user permission, look-alike addresses and missing emails; another user gets the access-denied screen and no requests; mismatched or weak passwords are stopped before confirmation; a confirmed change sends the user ID and the untrimmed password and shows success; a server refusal shows the reason and keeps the form.
