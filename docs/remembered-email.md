# Remember sign-in email

The login form offers an opt-in “Remember my email” checkbox. After successful authentication, only the email is stored in the current origin’s local storage (`oryx.login.email`). Returning to sign-in prefills that email with a blank password. Unchecking removes the stored email immediately. An unavailable local preference store does not block sign-in; passwords, session tokens and refresh tokens are never stored by this preference. Authentication and permission checks are unchanged.

Verification: login, rejected-password, forget and restore tests passed alongside password-reset regressions (10 tests); web typecheck passed. Docker validation is deferred at the user’s request.
