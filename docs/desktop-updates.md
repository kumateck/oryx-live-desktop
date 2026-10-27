# In-app web and Windows desktop updates

Web releases and native shell releases are independent. A frontend change does not require a new installer. The main **OryxLiveDesktop-Setup.exe** is one offline NSIS installer containing both Windows x86 (32-bit) and x64 (64-bit) applications; it selects the appropriate payload for the operating system. Icons, per-user installation, desktop/Start-menu shortcuts, the companion and server connection screen are retained.

## What users see

- The desktop checks its connected server at launch and every 30 minutes. A newer verified desktop release opens an update dialog with **Download update** and **Remind me later**. Closing the dialog also defers it. Deferral lasts for that app session; launching Oryx again prompts again, including when the companion kept the original process alive.
- The header update icon opens the same dialog. Download progress appears in the dialog and header. A cancelled or failed download can be retried. Completed downloads are verified before **Install and restart** becomes available and checked again before execution.
- Installation is explicit. Oryx refuses to install while a form's unload guard reports unsaved work, flushes its encrypted session vault, starts the verified per-user NSIS update and restarts afterwards. Server settings, companion preferences and the saved encrypted session remain in the existing user-data directory.
- A signed cached release is checked again on launch. Its downloaded installer can still be offered during a server outage. Interrupted partial downloads are discarded; an unverified file is never installed.
- The web client checks `/deployment.json` every minute and on focus/reconnection. A changed web commit refreshes automatically only on a visible screen without visible forms, editable controls, open dialogs or unsaved-work guards. Hidden controls such as the collapsed header search do not prevent a safe update. Otherwise **A web update is ready** offers a safe refresh and reminder. The existing retained hashed assets keep deferred sessions usable.
- When `minimumShellVersion` exceeds the installed desktop version, the shell blocks opening the incompatible web release and offers its updater. An already open older web client offers **Update desktop** instead of applying that incompatible release. Reminding later does not bypass the version requirement.

The first updater-enabled shell is **0.2.0**. Clients installed from older installers need one manual bootstrap installation. The web header offers the administrator-published `/downloads/OryxLiveDesktop-Setup.exe` for that transition. Subsequent native updates run inside the application.

## Supported Windows runtime

The combined Windows installer pins **Electron 43.8.3** for both architectures. Electron 44 stopped publishing Windows ia32; Electron 43 is the last 32-bit line, currently scheduled to reach end of support on **5 January 2027**. Review this limit before committing to long-term 32-bit deployment. The native API/sandbox checks remain enabled. macOS packaging is preserved, but this first updater does not automatically install macOS updates.

