# Users: second ERP module slice

## Workflow mapping

| Oryx Next behavior | Desktop implementation |
| --- | --- |
| User directory with Active and Inactive tabs | `/access-management/users?status=0\|1`, `ServerDataTable` paged and searched by the backend |
| Each tab has its own view permission | Only permitted tabs are shown; an address for a tab the user may not view opens the permitted one |
| Row menu: details, edit, block, unblock | Row menu with the same actions, each shown only with its permission; opening a row shows its details |
| Create user for an employee | `/access-management/users/create`: employee picker (active employees without an account) and role |
| Edit a user's role | "Change role" dialog from the row |
| Audit | `Module: User Management`, `SubModule: Manage Users Directory` on requests |

Permission keys are the existing ones: `CanViewActiveUser`, `CanViewInactiveUser`, `CanCreateUser`, `CanEditUser`, `CanBlockUser`, `CanUnblockUser`.

## Differences from Oryx Next, and why

- **Role change sends the role's name.** The backend finds the role by name. Oryx Next sends the display label when the selection changes, which only works when the two happen to match.
- **No `/access-management/users/:id` page.** The backend has no endpoint for one user; the Oryx Next page loads the first page of the list and looks for the user there, so it reports "User Not Found" for anyone beyond that page. The role is changed in a dialog from the row, which already has the user's data.
- **Block and unblock say which way they go.** One endpoint flips the account's state, so the confirmation is worded from the user's current state.
- **The list endpoint's `isActive` parameter is the disabled flag.** `false` returns enabled accounts. This is wrapped in `disabledFilter` so the inversion lives in one named place.
- **Role options need `CanViewRoles`.** The backend now requires it on the role list. Someone who can create or edit users but cannot view roles gets a clear "Roles could not be loaded" message with the server's reason.

## Cache

The user list is one cache tag. Changing a role, blocking, unblocking, and creating a user invalidate it; nothing else is refetched.

## Verification still to do against the shared backend

Sign in as users holding each combination of the six permissions; search and page through both tabs; create a user for an employee and confirm the employee leaves the picker; change a role; block and unblock; confirm audit entries; check at 1366×768 and 1280×720.
