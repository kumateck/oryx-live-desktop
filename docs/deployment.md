# Deployment

## Testing site

The `testing` branch deploys a site for people to try the app, on the same server as the Oryx Next demo and against the same backend.

| | |
| --- | --- |
| App in a browser | http://164.90.142.68:3011 |
| Windows installer | http://164.90.142.68:3011/downloads/OryxLiveDesktop-Setup.exe |
| Backend | http://164.90.142.68:8086 (the Oryx Next demo backend; same accounts and data) |

The single **Customer release pipeline** (`.github/workflows/customer-docker.yml`) serves both branches, with one global queue and sequential jobs. `queue: max` retains up to 100 waiting runs while `cancel-in-progress: false` protects the active run; the default single-pending queue can replace a waiting deployment when another run arrives. **Development is a quiet working branch:** pushes to it and opening/updating pull requests do not start GitHub Actions. Merge a milestone PR into `testing` (or push directly to `testing`) to publish for QA. The merge creates the testing-branch push event, producing one release run after validation succeeds:

1. builds the existing `deploy/Dockerfile` web and gateway targets and publishes exact-SHA images to GHCR;
2. validates the candidate without stopping the working site, then replaces only `oryx-live-web` and `oryx-live-gateway` on `sail`, exposing port **3011**;
3. verifies `/deployment.json` contains the pushed commit and branch `testing`, API connectivity, and served JS/CSS checksums; activation failure restores the previous containers;
4. **when desktop inputs differ from the last published installer, or no verified desktop publication exists**, builds the Windows installer, performs installation/launch/upgrade smoke tests, and publishes the verified download. With signing configured, it publishes the immutable versioned installer before the signed update feed.

Once the current native release has been published, web-only changes (including final-packing/syrup changes) skip Windows packaging and preserve the existing installer. Installed shells load the updated hosted frontend without reinstallation. Desktop inputs include `apps/desktop/`, the bundled `assets/oryx-wordmark.svg`, shared desktop contracts, and native build/update scripts. Desktop dependency changes must update `apps/desktop/package.json`; changing the shared lockfile for web dependencies alone does not trigger Windows. Bump the desktop package version for a new native release: an existing signed version cannot be overwritten with different installer bytes.

For a manual testing-site retry, select **testing**, enable **deploy_testing**, and run the same workflow. After the web activation succeeds, CI reads the testing server's private `~/oryx-live/desktop-release.sha` over the existing SSH connection and verifies it against the installed EXE's SHA-256. It compares that source commit with the current checkout's desktop inputs. A missing record (including the old x64-only installation) requires the first current x86/x64 publication, even when recent pushes changed only web files. A malformed or mismatched record fails explicitly. The record advances atomically only after installer publication succeeds, so successful web releases and failed native releases cannot hide unpublished desktop changes. For failed native packaging/publication, rerun the failed jobs in the original run so the original desktop-change decision is retained. PRs and pushes to `entrance-server` never SSH to this testing site. Production customer deployment still accepts only approved `origin/entrance-server` commits on port **3001** through its independent manual/Cron deployment agent.

The testing deployment reuses the existing SSH/RabbitMQ repository secrets. It discovers the demo backend route on `sail` through host port 8086 and leaves the running site alone if connectivity or candidate verification fails. It neither prunes Docker images globally nor changes the backend, Oryx Next, or databases. The desktop publisher runs only after the web deployment and native smoke checks succeed; a web-only run with an up-to-date native release does not copy desktop files. It publishes `OryxLiveDesktop-Setup.exe.sha256` beside the installer. One installer embeds both x86 and x64 payloads and selects the appropriate architecture during installation; there are not separate public x32 and x64 downloads.

