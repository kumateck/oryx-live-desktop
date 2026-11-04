# Password-reset links in the desktop app

The existing reset/setup email keeps its HTTP(S) `/reset-password?key=…` link.
That page attempts to open `oryx-live://reset-password?site=…&key=…` in the
installed app and offers **Open in desktop** if the browser requires a click or
confirmation. Browsers control external-app approval; the page cannot silently
detect an installation or override that policy. The normal reset form stays
available when the app is missing, older than 0.2.3, or cannot be opened.

Desktop 0.2.3 registers the protocol through the Windows NSIS installer and macOS
package metadata. Cold Windows launches use the initial arguments; running
Windows apps handle second-instance arguments. macOS receives `open-url` before
asynchronous startup, with delivery deferred until the main window is ready.

Windows registration is written by `build/installer.nsh` during installation,
including silent installation and upgrades, in the selected user's or machine's
registry scope. Electron-builder's `protocols` metadata alone does not generate
this registration for its NSIS target. Both executable and URL argument are
quoted. Uninstallation removes the handler only if it still points to this
installation. Unpacked copies never register themselves on Windows, so a smoke
test or portable copy cannot hijack the installed handler. The Windows gate
checks registration immediately after installation and again after launching the
unpacked x86 build, then exercises cold and running-app reset links.

To validate a fix before merging, manually dispatch **Customer release pipeline**
on its feature branch with `build_windows=true`. This runs the complete release
validator followed by the Windows installation, reset-link and upgrade checks.
It uploads validation artifacts; the testing deployment and publication jobs
remain restricted to `testing`, so this does not publish an installer or replace
any server. Frontend PRs still target `development`.

Only a valid reset key for the already configured HTTP(S) origin is accepted.
Other paths, duplicate/extra parameters, credentials and invalid keys are refused.
An unconfigured or different server produces an instruction to connect correctly
and reopen the email link; no connection or session is changed automatically.

The reset opens in its own sandboxed window with context isolation, Node disabled,
no preload/native bridge, and a unique nonpersistent session partition. It does
not reload or close the ERP window and cannot read its encrypted sign-in. New
reset links do not replace an unfinished reset window. Browser windows, navigation,
redirects and permissions are restricted. Choosing Sign in returns focus to the
main app. While the reset window is focused, its macOS menu retains native editing
and window actions without sending ERP tab/navigation commands to the background
main app. The desktop handler does not log reset keys or save them in local
preferences; they remain in memory/the reset page URL. The backend remains authoritative for token expiry, password
validation, account scope and successful reset; this feature does not consume a
key merely by opening it. Existing backend email URLs need no contract change.

Install the new shell before expecting native handoff. Keep the same protocol
name across upgrades and bump the native version for any later handler change.
The browser bridge follows Electron's [deep-link lifecycle and packaging guide](https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app).

Verification on 4 November 2026: reset parser/signing/updater tests and all seven
auth UI tests passed, along with desktop typechecking and the web build. React
Doctor found no issues. The macOS package was built with the supported Node
runtime and its protocol metadata was inspected. A real Electron shell running
the compiled package assets against a local fixture verified cold/warm/macOS URL
delivery, isolated session/sandbox settings and retention of an unsaved main-window
draft, without server writes. The Windows workflow now checks installed protocol
registration and actual cold/warm OS launches before publishing; those new
Windows checks must pass in CI before releasing 0.2.3. No customer server or
password was changed during these local checks.
