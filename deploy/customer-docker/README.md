# Manual customer Docker installation

This package runs the hosted React application through the existing `deploy/Dockerfile` **web** target. It requires no Codex, Node or Bun installation on the customer host. Docker runs the pinned Node/Bun build and compatibility probes. The installed Electron shell, notification gateway, backend, ORYX Next, databases and other customer services remain separate.

Production accepts **`origin/entrance-server` only**. `main` and `testing` are never production deployment sources. A commit qualifies only after **Validate customer Docker release** succeeds for that exact SHA on `entrance-server`. Updating the hosted frontend does not install or update Electron clients.

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
| `ORYX_SWAGGER_ORIGIN` | Default `http://127.0.0.1:8080`. Optional compatibility evidence for candidate releases; not required by preflight. An isolated host-network probe reads local Swagger here. Only genuine loopback origins are requested. Never sent to the frontend container. |
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

Preflight checks Docker/Compose, GitHub repository and production branch access, disk space, port 3001 ownership, configuration, the existing `sail` network and `oryx_api` membership, basic API connectivity and installed-shell compatibility. It does **not** request Swagger or require an OpenAPI fingerprint. No service is restarted. The pinned Node probe image may be downloaded on first use.

The API probe joins `sail` and reads `http://oryx_api:5001/api/v1/user/authenticated`. HTTP 200, 401 and 403 establish connectivity; 401/403 are expected without credentials. Connection, timeout and other HTTP failures block deployment. The deadline is 15 seconds. This check cannot establish a user's permissions without signing in.

### Focused compatibility before activation

Each candidate repeats API connectivity and compares available Swagger evidence with the **selected commit's** `contracts/openapi/backend.v1.json`, using the operations declared in `critical-contract.ts`:

- Login and token refresh: payload inputs and session token fields.
- Authenticated user and permissions: identity, disabled flag, department and grant structure.
- Production activity and step status: consumed identifiers/states and accepted start/complete status values.
- Approval/rejection: endpoints, comments, rejection outcome and required inputs.

Confirmed critical endpoint/method removals, incompatible consumed field types, unsupported required inputs/authentication, or removal of expected success responses block activation. Added optional fields, descriptions, unrelated endpoint changes, equivalent path placeholders and audit-header typing do not block deployment. There is **no exact hash allowlist** in the Docker package or deployment metadata. `requirements.json` retains only the deployment protocol and minimum Electron shell version. The separate host-Nginx package keeps its own existing policy.

Swagger is supporting metadata, not a prerequisite for a reachable application API. A 401, redirect, connection failure, 60-second timeout, invalid JSON or ambiguous schema produces a visible `[Compatibility:warning]`, identifying what could not be verified; it does not prove a breaking change and does not block activation. `[Compatibility:breaking]` lists confirmed incompatibilities. Checks are deliberately focused, not a complete API or business-workflow certification. Sign-in and permission/workflow acceptance still need customer validation; the probes never submit production mutations or use user credentials.

The metadata probe is temporary and isolated, uses Linux `--network host`, and requests `${ORYX_SWAGGER_ORIGIN}/swagger/v1/swagger.json` with its natural Host header. It never spoofs localhost access, follows redirects or disables TLS verification. Probes drop capabilities, use read-only mounts/filesystems, publish no ports and are removed after completion. API errors retain `[API:connection]`, `[API:http]` and `[API:timeout]`; metadata warnings retain `[Swagger:connection]`, `[Swagger:http]`, `[Swagger:timeout]`, `[Swagger:configuration]` and `[Swagger:json]` diagnostics.

### Upgrade an existing deployment-tool checkout

Pause polling and update the **tool checkout** to the reviewed production branch; polling itself never changes installed scripts:

```bash
cd /home/entrance/oryx-live-desktop
bash deploy/customer-docker/deploy.sh pause
git fetch origin refs/heads/entrance-server:refs/remotes/origin/entrance-server
git switch entrance-server
git merge --ff-only origin/entrance-server
bash deploy/customer-docker/deploy.sh preflight
bash deploy/customer-docker/deploy.sh resume
```

Keep `ORYX_API_UPSTREAM=http://oryx_api:5001`. Existing `ORYX_SWAGGER_ORIGIN` settings remain valid. A SHA quarantined by an earlier fingerprint failure stays blocked; after preflight and CI succeed, use `deploy --retry` only if deliberately retrying that same SHA. New commits qualify normally.

## 5. Initial deployment