To identify what is actually served, open [`/deployment.json`](http://164.90.142.68:3011/deployment.json) and compare `commit` with the **testing push** run's SHA. `unversioned` identifies an older build without commit metadata. An open PR or a commit on `development` does not update the testing site. Merging the PR into `testing` starts its QA release; merging into `entrance-server` starts customer release approval. After the workflow correction is manually pushed to `testing`, its push run must complete **Deploy testing web** before the web changes appear.

## The Windows installer

`bun run --filter @oryx/desktop make:windows` (on Windows) compiles the shell with Electron Forge, then packages both Windows x86 and x64 applications in one NSIS installer with electron-builder (`apps/desktop/electron-builder.config.cjs`). The wizard selects the operating-system architecture, lets the user choose the folder, installs per user without administrator rights, creates Start-menu and desktop shortcuts, and offers to open the app at the end. The output is `apps/desktop/out/make/nsis/OryxLiveDesktop-Setup.exe`. See [desktop update setup and runtime support](desktop-updates.md) for the Windows runtime pin and signed update publishing.

Icons come from the Oryx mark (`assets/oryx-mark.png`, taken from Oryx Next's logo): `apps/desktop/build/icon.ico` (Windows executable and installer), `icon.icns` (macOS), and the web favicons and `site.webmanifest` in `apps/web/public`.

The connection page is built by Vite into `apps/desktop/.vite/renderer/main_window`; `vite.renderer.config.ts` sets that output explicitly, because its `root` is `src/connection` and the default output would land outside the packaged app (the first Squirrel installer opened a window with nothing to show).

The web container passes `/api` to the backend and `/realtime` (with WebSocket upgrade) to the gateway, so the browser and the desktop shell reach everything on one origin. It forwards the browser's own `Host` to the backend, because the backend writes attachment, avatar and signature links from it; without that they would name the backend's container and not open. `index.html` is always revalidated and hashed assets are cached for a year. Each release's assets are also copied to `~/oryx-live/assets` on the server and retained additively by `deploy/keep-assets.sh`, so a window opened before a deploy can still load pages it had not opened yet. If one is gone anyway, the app recognises the failed load and loads the new release once (`shared/errors/stale-build.ts`), instead of showing "This page could not be opened".

### Repository secrets

The workflow uses the server secrets of `oryx-next`'s deploy workflows, under the repository's **Settings → Secrets and variables → Actions**: `SSH_HOST`, `SSH_PORT`, `SSH_USERNAME`, `SSH_PRIVATE_KEY`, `RABBITMQ_HOST`, `RABBITMQ_PASS`. Images go to GitHub's registry, so no Docker Hub account is used.

### For testers

- **Browser:** open the address above in Chrome or Edge and sign in with an Oryx account.
- **Windows app:** download and run the installer, choose where to install, and finish; it opens the app and leaves a desktop shortcut. It is not code-signed yet, so Windows SmartScreen warns first (**More info → Run anyway**). On the connection screen, enter `http://164.90.142.68:3011`. Web releases reach the installed app without reinstalling; a new installer is only needed when the desktop shell changes.

### Known limits

- Plain HTTP: passwords and tokens cross the network unencrypted, as they already do for the Oryx Next demo. Put the site behind HTTPS (a domain and a certificate) before real data or customers use it.
- Windows Authenticode signing remains outstanding. On `entrance-server`, desktop 0.2.0 introduces signed in-app updates; an older installation needs one manual bootstrap upgrade. Configure its verification/signing keys and publish the update bundle before offering native updates. See [desktop updates](desktop-updates.md).
- Build the desktop shell with Node 22 or 24. On Node 26, Electron Packager stops silently while extracting Electron and produces nothing.

## Building the images yourself

```bash
docker build -f deploy/Dockerfile --target web -t oryx-live-web .
docker build -f deploy/Dockerfile --target gateway -t oryx-live-gateway .
```

The web image needs `ORYX_API_ORIGIN` (the backend origin) and `ORYX_GATEWAY_UPSTREAM` (`host:port` of the gateway on the Docker network). The gateway's variables are listed in `docs/notifications.md`; in the image it listens on `0.0.0.0:4100`.

## Attachment engine assets

The web build includes pinned PDFCraft, WordCraft and GridCraft assets under `/viewers/`. Nginx serves these paths directly with immutable caching and 404 for missing files; they must never resolve to `index.html`. The startup retention script validates all three JS/WASM pairs and their WASM headers before copying app chunks and engine revisions/notices onto the existing `~/oryx-live/assets` volume. Older engine revisions are retained additively, so open windows keep their matching runtime after an update. An incomplete engine release fails startup visibly.

The shipment attachment audit found port 3011 serving the legacy direct-iframe viewer and HTML for a missing engine. Publishing the corrected web image/configuration is required; no shell reinstall is needed. See [attachment-audit.md](attachment-audit.md) for evidence, coverage and acceptance limits.

## Entrance customer deployment branch

The Entrance customer-server package is implemented under [`deploy/customer-server`](../deploy/customer-server/README.md) and tracks `entrance-server` by default. A root-owned `/etc/oryx-deploy/customer.env` stores the existing customer's backend origin once, alongside the deployment branch and site settings. The agent builds exact commits, checks compatibility, retains previous assets, activates atomically, and verifies or rolls back. The single `.github/workflows/customer-docker.yml` pipeline validates both customer deployment packages sequentially, using the same exact-commit validator as pre-push.

Follow the package guide for SSH deploy-key provisioning, installation, pause/resume, failure quarantine, rollback, retention, and uninstall. Its installer does not start deployment automatically. No live customer installation or branch creation is performed during development. Testing-only stages in the same workflow serve the testing site described above. Customer-hosted frontend releases, backend deployments, gateway restarts, and installed Electron updates remain separate release targets.

## Manual customer Docker package

For the Ubuntu `entrance` account, use [`deploy/customer-docker`](../deploy/customer-docker/README.md). It reuses this document's web Docker target and Nginx/asset retention, deploys only approved `origin/entrance-server` commits on port 3001, and supports manual installation plus Cron polling. Checksummed image archives preserve rollback after an unrelated `docker image prune -a -f`. The host-Nginx package under `deploy/customer-server` remains unchanged and separate.

The shared Docker builder now pins Bun 1.4.4 and Node 24 LTS, runs repository checks before the web build, emits release metadata when a SHA is supplied, and uses stable Nginx Alpine. Legacy web builds without a supplied SHA identify as `unversioned`; the customer package always supplies and verifies a full production SHA. Asset retention is now additive rather than automatically deleting files after 30 days, so existing sessions and rollback assets remain available; monitor disk usage.

Customer Docker preflight requires basic backend API connectivity, not an identical OpenAPI fingerprint. Candidate activation checks focused critical API contracts when local Swagger is available; confirmed incompatibilities block deployment and unavailable/ambiguous metadata produces warnings. See the [customer Docker compatibility policy](../deploy/customer-docker/README.md#focused-compatibility-before-activation). The independent host-Nginx policy is unchanged.

## Manual customer Windows installer

On `entrance-server`, the single `customer-docker.yml` workflow has an optional manual **build_windows** job after release validation, with a combined Windows x86/x64 build, native installation/launch and installed-upgrade checks, and the `oryx-live-windows-installer` artifact. Testing pushes use the same workflow and build Windows only for desktop input changes. Follow the [customer Windows installer guide](customer-windows-installer.md) to trigger it, download `OryxLiveDesktop-Setup.exe`, and connect the shell to `http://CUSTOMER_SERVER_IP:3001`. Customer Docker approval/deployment remains separate.
