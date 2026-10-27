# Manual customer Docker installation

This package runs the hosted React application through the existing `deploy/Dockerfile` **web** target. It requires no Codex, Node or Bun installation on the customer host. Docker runs the pinned Node/Bun build and compatibility probes. The installed Electron shell, notification gateway, backend, ORYX Next, databases and other customer services remain separate.

Production accepts **`origin/entrance-server` only**. `main` and `testing` are never production deployment sources. Before distributing these instructions, the maintainer must review/commit this package, push `entrance-server`, and confirm **Validate customer Docker release** succeeds on that branch. The branch was prepared locally from approved testing commit `7952cd85e69853c787a4d71de464f11d79e27e26`; this task does not push it or access the customer server.

## 1. Prerequisites and clone

SSH into Ubuntu as **entrance**. Docker Engine/Compose and the existing backend/network must already be installed. Install only missing command-line prerequisites:

```bash
sudo apt-get update
sudo apt-get install -y git curl python3 util-linux iproute2 gzip ca-certificates
docker info
docker compose version
docker network inspect sail
```

If `docker info` is denied, an administrator must provision the `entrance` account's Docker access and reconnect the SSH session. Docker access grants administrative control of the host; protect this account. Do not start a replacement backend, create a replacement network, or change existing services.

For a private GitHub repository, provision a read-only Git credential for `entrance` and verify GitHub's SSH host key or use a protected HTTPS credential helper. Then:

```bash
cd /home/entrance
git clone --branch entrance-server --single-branch https://github.com/kumateck/oryx-live-desktop.git oryx-live-desktop
cd /home/entrance/oryx-live-desktop
```

The source checkout is also the stable deployment-tool installation. Routine polling fetches production commits and builds detached worktrees; it does not replace the installed deployment scripts. Review/update deployment tooling separately, with polling paused.

## 2. Copy configuration

```bash
install -d -m 0700 /home/entrance/.config/oryx-live
install -d -m 0700 /home/entrance/.local/state/oryx-live
install -m 0600 deploy/customer-docker/customer.env.example /home/entrance/.config/oryx-live/customer.env
```

## 3. Edit customer settings

```bash
nano /home/entrance/.config/oryx-live/customer.env
```

| Setting | Required value / meaning |
| --- | --- |
| `ORYX_DEPLOY_BRANCH` | `entrance-server`. Other branches are refused. |
| `ORYX_PUBLIC_PORT` | `3001`. Port 3000 stays with ORYX Next. |
| `ORYX_API_UPSTREAM` | `http://oryx_api:5001`. Application connectivity and the frontend proxy continue using the internal backend on `sail`. |
| `ORYX_SWAGGER_ORIGIN` | Default `http://127.0.0.1:8080`. Verification-only local backend origin, requested by a temporary Linux host-network probe. Accepts loopback HTTP(S) origins only; never sent to the frontend container. |
| `DISCORD_WEBHOOK_URL` | Customer-owned HTTPS Discord webhook; replace the placeholder. Never put it in Git. |
| `ORYX_DEPLOY_STATE` | `/home/entrance/.local/state/oryx-live`; keep outside the checkout. Stores history, protected logs, release settings and independent recovery archives. |
| `ORYX_MIN_FREE_GB` | Default 10 GiB; minimum free disk checked in both deployment state storage and the Docker image store before building. Builds also require RAM for a 6 GiB Node heap and test workers. |
| `ORYX_SHELL_FLOOR` | Verified minimum version of the customer's installed Electron clients. Confirm the `0.1.0` example; incompatible frontend requirements are refused. |
| `ORYX_GATEWAY_UPSTREAM` | Default `disabled.invalid:4100` disables realtime proxying with HTTP 503. If an existing Oryx gateway is attached to `sail`, use its `host:port`, e.g. `oryx-live-gateway:4100`. No gateway is installed here. |
| `ORYX_BIND_ADDRESS` | Default `0.0.0.0`; use `127.0.0.1` when a host-based TLS edge exclusively fronts the app. |
| `ORYX_PUBLIC_PROTO` | `auto` uses the container's HTTP scheme. Set `https` only behind the customer's trusted HTTPS edge, which must preserve Host and WebSocket upgrades. |
| `GITHUB_TOKEN` | Optional read token for a private repository or GitHub API rate limits; grant only the read access needed for Actions runs. CI approval cannot be disabled. |

