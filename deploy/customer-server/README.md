# Entrance customer-server deployment

This package deploys the customer-hosted **web frontend** from `entrance-server`. The existing backend stays on the customer server. Its address is configured once in `/etc/oryx-deploy/customer.env`; neither fetched commits nor built releases replace that file.

The customer service makes outbound SSH/HTTPS connections only. Every two minutes it fetches the configured branch, builds the exact commit in a temporary detached worktree, runs `bun install --frozen-lockfile`, `bun run check`, and `bun run build:web`, verifies the built assets and compatibility, and atomically changes `/srv/oryx/current`. HTTP verification checks the deployed SHA, actual index contents, application/viewer assets, and existing `/api` proxy. Failed activation restores the previous pointer. Existing browser sessions keep their previous chunks and are never forcibly refreshed.

Reviewable systemd templates are `oryx-deploy.service.in` and `oryx-deploy.timer`; `nginx.example.conf` shows the generated HTTP configuration. The installer renders the actual customer addresses from the permanent `.env` instead of copying the example's addresses.

## Files and authority

| Location | Purpose |
| --- | --- |
| `/etc/oryx-deploy/customer.env` | Root-owned permanent customer settings; `root:oryx-deploy`, mode 0640 |
| `/opt/oryx/deploy-agent` | Root-owned installed agent; updated only by an administrator |
| `/opt/oryx/source` | Source clone owned by the deployment user; never serves traffic |
| `/var/lib/oryx-deploy` | Deployment user home, state, worktrees, protected build logs, history |
| `/srv/oryx/releases/<full SHA>` | Published releases with integrity manifests |
| `/srv/oryx/shared/{assets,viewers}` | Retained immutable chunks and pinned document engines |
| `/srv/oryx/current` | Atomic symlink used by Nginx |
| `/srv/oryx/.deploy.lock` | Kernel lock shared by all commands targeting this release root |

Deployments run as `oryx-deploy`, not root. The installer requires root only to create that account, set directory permissions, and install systemd/Nginx files. `flock` serializes polling, rollback, and operator commands; overlapping polls exit successfully without starting another deployment. Mutating operator commands wait up to one hour for the current deployment; status reads remain available immediately. Do not call the CLI's internal `--locked` worker flag directly.

The service never deploys a backend, restarts a gateway, applies migrations, or reads/writes customer database contents. Backend and installed Electron releases use their own reviewed release processes.

## Prepare the release branch

Create `entrance-server` from the approved frontend commit and enable branch protection: required review, required **Validate customer server release / validate** CI, and no force pushes. The workflow also runs for pull requests targeting this branch. This package does not create branches or change repository access automatically. A read-only deploy key can fetch code; it cannot push it. Approved branch code and dependency lifecycle scripts execute as the deployment user, so branch review remains a trust boundary.

`deploy/customer-server/release.json` declares the supported deployment protocol, minimum shell version, and reviewed backend OpenAPI fingerprints. CI checks that the checked-in API contract is approved. Changing API contracts requires reviewing this manifest too.

## Install on Ubuntu/Linux with systemd

Use a dedicated frontend hostname or unused port for first installation. Validate its first release before moving existing users to it; do not replace an already-serving vhost during an unvalidated first installation. The installer does not disable the distribution's default Nginx site or another application's site.

