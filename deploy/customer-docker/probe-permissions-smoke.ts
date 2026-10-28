// Disposable local/CI fixtures only; never included in the hosted frontend runtime.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { object, parse, string } from "../customer-server/data.ts";
import { checked, run } from "./command.ts";

/** Exercise build_release's real modes and backend_checks' real user/mounts with distinct Linux owners. */
export async function verifyProbePermissions(api: string, network: string): Promise<void> {
  const volume = `oryx-live-probe-permissions-${randomUUID()}`;
  const repo = resolve(".");
  const nodeImage = "node:24.22.1-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205";
  const docker = (args: string[]) => checked(run, { executable: "docker", args });
  const control = (args: string[]) => docker([
    "run", "--rm", "--read-only", "--user", "0:0", "--cap-drop", "ALL", "--security-opt", "no-new-privileges:true", "--network", "none",
    "--mount", `type=bind,src=${repo},dst=/repo,readonly`, "--mount", `type=volume,src=${volume},dst=/state`,
    "--env", "TMPDIR=/state", "--workdir", "/repo", nodeImage, ...args,
  ]);
  try {
    await docker(["volume", "create", volume]);
    const created = await control(["node", "--input-type=module", "-e", `
      import { fixture, next } from './tests/customer-docker-fixture.ts';
      const f=fixture();
      const result=f.run('build_release '+next+'; printf fixture-secret > "$STATE/releases/'+next+'/customer.env"');
      if(result.status!==0) throw new Error(result.stderr);
      console.log(JSON.stringify({release:f.state+'/releases/'+next}));
    `]);
    const relative = string(object(parse(created)).release);
    assert.ok(relative.startsWith("/state/") && !relative.includes(".."));
    const mountpoint = await docker(["volume", "inspect", "--format", "{{.Mountpoint}}", volume]);
    const release = `${mountpoint}${relative.slice("/state".length)}`;
    // Only networks are substituted: the actual backend_checks sets the user, images, paths and read-only mounts.
    const probe = () => run({ executable: "bash", args: ["-c", `
      set -Eeuo pipefail
      docker() {
        local args=("$@") index
        for ((index=0; index<\${#args[@]}; index++)); do
          if [[ "\${args[index]}" = --network ]]; then
            if [[ "\${args[index+1]}" = sail ]]; then args[index+1]=$ORYX_TEST_NETWORK
            elif [[ "\${args[index+1]}" = host ]]; then args[index+1]="container:$ORYX_TEST_API"; fi
          fi
        done
        command docker "\${args[@]}"
      }
      REPO=$ORYX_TEST_REPO
      source "$REPO/deploy/customer-docker/lib.sh"
      backend_checks "$ORYX_TEST_RELEASE/compatibility.json" candidate-validation "$ORYX_TEST_RELEASE/backend-baseline.json"
    `], env: {
      ORYX_TEST_REPO: repo, ORYX_TEST_RELEASE: release, ORYX_TEST_NETWORK: network, ORYX_TEST_API: api,
      ORYX_API_UPSTREAM: "http://fixture-api:5001", ORYX_SWAGGER_ORIGIN: "http://127.0.0.1:5001", ORYX_SHELL_FLOOR: "0.1.0", ORYX_MIN_FREE_GB: "1",
    } });
    const repair = () => control(["bash", "-c", 'source /repo/deploy/customer-docker/lib.sh; probe_metadata_permissions "$1"', "repair", relative]);
    await control(["chmod", "0600", `${relative}/compatibility.json`]);
    const deniedPolicy = await probe();
    assert.notEqual(deniedPolicy.code, 0); assert.match(deniedPolicy.stderr, /EACCES.*release-policy\.json/);
    await repair();
    await control(["chmod", "0600", `${relative}/backend-baseline.json`]);
    const deniedBaseline = await probe();
    assert.notEqual(deniedBaseline.code, 0); assert.match(deniedBaseline.stderr, /EACCES.*backend-baseline\.json/);
    await repair();
    const verified = await probe();
    assert.equal(verified.code, 0, verified.stderr); assert.match(verified.stdout, /API connectivity/); assert.match(verified.stdout, /Critical API contracts verified/);
    assert.equal(await control(["stat", "--format", "%a", `${relative}/compatibility.json`, `${relative}/backend-baseline.json`, `${relative}/customer.env`, relative]), "644\n644\n600\n700");
    const secret = await run({ executable: "docker", args: [
      "run", "--rm", "--read-only", "--user", "node", "--cap-drop", "ALL", "--security-opt", "no-new-privileges:true", "--network", "none",
      "--mount", `type=bind,src=${release}/customer.env,dst=/customer.env,readonly`, nodeImage,
      "node", "-e", 'require("node:fs").readFileSync("/customer.env")',
    ] });
    assert.notEqual(secret.code, 0); assert.match(secret.stderr, /EACCES.*customer\.env/);
    console.log("PASS: real candidate probes reject 0600 metadata, accept repaired 0644 JSON as node, and cannot read private 0600 credentials");
  } finally { await docker(["volume", "rm", volume]); }
}