The configuration is an administrator-owned shell file. Preserve mode 600. Credentials are not passed to image builds or frontend containers, and webhook URLs/tokens are kept out of command arguments and ordinary logs. Do not enable shell tracing (`bash -x`) with production credentials.

## 4. Preflight

```bash
cd /home/entrance/oryx-live-desktop
bash deploy/customer-docker/deploy.sh preflight
```

Preflight checks prerequisites, Docker access/Compose, free disk, approved repository/branch access, the external `sail` network, `oryx_api` network membership, port 3001 ownership, configuration, existing API connectivity, backend contract and installed-shell compatibility. It makes only unauthenticated read requests. It does not restart or change customer services. The Node probe image may be downloaded on first use.

API and Swagger checks use separate access boundaries:

- The API probe joins `sail` and checks `http://oryx_api:5001/api/v1/user/authenticated`; 200, 401 and 403 establish connectivity. Its timeout remains 15 seconds.
- A second isolated, temporary probe uses `--network host` on the Ubuntu server and requests `${ORYX_SWAGGER_ORIGIN}/swagger/v1/swagger.json`. The default origin is the actual loopback endpoint `http://127.0.0.1:8080`. Its natural HTTP Host comes from that URL; no localhost Host header is forged for requests to the container alias. Swagger must return valid OpenAPI JSON with an approved fingerprint. The 60-second deadline covers both connection/header wait and the complete response body. Redirects are refused rather than followed.

Both probes use read-only filesystems and mounts, drop capabilities, have no published ports, and are removed when finished. Linux host networking is required for the local Swagger probe; `127.0.0.1` then refers to the customer server. This setting is not a frontend API origin and does not change Nginx routing, authentication, backend middleware or TLS verification.

The backend's published OpenAPI must match the reviewed `deploy/customer-server/release.json` policy. A mismatch is a release blocker; do not simply approve an unfamiliar fingerprint. Review the actual backend version and business compatibility first. No backend/API/database changes are made by this package.

### Existing customer configuration and probe diagnostics

Add this verification setting to `/home/entrance/.config/oryx-live/customer.env` (the same default also applies when an older file omits it):

```bash
ORYX_API_UPSTREAM=http://oryx_api:5001
ORYX_SWAGGER_ORIGIN=http://127.0.0.1:8080
```

Then rerun `bash deploy/customer-docker/deploy.sh preflight` after reviewing/updating the deployment checkout. Do not change the frontend API upstream to localhost or add a Host-header override.

Probe errors distinguish `[API:connection]` / `[API:http]` / `[API:timeout]` from `[Swagger:connection]`, `[Swagger:http]`, `[Swagger:timeout]`, `[Swagger:json]` and `[Swagger:fingerprint]`. Connection failures include a network error code when available; HTTP failures include the status; timeout failures identify the configured endpoint and deadline. JSON failures identify invalid/missing OpenAPI evidence. Fingerprint failures report the received digest and require compatibility review, not automatic approval. Preflight and candidate logs also identify which probe failed.

Verification for this preflight repair: **95 Linux root/deployment tests passed**, including split-network command checks, failure propagation, a real HTTP Host observation, Swagger timeout/body-read diagnostics and fingerprint rejection. Root TypeScript and Bash syntax checks passed. A temporary Docker host-network probe also verified an isolated loopback-only Swagger fixture; no customer server was contacted.

## 5. Initial deployment

