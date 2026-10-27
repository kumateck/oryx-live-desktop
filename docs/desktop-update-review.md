# Desktop update release review — 27 October 2026

The changes remain local on `entrance-server` for review. No commit, push, customer connection or deployment was performed in this completion pass. Report changes in the shared workspace are excluded from the updater-only review snapshot.

## Completed

- The main NSIS installer embeds x86 and x64 Windows applications using Electron 43.8.3 and retains the connection screen, companion, icons and shortcuts.
- The updater verifies signed metadata and installer bytes, supports progress, reminders, interrupted-download recovery and explicit installation, and checks integrity again after asynchronous installation preparation.
- Unsaved-work guards run before and after the encrypted-session flush. A rejected install remains retryable.
- The manual Windows workflow validates signing configuration before packaging and includes real installation, x86 launch and installed upgrade/restart tests. Its upgrade test also verifies refusal while unsaved work is present; its diagnostics are uploaded on failure.
- Production signing settings are configured in GitHub: private secret `ORYX_DESKTOP_UPDATE_PRIVATE_KEY` and public variable `ORYX_DESKTOP_UPDATE_PUBLIC_KEY`. The private key is absent from source and artifacts.

Public verification-key SHA-256:

```text
39dd323ad4710465b2d9170648fe08bef9f8bd3ce741b45458a87c4084f508be
```

The protected recovery files are `~/.config/oryx-release/desktop-private.pem` and `desktop-public.pem`. The directory is 0700 and the private file is 0600. The administrator should keep an additional encrypted offline backup. Keep this key stable for subsequent releases.

## Verification

The full workspace checks, web production build, local desktop package, updater-only verification snapshot, focused signing/updater/installer tests and isolated Docker smoke pass. The Docker smoke verifies the public feed and versioned installer mount is read-only, missing downloads return 404, and private probe credentials remain inaccessible.

React Doctor found no errors in the update UI. Its single warning concerns lifecycle polling of `/deployment.json`, which intentionally runs outside the authenticated ERP API store so updates also work on connection and sign-in screens.

The local desktop package was also rebuilt with the production public verification key. No private key is passed to packaging.

## Before release

1. Review and push the updater changes to `entrance-server` when authorized. A successful production commit may be picked up by an existing customer deployment Cron.
2. Run the manual installer workflow on that branch. **The updated Windows installation/upgrade CI has not run** because these changes remain local; the previous x64-only workflow result does not validate this implementation.
3. Require the installer and installed-upgrade smoke to pass, then download `oryx-live-windows-installer` and `oryx-live-desktop-update`. Test actual installation on a 32-bit Windows machine; the GitHub runner exercises x86 under 64-bit Windows.
4. Publish the versioned installer first and signed feed last using [the update guide](desktop-updates.md). Existing 0.1.x installations need one manual bootstrap upgrade to the first update-enabled shell.

The release-feed signature is separate from Windows Authenticode; the installer has no Authenticode certificate configured. Electron 43's scheduled support boundary is January 2027, as documented in the update guide.