1. Install Git, Nginx, util-linux (`flock`), trusted CA certificates, Node.js **24** (minimum 22.22), and Bun **1.3.14**. Bun is the only package manager. Provision the deployment user through the installer before installing Bun in that user's home. The installer never downloads or executes a remote installation script as root.
2. Copy the reviewed package to the server and prepare the customer settings:

   ```sh
   sudo install -d -m 0750 /etc/oryx-deploy
   sudo install -m 0640 deploy/customer-server/customer.env.example /etc/oryx-deploy/customer.env
   sudoedit /etc/oryx-deploy/customer.env
   ```

   Set `ORYX_API_ORIGIN` to the **already running local backend**, such as `http://127.0.0.1:8086`. Set `ORYX_SITE_URL` to the frontend origin staff will use. Set `ORYX_GATEWAY_UPSTREAM` only if an existing notification gateway is available (include `http://` or `https://`). No API/backend setting belongs in a release or Git-tracked `.env`.

   `ORYX_SITE_URL=https://...` additionally requires `ORYX_TLS_CERT_FILE` and `ORYX_TLS_KEY_FILE` pointing to an existing trusted certificate/key. The installer emits TLS verification for HTTPS upstreams. For private CAs, install the CA in the server trust store and configure Node's `NODE_EXTRA_CA_CERTS` using an administrator-owned systemd drop-in when needed. Never use `NODE_TLS_REJECT_UNAUTHORIZED=0` or disable Nginx certificate verification.

3. Install the stable agent, account, units and Nginx configuration:

   ```sh
   sudo node deploy/customer-server/install.ts --env /etc/oryx-deploy/customer.env
   ```

   This stops any existing deployment timer/service during an upgrade, checks Nginx syntax, and reloads systemd's unit definitions. It does **not** start deployment or reload Nginx. A different existing generated Nginx file requires a reviewed `--replace-nginx` invocation; invalid Nginx syntax restores its prior file. Verify that the existing backend's vhost/port is unaffected.

4. Install Bun 1.3.14 for `oryx-deploy` from the official Bun distribution. Its expected path is `/var/lib/oryx-deploy/.bun/bin/bun` (overridable in the customer file). Confirm:

   ```sh
   sudo -H -u oryx-deploy /var/lib/oryx-deploy/.bun/bin/bun --version
   node --version
   ```

5. As the deployment user, create an SSH key in `/var/lib/oryx-deploy/.ssh`, restrict the directory to 0700 and private key to 0600, and add the public key to **kumateck/oryx-live-desktop → Deploy keys** with write access disabled. Verify GitHub's published SSH host fingerprint before accepting it into this user's `known_hosts`. The agent uses `BatchMode=yes` and `StrictHostKeyChecking=yes` and fails if trust is not provisioned.

   Clone as this user into the empty source directory created by the installer:

   ```sh
   sudo -H -u oryx-deploy git clone --no-checkout git@github.com:kumateck/oryx-live-desktop.git /opt/oryx/source
   ```

6. Review compatibility with the customer's existing backend and installed clients:

   ```sh
   sudo -H -u oryx-deploy node /opt/oryx/deploy-agent/cli.ts backend-fingerprint
   ```

   The backend must expose its existing `/swagger/v1/swagger.json` to this local agent. The SHA-256 is computed from recursively key-sorted JSON. The release's approved fingerprints must include that exact contract. If it differs, have the release maintainer review the API differences and approve the compatible hash in the release branch; do not suppress this check on the customer machine. Additive API changes still require an explicit reviewed fingerprint. No bearer token or database connection is used.

   Set `ORYX_INSTALLED_SHELL_MIN_VERSION` to the minimum version actually installed across this customer's machines. This is an operator-confirmed baseline, not per-device telemetry. The agent refuses releases requiring a newer shell. Ensure old active clients and gateway functionality are compatible with the approved release too.

7. Activate the reviewed Nginx configuration and run the first poll:

   ```sh
   sudo nginx -t
   sudo systemctl reload nginx
   sudo systemctl start oryx-deploy.service
   sudo journalctl -u oryx-deploy.service -n 100 --no-pager
   sudo -H -u oryx-deploy node /opt/oryx/deploy-agent/cli.ts status
   ```

   Confirm the browser's `/deployment.json` reports the expected commit, API calls reach the existing backend, deep links reload correctly, and all document viewers open. Then enable polling:

   ```sh
   sudo systemctl enable --now oryx-deploy.timer
   ```

The installer targets the Node executable used to run it. Use a system-wide Node installation accessible to `oryx-deploy`, not root's private version-manager directory. The service permits writes only to the source clone, release root, and deployment state. It cannot alter `/etc`, the backend installation, or the installed agent.