Wait for **Validate customer Docker release** to succeed for the production branch head, then:

```bash
bash deploy/customer-docker/deploy.sh deploy
bash deploy/customer-docker/deploy.sh status
curl --fail http://127.0.0.1:3001/healthz
curl --fail http://127.0.0.1:3001/deployment.json
```

Open `http://<customer-server>:3001` in a browser or point the installed Electron shell at that frontend origin. Do not enter the backend address.

Deployment fetches only `refs/heads/entrance-server`, checks the exact SHA against the successful production GitHub workflow, and builds that detached commit with the frozen lockfile, repository checks and Vite. It tags the image `oryx-live-customer-web:<full-sha>`, archives it with a checksum, and validates an unpublished candidate alongside the running frontend. The candidate runs the same split API/local-Swagger checks using the selected release's saved compatibility policy before activation. A Swagger 401, invalid JSON, timeout or fingerprint mismatch still blocks replacement of the working frontend.

Only the `web` service in Compose project **oryx-live** is replaced. The running commit, container health, public deployment marker and `/api` proxy are checked after activation. Success/failure and SHA are sent to Discord. Notification failures are recorded separately and do not undo a healthy release. A failed build leaves the working frontend untouched; a failed replacement attempts to restore the known-working release.

Single-container replacement has a brief interruption during Compose recreation. Existing gateway connections reconnect; notification polling remains available without a gateway. The deployment is not a zero-downtime load-balanced rollout.

## 6. Enable Cron every two minutes

After the manual deployment is accepted:

```bash
mkdir -p /home/entrance/.local/state/oryx-live/logs
crontab -e
```

Add this **once** to `entrance`'s crontab:

```cron
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin
*/2 * * * * /bin/bash /home/entrance/oryx-live-desktop/deploy/customer-docker/deploy.sh poll >> /home/entrance/.local/state/oryx-live/logs/cron.log 2>&1
```

`poll` deploys only a new, CI-approved production SHA. It waits if CI has not completed, skips the already deployed SHA and skips quarantined failures. Changes pushed to `main` or `testing` do not qualify. A kernel filesystem lock prevents overlapping runs and releases automatically if a process dies. Long builds may cause later polls to report the lock is held; they do not start another build.

## Operations and recovery

```bash
cd /home/entrance/oryx-live-desktop
bash deploy/customer-docker/deploy.sh status
bash deploy/customer-docker/deploy.sh pause
bash deploy/customer-docker/deploy.sh rollback
bash deploy/customer-docker/deploy.sh resume
```

Manual rollback restores the previous successful release, blocks the rolled-away SHA and pauses polling. Resume explicitly after investigating; the blocked SHA remains blocked. After fixing an environmental failure, an administrator can deliberately retry the branch head:

```bash
bash deploy/customer-docker/deploy.sh resume
bash deploy/customer-docker/deploy.sh deploy --retry
```

Automatic polling never blindly retries a failed SHA. A newer production commit can qualify after CI approval. Unexpected production branch rewinds are refused.

State includes `current`, `previous`, `pending`, `blocked`, per-SHA `quarantine/`, `paused`, `last-result`, append-only `history.tsv`, per-release `runtime.env`/Compose/compatibility snapshots, protected logs and `images/<sha>.tar.gz` plus SHA-256 sidecars. Runtime settings are frozen per release so rollback does not silently adopt new upstream settings. Interrupted activation is recovered on the next deploy/poll or before rollback; failed recovery retains pending state and artifacts for investigation. For an interrupted first installation with no known-working release, only this project's failed `web` service is stopped/removed.

The existing backend job may run **`docker image prune -a -f`**. Recovery therefore does **not** depend on unused Docker images surviving: missing images are reloaded from verified, independently stored archives before activation. The package never invokes global pruning, `docker compose down`, or changes the backend job. Protect and back up the deployment state directory. Deleting its archives removes that recovery guarantee.

