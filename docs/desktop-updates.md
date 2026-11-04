# In-app web and Windows desktop updates

Web releases and native shell releases are independent. A frontend change does not require a new installer. The main **OryxLiveDesktop-Setup.exe** is one offline NSIS installer containing both Windows x86 (32-bit) and x64 (64-bit) applications; it selects the appropriate payload for the operating system. Icons, per-user installation, desktop/Start-menu shortcuts, the companion and server connection screen are retained.

## Native release 0.2.1 (2026-10-31)

The companion size, movement and alerts-panel changes ship as shell version
**0.2.1**. Testing run `41191704523` built and smoke-tested those native changes
as `0.2.0`, but publication correctly refused to replace the existing immutable
`0.2.0` installer with different bytes. Rebuild from a testing commit containing
the version bump to publish `desktop/windows/0.2.1/` and its signed feed. Retain
the published `0.2.0` payload; rerunning the old run still builds its old version.
Web/API compatibility floors remain independent of this release number.

## What users see

- The desktop checks its connected server at launch and every 30 minutes. A newer verified desktop release opens an update dialog with **Download update** and **Remind me later**. Closing the dialog also defers it. Deferral lasts for that app session; launching Oryx again prompts again, including when the companion kept the original process alive.
- The header update icon opens the same dialog. Download progress appears in the dialog and header. A cancelled or failed download can be retried. Completed downloads are verified before **Install and restart** becomes available and checked again before execution.
- Installation is explicit. Oryx refuses to install while a form's unload guard reports unsaved work, flushes its encrypted session vault, starts the verified per-user NSIS update and restarts afterwards. Server settings, companion preferences and the saved encrypted session remain in the existing user-data directory.
- A signed cached release is checked again on launch. Its downloaded installer can still be offered during a server outage. Interrupted partial downloads are discarded; an unverified file is never installed.
- Both the browser and desktop web client check `/deployment.json` every minute while visible and on focus/reconnection. Every changed web commit opens **A web update is ready**, with **Refresh now** and **Remind me later**. Deferring suppresses repeat prompts for that release during the current session; the header update icon reopens it, and another release prompts again. An already stale versioned client is detected on its first check. Builds without an embedded commit compare their loaded entry assets with fresh HTML before adopting the server's commit.
- **Refresh now** checks fresh release metadata and valid Oryx HTML before leaving the current page, then rechecks unsaved-work guards. A failed check keeps the page open and offers retry. The button is disabled during the check. Refresh replaces the current URL with a unique `__oryx_release` query value while preserving the route, existing filters and fragment, preventing reuse of HTML cached under the earlier URL. It does not clear cookies, encrypted sign-in, local preferences or drafts. Metadata checks also use unique URLs with `cache: "no-store"`; HTML/deployment metadata are served as `no-store`, while retained hashed assets remain immutable.
- When `minimumShellVersion` exceeds the installed desktop version, the shell blocks opening the incompatible web release and offers its updater. An already open older web client offers **Update desktop** instead of applying that incompatible release. Reminding later does not bypass the version requirement.

The first updater-enabled shell is **0.2.0**. Clients installed from older installers need one manual bootstrap installation. The web header offers the administrator-published `/downloads/OryxLiveDesktop-Setup.exe` for that transition. Subsequent native updates run inside the application.

## Roll out the web freshness fix

Deploy the web build through the usual release pipeline, with its exact
`RELEASE_SHA` supplied to both the Vite build and `/deployment.json`. A commit
present in Git alone is not a deployment. The customer Docker image already
serves HTML and metadata with `no-store`; host-Nginx installations must regenerate
and reload the supplied Nginx configuration to adopt that HTML policy. Keep prior
hashed assets available for deferred sessions.

An app still running JavaScript from before this fix cannot receive the new
detector until that page reloads. Have those users reconnect or reload once after
deployment. If an existing cache still serves old HTML, open the connected server
URL with a unique query such as `?__oryx_release=initial-20261102` once. Thereafter
new web releases prompt in the desktop without an installer change. The browser
and desktop must connect to the same frontend origin; compare that origin's
`/deployment.json` commit with the successful deployment SHA before diagnosing
remaining differences as caching. No customer deployment or installed-client
verification is implied by local automated checks.

Local verification on 2026-11-02: 21 focused web/update/stale-build tests and
12 customer deployment tests passed, as did the web TypeScript/production build.
The production dialog and simulated server-failure retry were checked in a
browser at 1280×720 and 1366×768. React Doctor reported no errors; its remaining
loading-reset warning is a false positive on the abort-aware reset already inside
`finally`. Installed Windows behavior and Windows display scaling remain customer
acceptance checks.

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
4. Download **oryx-live-windows-installer** for the universal installer. When signing variables are configured, download **oryx-live-desktop-update** for the signed update feed and immutable versioned installer. Customer Docker frontend deployment remains independent. Testing uses this same pipeline: only desktop-input changes trigger the Windows build after testing web deployment, then publish the smoke-tested download and (when configured) signed feed. Web-only releases preserve the existing installer and feed. See [testing publication](deployment.md#testing-site).

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

Desktop workspace tabs register dirty work and pending form/API writes outside
their page/portal lifecycles. The existing beforeunload safety check therefore
vetoes a web/native refresh even when the active page is clean and another tab has
unsaved work. This does not persist or restore all tabs on restart. Native File/Go
tab commands use the new narrow `oryxWorkspace` bridge; older shells retain the
hosted tab controls. See `docs/workspace-tabs.md` before accepting a shell release.

Unit tests cover signing configuration, signature/target/version verification, corruption, cancellation, progress, reminders, offline cache, unsaved-work refusal, post-preparation integrity and install retries. Web tests cover desktop release prompts, first-check detection, missing build identity, polling/reconnection, deferral, uncached refresh preserving routes, HTML/connection failures, preflight compatibility changes, unsaved-work rechecks, duplicate refresh prevention, minimum-shell handling and the header. The Docker smoke checks that the feed and versioned installer are served through the dedicated read-only downloads mount and missing downloads return 404. The Windows workflow contains the real installed upgrade/restart test; it must pass before publishing a release. Its `update-smoke.log` is retained with the other smoke artifacts even on failure. Local development does not access the customer's server or install anything there.