Wait for **Validate customer Docker release** to succeed for the production branch head, then:

```bash
bash deploy/customer-docker/deploy.sh deploy
bash deploy/customer-docker/deploy.sh status
curl --fail http://127.0.0.1:3001/healthz
curl --fail http://127.0.0.1:3001/deployment.json
```

Open `http://<customer-server>:3001` in a browser or point the installed Electron shell at that frontend origin. See the [manual Windows installer download and connection guide](../../docs/customer-windows-installer.md). Do not enter the backend address.

Deployment fetches only `refs/heads/entrance-server`, checks the exact SHA against the successful production GitHub workflow, and builds that detached commit with the frozen lockfile, repository checks and Vite. It tags the image `oryx-live-customer-web:<full-sha>`, archives it with a checksum, and validates an unpublished candidate alongside the running frontend. The candidate runs mandatory API connectivity and focused compatibility checks against its saved baseline before activation. Unavailable Swagger produces a warning; confirmed critical incompatibility blocks replacement.

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

### Candidate JSON permissions and retry reuse

The deployment retains `umask 077`. Only the two non-secret snapshot files, `compatibility.json` and `backend-baseline.json`, are explicitly set to **0644** after copying and before candidate validation. This also repairs older retained snapshots. State/release directories remain private; `customer.env`, `runtime.env`, tokens, notification logs and recovery archives are not made public. Probes explicitly run as the unprivileged Docker `node` user, drop all capabilities and mount code/JSON read-only. Do not apply recursive permission changes to the state directory.

A deliberate `deploy --retry` reuses a completed build for the **same exact SHA** when its archive checksum/gzip integrity, revision label and source-controlled Compose/JSON snapshots verify. Missing pruned images are restored from the archive. Eligible archives from previous script versions are recognized without a new build marker. Current validated runtime settings are written again with mode 0600; CI approval, backend compatibility, candidate health and activation checks all run again. Reuse is recorded as `build-reused` in deployment history. Incomplete, damaged or mismatched artifacts trigger a fresh build. A newer production SHA always needs its own build; an old image is never relabeled as a different commit.

After installing the corrected deployment-tool checkout and confirming CI/preflight, use the ordinary `resume` and `deploy --retry` commands above. Quarantine is cleared only after successful activation; polling never clears it merely because an image is cached.


State includes `current`, `previous`, `pending`, `blocked`, per-SHA `quarantine/`, `paused`, `last-result`, append-only `history.tsv`, per-release `runtime.env`/Compose/requirements/critical-contract-baseline snapshots, protected logs and `images/<sha>.tar.gz` plus SHA-256 sidecars. Runtime settings are frozen per release so rollback does not silently adopt new upstream settings. Interrupted activation is recovered on the next deploy/poll or before rollback; failed recovery retains pending state and artifacts for investigation. For an interrupted first installation with no known-working release, only this project's failed `web` service is stopped/removed.

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

Before customer activation, verify the actual HP server's RAM/disk/CPU, private GitHub access, installed shell floor, backend contract, role grants, gateway delivery and trusted HTTPS configuration. Local Docker tests do not replace that acceptance. Local tests use no customer server, production webhook or backend data. Push the reviewed change to `entrance-server` and wait for its production CI workflow before manually deploying.

### Repository verification

Run the root deployment regressions on Linux (the Bash recovery fixtures depend on GNU utilities), then the existing Docker build and smoke test:

```bash
bun run check
docker build --file deploy/Dockerfile --target web \
  --build-arg RELEASE_SHA="$(git rev-parse HEAD)" \
  --build-arg RELEASE_BRANCH=entrance-server \
  --tag oryx-live-customer-web:verification .
node deploy/customer-docker/smoke.ts oryx-live-customer-web:verification
```

Regression coverage includes harmless contract drift, critical removals/inputs/authentication, unavailable metadata, split probe networking, production-branch isolation, CI gating, failed builds, automatic recovery, quarantine and checksum-protected rollback after image pruning. CI builds Linux AMD64; local Docker verification does not replace native HP/Ubuntu customer acceptance.

Local verification for the simplification (2026-10-27): 108 Linux root/deployment tests, 1,576 web tests, 12 gateway tests and 8 desktop tests passed. The existing Docker production build with frozen dependencies, workspace typechecks, Vite build, Compose/shell validation and Nginx/API/compatibility/WebSocket/asset-retention smoke checks passed. Docker verification used the local Linux ARM64 engine; the production GitHub workflow builds AMD64. No customer server was contacted.