Inspect only this frontend's container and logs:

```bash
docker ps --filter label=com.docker.compose.project=oryx-live
docker logs --tail=100 oryx-live-web-1
tail -n 30 /home/entrance/.local/state/oryx-live/history.tsv
tail -n 100 /home/entrance/.local/state/oryx-live/logs/cron.log
```

Discord error details are in the protected `logs/discord-last-error.log`; build logs are keyed by SHA. Avoid sharing protected logs without review. Archive/log cleanup is manual: retain at least current/previous release snapshots and their checksummed image archives. There is no automatic deletion or global Docker cleanup.

## Persistent assets, HTTP and HTTPS

The named **oryx-live_assets** volume retains old/new hashed JavaScript and pinned document-viewer revisions together. Startup validates viewer WASM, copies missing files atomically and refuses an immutable filename with different bytes. Retention is additive; never remove the volume during deployment or rollback. Monitor its disk use and reclaim assets only during reviewed maintenance that protects active sessions and rollback releases.

Nginx serves SPA fallback routes, returns 404 for missing immutable assets/viewers, and keeps HTML/deployment metadata uncached. The Electron application's existing identification meta tag remains intact. `/api/v1/...` is preserved unchanged through the proxy, with authorization and public Host/forwarding headers. `/realtime/socket.io` supports WebSocket upgrades when an existing gateway is configured.

Intranet HTTP is supported. For HTTPS, use the customer's trusted TLS reverse proxy in front of port 3001, preserve Host/upgrade headers, set `ORYX_PUBLIC_PROTO=https`, and restrict direct access to the internal frontend port appropriately. Certificates must be trusted by browsers/Electron and cover the chosen hostname/IP. Upstream HTTPS retains certificate verification. Do not weaken TLS, Electron sandboxing or context isolation.

The builder pins Bun **1.4.4**, Node **24.22.1**, and stable Nginx Alpine with image digests. Electron is not packaged in the container; only compiled web assets and narrow Nginx startup scripts reach the runtime. Existing `deploy/customer-server` host-Nginx implementation and its installer/timer are unchanged. Coordinate a migration so two release managers do not own the same frontend, but do not alter unrelated running services.

## Verification and release scope

Automated tests cover production-branch isolation, build-failure preservation, failed-SHA suppression, interrupted activation recovery, independent archive reload after image pruning, corruption refusal and existing viewer retention. The Docker smoke test uses uniquely named local fixtures and an isolated network/volume, testing Nginx syntax, health/version, SPA fallback, API/auth forwarding, optional gateway/WebSocket, old chunks and runtime contents. It never uses customer credentials or the customer `sail` network.

Before customer activation, verify the actual HP server's RAM/disk/CPU, private GitHub access, installed shell floor, backend contract, role grants, gateway delivery and trusted HTTPS configuration. Local Docker tests do not replace that acceptance. No customer server is accessed, no production Discord message is sent, and no code is pushed or merged by this task.

### Local verification for this implementation

- Reused `deploy/Dockerfile --target web` image built successfully with Bun 1.4.4 and the frozen lockfile; `bun run check` and the production Vite build passed.
- Latest Linux root suite: **85 passed**, including seven customer Docker regressions. Web: **1,576 passed**; gateway: **12 passed**; desktop: **8 passed**. Workspace TypeScript and Compose/shell syntax checks passed.
- Actual Nginx image smoke checks passed for SPA routing, API path/auth forwarding, health/version, optional realtime/WebSocket, retained assets and runtime contents.
- A real Docker image archive was saved, its disposable image tag removed, and the archive successfully loaded again with the expected revision label. Corrupt archives are refused by the Linux regression suite.
- `deploy/customer-server` has no changes. No customer server, production webhook, backend data, push or merge was used. Verification ran on the local Linux ARM64 Docker engine; the workflow targets Linux AMD64, while native HP/Ubuntu and customer acceptance remain outstanding.