## Operation and recovery

Use the installed CLI as `oryx-deploy`; every command reads the customer `.env` again:

```sh
sudo -H -u oryx-deploy node /opt/oryx/deploy-agent/cli.ts status
sudo -H -u oryx-deploy node /opt/oryx/deploy-agent/cli.ts pause
sudo -H -u oryx-deploy node /opt/oryx/deploy-agent/cli.ts resume
sudo -H -u oryx-deploy node /opt/oryx/deploy-agent/cli.ts retry FULL_40_CHARACTER_SHA
sudo -H -u oryx-deploy node /opt/oryx/deploy-agent/cli.ts rollback
sudo -H -u oryx-deploy node /opt/oryx/deploy-agent/cli.ts rollback FULL_40_CHARACTER_SHA
sudo -H -u oryx-deploy node /opt/oryx/deploy-agent/cli.ts prune
```

Pause waits for any current deployment to finish under the same lock and stops future polls from deploying. Rollback verifies a known intact release, rechecks compatibility, switches and health-checks it, then **pauses** automation so the next timer cannot immediately reapply the reverted commit. Resume is explicit. Retry clears the failure quarantine for the configured branch/SHA; it does not implicitly resume a paused installation.

Repeated failures back off (one minute up to one hour); after three failed attempts at the same branch/SHA, the commit is quarantined until `retry` or a new commit. GitHub/network failures back off but keep retrying rather than permanently quarantining an unreachable server. Local JSON history and journald record deployment, recovery, failure, quarantine, and rollback events. Build logs are under `state/logs/<SHA>.log`, with protected permissions.

For external failure notifications, set `ORYX_ALERT_HOOK` to a root-owned, non-group/other-writable executable. The hook receives a small JSON deployment event on stdin (branch, SHA, time, kind and a generic failure message). Configure its recipient and credentials locally. Hook failures are logged without hiding the deployment failure. No notification is sent to an external service unless the operator configures this hook. Journald/history remain available without one.

Interrupted building worktrees and staging directories are removed on the next poll. An interruption during activation/verification restores the recorded previous release before another candidate is considered. A corrupt state file or a `current` symlink changed outside the agent stops deployment for an operator check. Do not delete state to bypass this check or manually rewrite `current`; use the verified rollback command.

Retention keeps active/previous releases, and other releases/assets for at least 30 days. Unreferenced old assets and old build logs can then be pruned; audit history remains. Long-open clients beyond this retention window may need a safe refresh. Monitor free disk space, especially if a client population needs a longer retention period.

To change the existing backend address deliberately, pause deployment, edit only the customer `.env`, rerun the installer with reviewed `--replace-nginx`, test/reload Nginx, and resume/re-enable the timer. The backend itself is never reinstalled by this process. For agent upgrades use a reviewed package, rerun installation, and explicitly re-enable its timer.

## Uninstall automation

```sh
sudo node /opt/oryx/deploy-agent/uninstall.ts
```

This disables/stops the timer and service and removes their units. Nginx continues serving the last release. Configuration, deploy key, source, releases, state/history, and the backend/database are retained. An administrator may archive/remove those deployment files separately once they are no longer needed; revoke the read-only GitHub deploy key when retiring the installation.

## Development verification and limits

`tests/customer-deployment*.test.ts` exercises real temporary release directories, mocked Git/build failures, a real HTTP health origin, rollback, interruption recovery, integrity checking, compatibility and permanent configuration preservation. On Linux the lock test launches competing `flock` processes and verifies release after process death. The `entrance-server` CI workflow additionally runs the full repository checks, builds the SPA, checks the compatibility manifest, and validates generated Nginx syntax.

No installer or timer is run on a live customer server during development. Linux systemd hardening, customer SSH trust, private-CA configuration, actual backend compatibility, disk retention, host reboot during activation, and signed Electron update delivery still require customer-environment acceptance. Successful test fixtures are not proof of a live customer rollout.
