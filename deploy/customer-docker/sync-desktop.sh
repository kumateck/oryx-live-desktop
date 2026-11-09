#!/usr/bin/env bash
# Mirror signed Windows updates for LAN clients; independent of frontend deployment.
set -Eeuo pipefail
umask 077
REPO=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
STATE=${ORYX_DEPLOY_STATE:-$HOME/.local/state/oryx-live}
KEY=${ORYX_DESKTOP_UPDATE_KEY_FILE:-$HOME/.config/oryx-live/desktop-update-public.pem}
NODE_IMAGE=node:24.22.1-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205
[[ "$STATE" = /* && "$STATE" != / && "$KEY" = /* && -f "$KEY" && ! -L "$KEY" ]] || { echo 'Use absolute state and trusted public-key paths.' >&2; exit 1; }
[[ ! -L "$STATE/downloads" ]] || { echo 'Downloads directory must not be a symlink.' >&2; exit 1; }
mkdir -p "$STATE/downloads" "$STATE/logs"
exec 9>"$STATE/desktop-sync.lock"
flock -n 9 || exit 0
# Only the public key and downloads are mounted; no customer configuration, session or signing secret.
docker run --rm --init --user "$(id -u):$(id -g)" --read-only --cap-drop ALL \
  --security-opt no-new-privileges:true --pids-limit 64 --memory 256m --cpus 1 \
  --mount "type=bind,src=$REPO/package.json,dst=/tool/package.json,readonly" \
  --mount "type=bind,src=$REPO/deploy/customer-docker/sync-desktop.ts,dst=/tool/deploy/customer-docker/sync-desktop.ts,readonly" \
  --mount "type=bind,src=$REPO/apps/desktop/src/updates,dst=/tool/apps/desktop/src/updates,readonly" \
  --mount "type=bind,src=$REPO/apps/desktop/src/site-config.ts,dst=/tool/apps/desktop/src/site-config.ts,readonly" \
  --mount "type=bind,src=$REPO/shared/desktop-updates.ts,dst=/tool/shared/desktop-updates.ts,readonly" \
  --mount "type=bind,src=$KEY,dst=/trusted-public.pem,readonly" \
  --mount "type=bind,src=$STATE/downloads,dst=/downloads" \
  "$NODE_IMAGE" node /tool/deploy/customer-docker/sync-desktop.ts /downloads /trusted-public.pem
