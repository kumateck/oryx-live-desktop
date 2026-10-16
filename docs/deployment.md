# Deployment

## Testing site

The `testing` branch deploys a site for people to try the app, on the same server as the Oryx Next demo and against the same backend.

| | |
| --- | --- |
| App in a browser | http://164.90.142.68:3010 |
| Windows installer | http://164.90.142.68:3010/downloads/OryxLiveDesktop-Setup.exe |
| Backend | http://164.90.142.68:8086 (the Oryx Next demo backend; same accounts and data) |

Push to `testing` (or run **Deploy testing site** from the Actions tab) and `.github/workflows/deploy-testing.yml`:

1. runs `bun run check` (on CI, web tests get a 30-second timeout and a failing one is retried twice, since the runners are slower);
2. builds two images from `deploy/Dockerfile` and pushes them to GitHub's registry: `ghcr.io/kumateck/oryx-live-web` (nginx serving `apps/web/dist`) and `ghcr.io/kumateck/oryx-live-gateway` (`apps/gateway`). The workflow's own token pushes them, and the server pulls with it during the deploy, then signs out;
3. over SSH, replaces the `oryx-live-gateway` and `oryx-live-web` containers on the `sail` network, publishing the web container on port 3010;
4. builds the Windows installer on a Windows runner (`electron-forge make`, Squirrel) and copies it to `~/oryx-live/downloads` on the server, which the web container serves at `/downloads/`.

The web container passes `/api` to the backend and `/realtime` (with WebSocket upgrade) to the gateway, so the browser and the desktop shell reach everything on one origin. `index.html` is always revalidated and hashed assets are cached for a year. A tab left open across a deploy may fail to load a page it had not opened yet; reloading fixes it.

### Repository secrets

The workflow uses the server secrets of `oryx-next`'s deploy workflows, under the repository's **Settings → Secrets and variables → Actions**: `SSH_HOST`, `SSH_PORT`, `SSH_USERNAME`, `SSH_PRIVATE_KEY`, `RABBITMQ_HOST`, `RABBITMQ_PASS`. Images go to GitHub's registry, so no Docker Hub account is used.

### For testers

- **Browser:** open the address above in Chrome or Edge and sign in with an Oryx account.
- **Windows app:** download and run the installer. It is not code-signed yet, so Windows SmartScreen warns on first run (**More info → Run anyway**). On the connection screen, enter `http://164.90.142.68:3010`. Web releases reach the installed app without reinstalling; a new installer is only needed when the desktop shell changes.

### Known limits

- Plain HTTP: passwords and tokens cross the network unencrypted, as they already do for the Oryx Next demo. Put the site behind HTTPS (a domain and a certificate) before real data or customers use it.
- The installer is unsigned and has no automatic shell updates yet (`PLAN.md`, site deployment and shell updates).
- Build the desktop shell with Node 22 or 24. On Node 26, Electron Packager stops silently while extracting Electron and produces nothing.

## Building the images yourself

```bash
docker build -f deploy/Dockerfile --target web -t oryx-live-web .
docker build -f deploy/Dockerfile --target gateway -t oryx-live-gateway .
```

The web image needs `ORYX_API_ORIGIN` (the backend origin) and `ORYX_GATEWAY_UPSTREAM` (`host:port` of the gateway on the Docker network). The gateway's variables are listed in `docs/notifications.md`; in the image it listens on `0.0.0.0:4100`.