Sources: [Electron 43 platform support](https://www.electronjs.org/blog/electron-43-0), [release schedule](https://releases.electronjs.org/schedule), [NSIS multi-architecture installers](https://www.electron.build/nsis.html).

## One-time administrator setup

Release authenticity is established by a pinned Ed25519 public key, not by trusting a checksum downloaded from the same server. Generate the signing key **outside the repository** on an administrator-controlled machine:

```bash
bun scripts/create-desktop-update.ts keygen \
  "$HOME/.config/oryx-release/desktop-private.pem" \
  "$HOME/.config/oryx-release/desktop-public.pem"
```

In GitHub repository **Settings → Secrets and variables → Actions**, configure:

| Setting | Location | Value |
| --- | --- | --- |
| `ORYX_DESKTOP_UPDATE_PUBLIC_KEY` | Repository variable | Complete contents of `desktop-public.pem`, including PEM headers and newlines. This public key is compiled into the desktop shell. |
| `ORYX_DESKTOP_UPDATE_PRIVATE_KEY` | Repository secret | Complete contents of `desktop-private.pem`. Used only by the release-signing step. |

Back up the private key securely. Never put it in Git, the frontend, customer environment files or the customer server. Keep the verification key stable across releases; replacing it requires a controlled bootstrap migration. Builds without a public key remain manually installable, but their updater explicitly reports that automatic updates are not configured. They never accept unsigned updates.

The workflow validates both settings before packaging. A missing half of the pair, a non-Ed25519 key, or mismatched keys fails immediately. With neither setting configured, its summary explicitly labels the installer **manual-only**. With a valid pair, the summary records the public-key SHA-256 fingerprint and the signed update artifact is produced after the installed-upgrade smoke passes. The private key is never included in the summary or artifacts.

## Build a native release

1. Increase `apps/desktop/package.json`'s numeric `major.minor.patch` version for each native release. Do not change the native version for frontend-only releases.
2. Run `customer-docker.yml` manually on **entrance-server** with **build_windows=true** as described in [the installer guide](customer-windows-installer.md). `make:windows` defaults to the combined installer. Electron Forge compiles the existing main, preload, connection and companion code; electron-builder packages those outputs for both architectures into the existing NSIS wizard. It does not copy ERP frontend code into the shell.
3. The Windows workflow checks both PE architectures, installs the combined installer, verifies shortcuts and native windows, and launches the x86 payload under Windows' 32-bit compatibility layer. Its installed-upgrade smoke uses disposable signing keys and two test versions to exercise reminder, download progress, unsaved-work refusal, actual NSIS upgrade/restart, and encrypted-session/server retention. Test-key installers are never uploaded as production artifacts. Installer integrity is checked again after the unload guard and encrypted-session flush, immediately before process launch.
4. Download **oryx-live-windows-installer** for the universal installer. When signing variables are configured, download **oryx-live-desktop-update** for the signed update feed and immutable versioned installer. The standard customer Docker workflow remains separate.

For local Windows builds, use Bun 1.3.14 with Node 24:

```bash
bun install --frozen-lockfile
bun run --filter @oryx/desktop make:windows
# Default output: apps/desktop/out/make/nsis/OryxLiveDesktop-Setup.exe
```

The optional `make:windows:x86` command builds an x86-only package for diagnostics; the public main installer is the combined package. The current GitHub runner is a 64-bit OS, so actual installation on customer 32-bit Windows remains a separate acceptance check.

## Publish to the customer's frontend

The Docker deployment now mounts only `$ORYX_DEPLOY_STATE/downloads` into Nginx at `/srv/downloads`, read-only. The deployment script creates that dedicated public directory as 0755; private deployment state and customer configuration keep their existing restrictions. Publishing installers requires updating the deployment tools/Compose and manually deploying their approved frontend release. No backend or database change is needed.

Extract the signed update artifact on the customer's server. Its layout is:

```text
desktop/windows/latest.json
desktop/windows/0.2.0/OryxLiveDesktop-Setup.exe
```

Copy the **versioned installer first**, verify its bytes against the artifact, and publish `latest.json` last by an atomic rename. Example for version 0.2.0, run manually as `entrance`:

```bash
PUBLIC=/home/entrance/.local/state/oryx-live/downloads
install -d -m 0755 "$PUBLIC/desktop/windows/0.2.0"
install -m 0644 desktop/windows/0.2.0/OryxLiveDesktop-Setup.exe \
  "$PUBLIC/desktop/windows/0.2.0/OryxLiveDesktop-Setup.exe"
install -m 0644 desktop/windows/latest.json "$PUBLIC/desktop/windows/latest.json.tmp"
mv "$PUBLIC/desktop/windows/latest.json.tmp" "$PUBLIC/desktop/windows/latest.json"
# Keep the initial/manual download pointing at the same universal installer.
install -m 0644 desktop/windows/0.2.0/OryxLiveDesktop-Setup.exe "$PUBLIC/OryxLiveDesktop-Setup.exe.tmp"
mv "$PUBLIC/OryxLiveDesktop-Setup.exe.tmp" "$PUBLIC/OryxLiveDesktop-Setup.exe"
```

Use a new version directory on later releases; never replace a published version with different bytes. Retain previous installers for recovery. The feed and installer are requested from the saved frontend origin, e.g. `http://CUSTOMER_SERVER:3001/downloads/desktop/windows/latest.json`. Downloads send no ERP credentials, refuse redirects, enforce signed target/size/SHA-512, and verify metadata with the embedded key. TLS verification remains enabled for HTTPS origins. HTTP intranet origins retain cryptographic release verification.

Only raise `deploy/customer-docker/requirements.json`'s `minimumShellVersion` when a web release truly needs a new native capability. Publish the desktop release and verify client rollout first, then update the administrator's existing `ORYX_SHELL_FLOOR` baseline and deploy the web release. The server-side minimum-shell guard remains enforced.

## Verification limits

Unit tests cover signing configuration, signature/target/version verification, corruption, cancellation, progress, reminders, offline cache, unsaved-work refusal, post-preparation integrity and install retries. Web tests cover safe refresh, minimum-shell handling and the header. The Docker smoke checks that the feed and versioned installer are served through the dedicated read-only downloads mount and missing downloads return 404. The Windows workflow contains the real installed upgrade/restart test; it must pass before publishing a release. Its `update-smoke.log` is retained with the other smoke artifacts even on failure. Local development does not access the customer's server or install anything there.
