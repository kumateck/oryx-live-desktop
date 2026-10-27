import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { spawnSync } from "node:child_process";
export const old = "a".repeat(40), next = "b".repeat(40);
export const linux = { skip: process.platform !== "linux" };
export function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "oryx-customer-docker-"));
  const state = join(directory, "state"); const bin = join(directory, "bin");
  for (const path of [bin, state, join(state,"releases",old), join(state,"releases",next), join(state,"logs"), join(state,"images")]) mkdirSync(path, { recursive: true, mode: 0o700 });
  const executable = (name: string, source: string) => { const path = join(bin,name); writeFileSync(path, `#!/usr/bin/env bash\nset -eu\n${source}\n`); chmodSync(path, 0o755); };
  executable("docker", `printf '%s\\n' "$*" >> "$FIXTURE/commands"
if [[ "$1" = run && -n "\${FIXTURE_FAIL_PROBE:-}" && "$*" = *"probe.ts \${FIXTURE_FAIL_PROBE:-} "* ]]; then exit 23
else :; fi
if [[ "$1" = image && "$2" = inspect ]]; then
  if [[ "$*" = *--format* ]]; then printf '%s\\n' "\${@: -1}" | sed 's/.*://'; else [[ -f "$FIXTURE/image" ]]; fi
elif [[ "$1" = build ]]; then touch "$FIXTURE/image"
elif [[ "$1" = image && "$2" = save ]]; then printf 'verified fixture image bytes'
elif [[ "$1" = image && "$2" = load ]]; then cat > "$FIXTURE/loaded"; touch "$FIXTURE/image"
elif [[ "$1" = inspect ]]; then echo healthy
elif [[ "$1" = exec ]]; then
  if [[ "$*" = *deployment.json* ]]; then printf '{"commit":"%s","branch":"entrance-server"}' "$(cat "$FIXTURE/active")"; else echo '<meta name="application-name" content="Oryx Live">'; fi
elif [[ "$1" = compose ]]; then
  if [[ "$*" = *' up '* ]]; then
    for arg in "$@"; do if [[ "$arg" = */runtime.env ]]; then requested=$(sed -n 's/^ORYX_RELEASE_SHA=//p' "$arg"); fi; done
    if [[ -f "$FIXTURE/fail-activation" && "$requested" = "$(cat "$FIXTURE/fail-activation")" ]]; then exit 19; fi
    printf '%s\\n' "$requested" > "$FIXTURE/active"
  elif [[ "$*" = *' ps '* ]]; then echo oryx-live-web-1; fi
fi`);
  executable("curl", `printf '%s\\n' "$*" >> "$FIXTURE/curl-commands"
if [[ "$*" = *approval.json* ]]; then cp "$FIXTURE/approval.json" "$FIXTURE/state/tmp/approval.json"
elif [[ "$*" = *write-out* ]]; then printf 401
elif [[ "$*" = *deployment.json* ]]; then printf '{"commit":"%s"}' "$(cat "$FIXTURE/active")"
fi`);
  for (const source of ["deploy/customer-docker/compose.yml","deploy/customer-docker/requirements.json","contracts/openapi/backend.v1.json"]) {
    const target=join(directory,"source",source); mkdirSync(dirname(target),{recursive:true}); writeFileSync(target,readFileSync(source));
  }
  executable("git", `printf '%s\\n' "$*" >> "$FIXTURE/git-commands"
if [[ "$*" = *rev-parse* ]]; then echo ${next}
elif [[ "$*" = *' show '* ]]; then path="\${@: -1}"; cat "$FIXTURE/source/\${path#*:}"
elif [[ "$*" = *'worktree add'* ]]; then target="\${@: -2:1}"; mkdir -p "$target"; cp -R "$FIXTURE/source/." "$target"
elif [[ "$*" = *'worktree remove'* ]]; then target="\${@: -1}"; [[ "$target" = "$FIXTURE/state/tmp/"* ]]; rm -rf "$target"
fi`);
  for (const sha of [old,next]) {
    writeFileSync(join(state,"releases",sha,"runtime.env"),`ORYX_RELEASE_SHA=${sha}\n`,{mode:0o600});
    writeFileSync(join(state,"releases",sha,"compose.yml"),"fixture",{mode:0o600});
  }
  writeFileSync(join(directory,"active"),next); writeFileSync(join(directory,"image"),"");
  const prefix = `set -Eeuo pipefail\numask 077\nSTATE="$FIXTURE/state"\nREPO="${resolve(".")}"\nDISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/123/fixture-secret\nORYX_API_UPSTREAM=http://oryx_api:5001\nORYX_SHELL_FLOOR=0.1.0\nORYX_GATEWAY_UPSTREAM=disabled.invalid:4100\nORYX_PUBLIC_PROTO=auto\nORYX_BIND_ADDRESS=0.0.0.0\nOPERATION=deploy\nSTAGE=test\nTARGET=\nWORKTREE=\nCANDIDATE=\nsource "${resolve("deploy/customer-docker/lib.sh")}"\n`;
  const run = (body: string) => spawnSync("bash", ["-c",prefix+body], { encoding:"utf8", env:{...process.env,FIXTURE:directory,PATH:`${bin}:${process.env.PATH ?? "/usr/bin:/bin"}`} });
  return { directory,state,run, cleanup:()=>rmSync(directory,{recursive:true,force:true}) };
}

