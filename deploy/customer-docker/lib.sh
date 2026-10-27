#!/usr/bin/env bash
# Sourced by deploy.sh. All writes are confined to the customer-owned state directory.
NODE_IMAGE=node:24.22.1-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205
valid_sha() { [[ "$1" =~ ^[a-f0-9]{40}$ ]]; }
read_value() { [[ ! -f "$STATE/$1" ]] || cat "$STATE/$1"; }
write_value() { printf '%s\n' "$2" > "$STATE/$1.tmp"; mv "$STATE/$1.tmp" "$STATE/$1"; sync -f "$STATE/$1"; }
history() { printf '%s\t%s\t%s\t%s\n' "$(date -u +%FT%TZ)" "$1" "${2:-}" "${STAGE:-manual}" >> "$STATE/history.tsv"; write_value last-result "$1 ${2:-}"; }
notify() {
  local text=$1 escaped
  escaped=${text//\\/\\\\}; escaped=${escaped//\"/\\\"}; escaped=${escaped//$'\n'/\\n}
  # Webhook credentials stay out of argv and logs; only the config descriptor is passed.
  if ! curl --fail --silent --show-error --connect-timeout 5 --max-time 15 --retry 1 \
    --config <(printf 'url = "%s"\n' "$DISCORD_WEBHOOK_URL") -H 'Content-Type: application/json' \
    --data-binary "{\"content\":\"$escaped\"}" >/dev/null 2>"$STATE/logs/discord-last-error.log"; then
    echo 'Discord notification failed; inspect the protected notification error log.' >&2
  fi
}
block_release() { valid_sha "$1" || return 1; mkdir -p "$STATE/quarantine"; touch "$STATE/quarantine/$1"; write_value blocked "$1"; }
image() { printf 'oryx-live-customer-web:%s' "$1"; }
cleanup() {
  [[ -z ${CANDIDATE:-} ]] || docker rm -f "$CANDIDATE" >/dev/null 2>&1 || true
  [[ -z ${WORKTREE:-} ]] || git -C "$REPO" worktree remove --force "$WORKTREE" >/dev/null 2>&1 || true
}
compose() {
  local sha=$1; shift
  # Runtime settings are frozen per release; current shell exports must not alter rollback.
  env -u ORYX_RELEASE_SHA -u ORYX_PUBLIC_PORT -u ORYX_API_UPSTREAM -u ORYX_GATEWAY_UPSTREAM -u ORYX_PUBLIC_PROTO -u ORYX_BIND_ADDRESS \
    docker compose --project-name oryx-live --env-file "$STATE/releases/$sha/runtime.env" --file "$STATE/releases/$sha/compose.yml" "$@"
}
restore_image() {
  local sha=$1
  valid_sha "$sha" || return 1
  if ! docker image inspect "$(image "$sha")" >/dev/null 2>&1; then
    (cd "$STATE/images" && sha256sum --check "$sha.sha256") || return 1
    gzip -dc "$STATE/images/$sha.tar.gz" | docker image load >/dev/null || return 1
  fi
  [[ $(docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$(image "$sha")") = "$sha" ]]
}
verify_container() {
  local container=$1 sha=$2 marker
  [[ $(docker inspect --format '{{.State.Health.Status}}' "$container") = healthy ]] || return 1
  marker=$(docker exec "$container" wget -qO- http://127.0.0.1/deployment.json) || return 1
  printf '%s' "$marker" | python3 -c 'import json,sys; v=json.load(sys.stdin); assert v["commit"]==sys.argv[1] and v["branch"]=="entrance-server"' "$sha" || return 1
  docker exec "$container" wget -qO- http://127.0.0.1/index.html | grep -q 'name="application-name" content="Oryx Live"' || return 1
}
activate() {
  local sha=$1 container
  restore_image "$sha" || return 1
  compose "$sha" up --detach --no-build --pull never --wait --wait-timeout 90 web || return 1
  container=$(compose "$sha" ps --quiet web) || return 1
  [[ -n "$container" && "$container" != *$'\n'* ]] || return 1
  verify_container "$container" "$sha" || return 1
  curl --fail --silent --show-error --max-time 15 "http://127.0.0.1:3001/deployment.json" |
    python3 -c 'import json,sys; assert json.load(sys.stdin)["commit"]==sys.argv[1]' "$sha" || return 1
  local api_status
  api_status=$(curl --silent --show-error --max-time 15 --output /dev/null --write-out '%{http_code}' http://127.0.0.1:3001/api/v1/user/authenticated) || return 1
  [[ "$api_status" = 200 || "$api_status" = 401 || "$api_status" = 403 ]]
}
recover_pending() {
  local pending old
  pending=$(read_value pending); [[ -n "$pending" ]] || return 0
  old=$(read_value current)
  if [[ -n "$old" ]]; then
    activate "$old" || return 1
  else
    # Only the failed frontend service is stopped; never use compose down.
    compose "$pending" stop web || return 1
    compose "$pending" rm --force web || return 1
  fi
  block_release "$pending"
  rm -f "$STATE/pending"
  history recovered "$old"
}
failure() {
  local code=$?
  trap - ERR
  set +e
  echo "Customer deployment failed during $STAGE. The current/previous recovery artifacts are retained." >&2
  [[ -z ${TARGET:-} ]] || block_release "$TARGET"
  if [[ -f "$STATE/pending" ]]; then
    if recover_pending; then echo 'Previous working frontend restored.' >&2; else echo 'Automatic recovery failed; inspect logs and run rollback.' >&2; fi
  fi
  history failed "${TARGET:-}"
  notify "ORYX Live deployment FAILED | entrance-server | ${TARGET:-preflight} | stage: $STAGE"
  exit "$code"
}
# Basic connectivity is mandatory. Only candidates inspect optional local contract metadata.
backend_checks() {
  local policy=$1 context=$2 baseline=${3:-}
  STAGE="$context-api-connectivity"
  docker run --rm --read-only --cap-drop ALL --security-opt no-new-privileges:true --network sail \
    --mount "type=bind,src=$REPO,dst=/repo,readonly" \
    --mount "type=bind,src=$policy,dst=/release-policy.json,readonly" "$NODE_IMAGE" \
    node /repo/deploy/customer-docker/probe.ts api "$ORYX_API_UPSTREAM" "$ORYX_SHELL_FLOOR" /release-policy.json "${ORYX_MIN_FREE_GB:-10}" || return
  [[ "$context" != preflight ]] || { STAGE="$context"; return 0; }
  [[ -n "$baseline" ]] || { echo "Missing selected release contract baseline." >&2; return 1; }
  STAGE="$context-critical-compatibility"
  docker run --rm --read-only --cap-drop ALL --security-opt no-new-privileges:true --network host \
    --mount "type=bind,src=$REPO,dst=/repo,readonly" \
    --mount "type=bind,src=$policy,dst=/release-policy.json,readonly" \
    --mount "type=bind,src=$baseline,dst=/backend-baseline.json,readonly" "$NODE_IMAGE" \
    node /repo/deploy/customer-docker/probe.ts compatibility "${ORYX_SWAGGER_ORIGIN:-http://127.0.0.1:8080}" "$ORYX_SHELL_FLOOR" /release-policy.json "${ORYX_MIN_FREE_GB:-10}" /backend-baseline.json || return
  STAGE="$context"
}
preflight() {
  STAGE=preflight
  local command remote free_gb owners listeners
  for command in docker git curl python3 flock gzip sha256sum df ss sync; do command -v "$command" >/dev/null || { echo "Missing prerequisite: $command" >&2; return 1; }; done
  docker info >/dev/null
  docker compose version >/dev/null
  remote=$(git -C "$REPO" remote get-url origin)
  [[ "$remote" = https://github.com/kumateck/oryx-live-desktop.git || "$remote" = https://github.com/kumateck/oryx-live-desktop || "$remote" = git@github.com:kumateck/oryx-live-desktop.git ]] || { echo 'origin must be the approved kumateck/oryx-live-desktop repository.' >&2; return 1; }
  GIT_TERMINAL_PROMPT=0 GIT_SSH_COMMAND='ssh -o BatchMode=yes -o StrictHostKeyChecking=yes' git -C "$REPO" ls-remote --exit-code origin refs/heads/entrance-server >/dev/null
  free_gb=$(df -Pk "$STATE" | awk 'NR==2 {printf "%d", $4/1024/1024}')
  [[ ${ORYX_MIN_FREE_GB:-10} =~ ^[1-9][0-9]*$ && "$free_gb" -ge ${ORYX_MIN_FREE_GB:-10} ]] || { echo 'Insufficient free disk for build and independent rollback archives.' >&2; return 1; }
  docker network inspect sail >/dev/null
  docker inspect --format '{{json .NetworkSettings.Networks}}' oryx_api | python3 -c 'import json,sys; assert "sail" in json.load(sys.stdin)'
  owners=$(docker ps --filter publish=3001 --format '{{.Label "com.docker.compose.project"}}|{{.ID}}')
  [[ -z "$owners" || ( "$owners" = oryx-live\|* && "$owners" != *$'\n'* ) ]] || { echo 'Port 3001 belongs to another Docker project.' >&2; return 1; }
  listeners=$(ss -H -ltn 'sport = :3001')
  [[ -z "$listeners" || "$owners" = oryx-live\|* ]] || { echo 'Port 3001 belongs to another listener.' >&2; return 1; }
  backend_checks "$REPO/deploy/customer-docker/requirements.json" preflight
}
approved() {
  local sha=$1 file="$STATE/tmp/approval.json"
  STAGE=checking-github-approval
  curl --fail --silent --show-error --connect-timeout 10 --max-time 30 --output "$file" \
    --config <(printf 'url = "https://api.github.com/repos/kumateck/oryx-live-desktop/actions/workflows/customer-docker.yml/runs?head_sha=%s&branch=entrance-server&event=push&per_page=10"\n' "$sha";
      [[ -z ${GITHUB_TOKEN:-} ]] || printf 'header = "Authorization: Bearer %s"\n' "$GITHUB_TOKEN") \
    -H 'Accept: application/vnd.github+json' -H 'X-GitHub-Api-Version: 2022-11-28' || return 1
  python3 - "$file" "$sha" <<'PY'
import json,sys
runs=json.load(open(sys.argv[1])).get("workflow_runs",[])
assert any(r.get("head_sha")==sys.argv[2] and r.get("head_branch")=="entrance-server" and r.get("event")=="push" and r.get("conclusion")=="success" and r.get("status")=="completed" for r in runs)
PY
}
build_release() {
  local sha=$1 temporary
  local release="$STATE/releases/$sha"
  STAGE=building
  WORKTREE="$STATE/tmp/worktree-$sha"
  git -C "$REPO" worktree add --detach "$WORKTREE" "$sha" >/dev/null
  mkdir -p "$release"
  cp "$WORKTREE/deploy/customer-docker/compose.yml" "$release/compose.yml"
  cp "$WORKTREE/deploy/customer-docker/requirements.json" "$release/compatibility.json"
  cp "$WORKTREE/contracts/openapi/backend.v1.json" "$release/backend-baseline.json"
  printf 'ORYX_RELEASE_SHA=%s\nORYX_PUBLIC_PORT=3001\nORYX_API_UPSTREAM=%s\nORYX_GATEWAY_UPSTREAM=%s\nORYX_PUBLIC_PROTO=%s\nORYX_BIND_ADDRESS=%s\n' \
    "$sha" "$ORYX_API_UPSTREAM" "$ORYX_GATEWAY_UPSTREAM" "$ORYX_PUBLIC_PROTO" "$ORYX_BIND_ADDRESS" > "$release/runtime.env"
  # Exact detached commit context; never pass the webhook/token to the builder.
  docker build --file "$WORKTREE/deploy/Dockerfile" --target web --build-arg "RELEASE_SHA=$sha" --build-arg RELEASE_BRANCH=entrance-server --tag "$(image "$sha")" "$WORKTREE" > "$STATE/logs/$sha-build.log" 2>&1
  STAGE=archiving
  temporary="$STATE/images/$sha.tar.gz.tmp"
  docker image save "$(image "$sha")" | gzip -1 > "$temporary"
  gzip -t "$temporary"
  mv "$temporary" "$STATE/images/$sha.tar.gz"
  (cd "$STATE/images" && sha256sum "$sha.tar.gz" > "$sha.sha256.tmp" && mv "$sha.sha256.tmp" "$sha.sha256")
  sync -f "$STATE/images/$sha.tar.gz"
  sync -f "$STATE/images/$sha.sha256"
  git -C "$REPO" worktree remove --force "$WORKTREE" >/dev/null; WORKTREE=
}
stage_candidate() {
  local sha=$1
  STAGE=candidate-validation
  restore_image "$sha"
  backend_checks "$STATE/releases/$sha/compatibility.json" candidate-validation "$STATE/releases/$sha/backend-baseline.json"
  docker volume create --label com.docker.compose.project=oryx-live oryx-live_assets >/dev/null
  CANDIDATE="oryx-live-candidate-${sha:0:12}-$$"
  docker run --detach --name "$CANDIDATE" --network sail --mount type=volume,src=oryx-live_assets,dst=/srv/assets \
    --env "ORYX_API_ORIGIN=$ORYX_API_UPSTREAM" --env "ORYX_GATEWAY_UPSTREAM=$ORYX_GATEWAY_UPSTREAM" --env "ORYX_PUBLIC_PROTO=$ORYX_PUBLIC_PROTO" "$(image "$sha")" >/dev/null
  local ready=0
  for _ in {1..45}; do if verify_container "$CANDIDATE" "$sha"; then ready=1; break; fi; sleep 2; done
  [[ "$ready" = 1 ]] || { docker logs "$CANDIDATE" >&2; return 1; }
  docker rm -f "$CANDIDATE" >/dev/null; CANDIDATE=
}
deploy() {
  local retry=$1 sha current blocked
  recover_pending
  [[ ! -f "$STATE/paused" ]] || { echo 'Deployment is paused; use resume first.'; return 0; }
  STAGE=fetching
  GIT_TERMINAL_PROMPT=0 GIT_SSH_COMMAND='ssh -o BatchMode=yes -o StrictHostKeyChecking=yes' \
    git -C "$REPO" fetch --no-tags origin '+refs/heads/entrance-server:refs/remotes/origin/entrance-server' >/dev/null
  sha=$(git -C "$REPO" rev-parse --verify 'refs/remotes/origin/entrance-server^{commit}')
  valid_sha "$sha"
  current=$(read_value current); blocked=$(read_value blocked)
  [[ "$sha" != "$current" ]] || { echo "Already deployed: $sha"; return 0; }
  if [[ ( "$sha" = "$blocked" || -f "$STATE/quarantine/$sha" ) && "$retry" != --retry ]]; then echo "Release $sha is blocked after failure/rollback; use deploy --retry after investigation."; return 0; fi
  [[ -z "$current" ]] || git -C "$REPO" merge-base --is-ancestor "$current" "$sha" || { echo 'Unexpected production branch rewind; review manually.' >&2; return 1; }
  if ! approved "$sha"; then echo "Waiting for successful customer-docker CI approval on origin/entrance-server: $sha"; [[ "$OPERATION" = poll ]]; return; fi
  TARGET=$sha
  preflight
  history started "$sha"
  build_release "$sha"
  stage_candidate "$sha"
  write_value pending "$sha"
  STAGE=activating
  activate "$sha"
  [[ -z "$current" ]] || write_value previous "$current"
  write_value current "$sha"
  rm -f "$STATE/pending" "$STATE/quarantine/$sha"
  [[ $(read_value blocked) != "$sha" ]] || rm -f "$STATE/blocked"
  history succeeded "$sha"
  notify "ORYX Live deployment SUCCESS | entrance-server | $sha | port 3001"
  echo "Healthy customer release: $sha"
}
rollback() {
  local previous current
  previous=$(read_value previous); current=$(read_value current)
  [[ -n "$previous" ]] || { echo 'No previous known-working release exists.' >&2; return 1; }
  TARGET=$previous; STAGE=rollback
  write_value pending "$previous"
  activate "$previous"
  write_value current "$previous"
  [[ -z "$current" ]] || { write_value previous "$current"; block_release "$current"; }
  rm -f "$STATE/pending"; touch "$STATE/paused"
  history rolled-back "$previous"
  notify "ORYX Live rollback SUCCESS | $previous | polling paused; rolled-away release blocked"
}
status() {
  local current health=not-deployed
  current=$(read_value current)
  if [[ -n "$current" ]]; then health=$(docker inspect --format '{{.State.Health.Status}}' oryx-live-web-1 2>/dev/null || printf unavailable); fi
  printf 'Branch: origin/entrance-server\nDeployed SHA: %s\nContainer health: %s\nLast result: %s\nBlocked SHA: %s\n' "${current:-none}" "$health" "$(read_value last-result)" "$(read_value blocked)"
  [[ ! -f "$STATE/paused" ]] || echo 'Automatic deployments: PAUSED'
}
