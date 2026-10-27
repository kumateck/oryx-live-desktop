#!/usr/bin/env bash
# Manual/cron entrypoint. No Codex, Node or Bun installation is required on the host.
set -Eeuo pipefail
umask 077
PACKAGE=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
REPO=$(cd "$PACKAGE/../.." && pwd)
CONFIG=${ORYX_CUSTOMER_CONFIG:-$HOME/.config/oryx-live/customer.env}
[[ -f "$CONFIG" ]] || { echo "Copy customer.env.example to $CONFIG and edit it first." >&2; exit 1; }
MODE=$(stat -c '%a' "$CONFIG" 2>/dev/null || stat -f '%Lp' "$CONFIG")
[[ "$MODE" = 600 || "$MODE" = 400 ]] || { echo 'Customer configuration must have mode 600 or 400.' >&2; exit 1; }
# This is an administrator-owned shell configuration, never a file fetched from Git.
source "$CONFIG"
[[ ${ORYX_DEPLOY_BRANCH:-entrance-server} = entrance-server ]] || { echo 'Customer deployments accept origin/entrance-server only.' >&2; exit 1; }
ORYX_DEPLOY_BRANCH=entrance-server
[[ ${ORYX_PUBLIC_PORT:-3001} = 3001 ]] || { echo 'The customer frontend port must be 3001.' >&2; exit 1; }
ORYX_PUBLIC_PORT=3001
ORYX_API_UPSTREAM=${ORYX_API_UPSTREAM:-http://oryx_api:5001}
ORYX_SWAGGER_ORIGIN=${ORYX_SWAGGER_ORIGIN:-http://127.0.0.1:8080}
ORYX_GATEWAY_UPSTREAM=${ORYX_GATEWAY_UPSTREAM:-disabled.invalid:4100}
ORYX_PUBLIC_PROTO=${ORYX_PUBLIC_PROTO:-auto}
ORYX_BIND_ADDRESS=${ORYX_BIND_ADDRESS:-0.0.0.0}
ORYX_SHELL_FLOOR=${ORYX_SHELL_FLOOR:-}
STATE=${ORYX_DEPLOY_STATE:-$HOME/.local/state/oryx-live}
[[ "$STATE" = /* && "$STATE" != / && "$STATE" != *$'\n'* ]] || { echo 'State must be an absolute non-root path.' >&2; exit 1; }
[[ "$ORYX_API_UPSTREAM" =~ ^https?://[A-Za-z0-9_.-]+(:[0-9]{1,5})?$ ]] || { echo 'Invalid API origin.' >&2; exit 1; }
[[ "$ORYX_SWAGGER_ORIGIN" =~ ^https?://(127\.0\.0\.1|localhost|\[::1\])(:[0-9]{1,5})?$ ]] || { echo 'Invalid local Swagger origin; use a loopback HTTP(S) origin without a path.' >&2; exit 1; }
[[ "$ORYX_GATEWAY_UPSTREAM" =~ ^[A-Za-z0-9_.-]+:[0-9]{1,5}$ ]] || { echo 'Invalid gateway upstream.' >&2; exit 1; }
[[ "$ORYX_PUBLIC_PROTO" = auto || "$ORYX_PUBLIC_PROTO" = http || "$ORYX_PUBLIC_PROTO" = https ]] || exit 1
[[ ( "$ORYX_BIND_ADDRESS" = 0.0.0.0 || "$ORYX_BIND_ADDRESS" = 127.0.0.1 ) && "$ORYX_SHELL_FLOOR" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo 'Invalid bind address or installed-shell baseline.' >&2; exit 1; }
[[ ${DISCORD_WEBHOOK_URL:-} =~ ^https://(discord.com|discordapp.com)/api/webhooks/[A-Za-z0-9_/-]+$ ]] || { echo 'Set a Discord webhook URL in the protected customer configuration.' >&2; exit 1; }
[[ ${GITHUB_TOKEN:-} != *$'\n'* && ${GITHUB_TOKEN:-} != *'"'* && ${GITHUB_TOKEN:-} != *'\'* ]] || exit 1
mkdir -p "$STATE"/{releases,images,logs,tmp,quarantine}
source "$PACKAGE/lib.sh"
OPERATION=${1:-status}
case "$OPERATION" in preflight|deploy|poll|status|rollback|pause|resume) ;; *) echo 'Use preflight, deploy [--retry], poll, status, rollback, pause or resume.' >&2; exit 1;; esac
# Status is read-only and remains available while a deployment holds the lock.
if [[ "$OPERATION" = status ]]; then status; exit; fi
command -v flock >/dev/null || { echo 'Install util-linux (flock).' >&2; exit 1; }
exec 9>"$STATE/deploy.lock"
flock -n 9 || { echo 'Another customer deployment operation holds the lock.' >&2; exit 75; }
STAGE=initializing
TARGET=
WORKTREE=
CANDIDATE=
trap failure ERR
trap cleanup EXIT
case "$OPERATION" in
  preflight) preflight; echo 'Customer Docker preflight passed.';;
  pause) touch "$STATE/paused"; history paused ''; echo 'Automatic customer deployments paused.';;
  resume) rm -f "$STATE/paused"; history resumed ''; echo 'Polling resumed; blocked release SHAs remain blocked.';;
  rollback) recover_pending; rollback;;
  deploy) [[ ${2:-} = '' || ${2:-} = --retry ]] || exit 1; deploy "${2:-}";;
  poll) [[ ! -f "$STATE/paused" ]] || { echo 'Polling paused.'; exit; }; deploy '';;
esac
