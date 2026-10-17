# Deployment

## Testing site

The `testing` branch deploys a site for people to try the app, on the same server as the Oryx Next demo and against the same backend.

| | |
| --- | --- |
| App in a browser | http://164.90.142.68:3011 |
| Windows installer | http://164.90.142.68:3011/downloads/OryxLiveDesktop-Setup.exe |
| Backend | http://164.90.142.68:8086 (the Oryx Next demo backend; same accounts and data) |

Push to `testing` (or run **Deploy testing site** from the Actions tab) and `.github/workflows/deploy-testing.yml`:

1. runs `bun run check` (on CI, web tests get a 30-second timeout and a failing one is retried twice, since the runners are slower);
2. builds two images from `deploy/Dockerfile` and pushes them to GitHub's registry: `ghcr.io/kumateck/oryx-live-web` (nginx serving `apps/web/dist`) and `ghcr.io/kumateck/oryx-live-gateway` (`apps/gateway`). The workflow's own token pushes them, and the server pulls with it during the deploy, then signs out;
3. over SSH, replaces the `oryx-live-gateway` and `oryx-live-web` containers on the `sail` network, publishing the web container on port 3011;
4. builds the Windows installer on a Windows runner and copies it to `~/oryx-live/downloads` on the server, which the web container serves at `/downloads/`. Before publishing, the runner installs it silently, checks the Start-menu and desktop shortcuts, and opens the app twice: fresh (it must show **Connect to Oryx**) and pointed at the site (it must leave the connection page). Screenshots of both are kept as the run's `windows-launch-screenshots` artifact.

Containers on that server cannot reach it through its own public address, so the deploy step finds a route to the backend and to RabbitMQ before starting anything, testing from the `sail` network as the containers will: the container publishing the port (by name), then the server itself through the network's gateway address ("localhost" as seen from a container), then the public address. It uses the first that answers, and stops without touching the running site if none reaches the backend. After starting, it checks `/api` through the site and fails the run if the backend does not answer.

## The Windows installer

`bun run --filter @oryx/desktop make:windows` (on Windows) packages the shell with Electron Forge, then wraps it in an NSIS installer with electron-builder (`apps/desktop/electron-builder.config.cjs`), as `vipex_app` does: an installer wizard that lets the user choose the folder, installs per user without administrator rights, creates Start-menu and desktop shortcuts, and offers to open the app at the end. The output is `apps/desktop/out/make/nsis/OryxLiveDesktop-Setup.exe`, published under the same name so the download link never changes.

Icons come from the Oryx mark (`assets/oryx-mark.png`, taken from Oryx Next's logo): `apps/desktop/build/icon.ico` (Windows executable and installer), `icon.icns` (macOS), and the web favicons and `site.webmanifest` in `apps/web/public`.

The connection page is built by Vite into `apps/desktop/.vite/renderer/main_window`; `vite.renderer.config.ts` sets that output explicitly, because its `root` is `src/connection` and the default output would land outside the packaged app (the first Squirrel installer opened a window with nothing to show).

The web container passes `/api` to the backend and `/realtime` (with WebSocket upgrade) to the gateway, so the browser and the desktop shell reach everything on one origin. It forwards the browser's own `Host` to the backend, because the backend writes attachment, avatar and signature links from it; without that they would name the backend's container and not open. `index.html` is always revalidated and hashed assets are cached for a year. Each release's assets are also copied to `~/oryx-live/assets` on the server and kept for 30 days after the last release that shipped them (`deploy/keep-assets.sh`), so a window opened before a deploy can still load pages it had not opened yet. If one is gone anyway, the app recognises the failed load and loads the new release once (`shared/errors/stale-build.ts`), instead of showing "This page could not be opened".

### Repository secrets

The workflow uses the server secrets of `oryx-next`'s deploy workflows, under the repository's **Settings → Secrets and variables → Actions**: `SSH_HOST`, `SSH_PORT`, `SSH_USERNAME`, `SSH_PRIVATE_KEY`, `RABBITMQ_HOST`, `RABBITMQ_PASS`. Images go to GitHub's registry, so no Docker Hub account is used.

### For testers

- **Browser:** open the address above in Chrome or Edge and sign in with an Oryx account.
- **Windows app:** download and run the installer, choose where to install, and finish; it opens the app and leaves a desktop shortcut. It is not code-signed yet, so Windows SmartScreen warns first (**More info → Run anyway**). On the connection screen, enter `http://164.90.142.68:3011`. Web releases reach the installed app without reinstalling; a new installer is only needed when the desktop shell changes.

### Known limits

- Plain HTTP: passwords and tokens cross the network unencrypted, as they already do for the Oryx Next demo. Put the site behind HTTPS (a domain and a certificate) before real data or customers use it.
- The installer is unsigned and has no automatic shell updates yet; reinstalling from the link upgrades it in place (`PLAN.md`, site deployment and shell updates).
- Build the desktop shell with Node 22 or 24. On Node 26, Electron Packager stops silently while extracting Electron and produces nothing.

## Building the images yourself

```bash
docker build -f deploy/Dockerfile --target web -t oryx-live-web .
docker build -f deploy/Dockerfile --target gateway -t oryx-live-gateway .
```

The web image needs `ORYX_API_ORIGIN` (the backend origin) and `ORYX_GATEWAY_UPSTREAM` (`host:port` of the gateway on the Docker network). The gateway's variables are listed in `docs/notifications.md`; in the image it listens on `0.0.0.0:4100`.
