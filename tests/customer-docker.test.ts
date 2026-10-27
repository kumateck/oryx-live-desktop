import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
const old = "a".repeat(40), next = "b".repeat(40);
const linux = { skip: process.platform !== "linux" };
function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "oryx-customer-docker-"));
  const state = join(directory, "state"); const bin = join(directory, "bin");
  for (const path of [bin, state, join(state,"releases",old), join(state,"releases",next), join(state,"logs"), join(state,"images")]) mkdirSync(path, { recursive: true });
  const executable = (name: string, source: string) => { const path = join(bin,name); writeFileSync(path, `#!/usr/bin/env bash\nset -eu\n${source}\n`); chmodSync(path, 0o755); };
  executable("docker", `printf '%s\\n' "$*" >> "$FIXTURE/commands"
if [[ "$1" = image && "$2" = inspect ]]; then
  if [[ "$*" = *--format* ]]; then printf '%s\\n' "\${@: -1}" | sed 's/.*://'; else [[ -f "$FIXTURE/image" ]]; fi
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
if [[ "$*" = *write-out* ]]; then printf 401
elif [[ "$*" = *deployment.json* ]]; then printf '{"commit":"%s"}' "$(cat "$FIXTURE/active")"
fi`);
  for (const sha of [old,next]) {
    writeFileSync(join(state,"releases",sha,"runtime.env"),`ORYX_RELEASE_SHA=${sha}\n`);
    writeFileSync(join(state,"releases",sha,"compose.yml"),"fixture");
  }
  writeFileSync(join(directory,"active"),next); writeFileSync(join(directory,"image"),"");
  const prefix = `set -Eeuo pipefail\nSTATE="$FIXTURE/state"\nREPO="${resolve(".")}"\nDISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/123/fixture-secret\nORYX_API_UPSTREAM=http://oryx_api:5001\nORYX_SHELL_FLOOR=0.1.0\nOPERATION=deploy\nSTAGE=test\nTARGET=\nWORKTREE=\nCANDIDATE=\nsource "${resolve("deploy/customer-docker/lib.sh")}"\n`;
  const run = (body: string) => spawnSync("bash", ["-c",prefix+body], { encoding:"utf8", env:{...process.env,FIXTURE:directory,PATH:`${bin}:${process.env.PATH ?? "/usr/bin:/bin"}`} });
  return { directory,state,run, cleanup:()=>rmSync(directory,{recursive:true,force:true}) };
}

test("customer package restricts fetches and CI approval to entrance-server and never uses compose down or global pruning", () => {
  const script=readFileSync("deploy/customer-docker/deploy.sh","utf8"); const lib=readFileSync("deploy/customer-docker/lib.sh","utf8");
  assert.match(script,/accept origin\/entrance-server only/);
  assert.match(lib,/\+refs\/heads\/entrance-server:refs\/remotes\/origin\/entrance-server/);
  assert.match(lib,/head_branch.*entrance-server/);
  assert.doesNotMatch(lib.split("\n").filter((line)=>!line.trimStart().startsWith("#")).join("\n"),/compose .*\bdown\b|docker (?:system|image) prune/);
  assert.match(lib,/docker image save/); assert.match(lib,/docker image load/);
  const workflow=readFileSync(".github/workflows/customer-docker.yml","utf8");
  assert.equal((workflow.match(/branches: \[entrance-server\]/g)??[]).length,2); assert.doesNotMatch(workflow,/branches: \[(?:main|testing)\]/);
});

test("rollback reloads a checksum-verified archived image after external image pruning", linux, () => {
  const f=fixture();
  try {
    writeFileSync(join(f.state,"current"),next); writeFileSync(join(f.state,"previous"),old);
    rmSync(join(f.directory,"image"));
    const archive=spawnSync("gzip",["-c"],{input:"independent rollback image bytes"}); assert.equal(archive.status,0);
    writeFileSync(join(f.state,"images",`${old}.tar.gz`),archive.stdout);
    const hash=spawnSync("sha256sum",[`${old}.tar.gz`],{cwd:join(f.state,"images"),encoding:"utf8"});
    writeFileSync(join(f.state,"images",`${old}.sha256`),hash.stdout);
    const result=f.run("rollback"); assert.equal(result.status,0,result.stderr);
    assert.equal(readFileSync(join(f.state,"current"),"utf8").trim(),old);
    assert.equal(readFileSync(join(f.state,"blocked"),"utf8").trim(),next);
    assert.ok(readFileSync(join(f.directory,"loaded"),"utf8").includes("rollback image bytes"));
    assert.ok(readFileSync(join(f.directory,"commands"),"utf8").includes("image load"));
    assert.doesNotMatch(readFileSync(join(f.directory,"curl-commands"),"utf8"),/fixture-secret/);
  } finally { f.cleanup(); }
});

test("a failed build preserves the running frontend and blocks blind retries", linux, () => {
  const f=fixture();
  try {
    writeFileSync(join(f.state,"current"),old);
    const result=f.run(`git(){ if [[ "$*" = *rev-parse* ]]; then echo ${next}; fi; }; approved(){ return 0; }; preflight(){ return 0; }; build_release(){ return 17; }; trap failure ERR; deploy ''`);
    assert.notEqual(result.status,0); assert.equal(readFileSync(join(f.state,"current"),"utf8"),old);
    assert.equal(readFileSync(join(f.state,"blocked"),"utf8").trim(),next);
    const commands=spawnSync("test",["-e",join(f.directory,"commands")]); assert.notEqual(commands.status,0);
    const retry=f.run(`git(){ if [[ "$*" = *rev-parse* ]]; then echo ${next}; fi; }; deploy ''`);
    assert.equal(retry.status,0,retry.stderr); assert.match(retry.stdout,/blocked/);
  } finally { f.cleanup(); }
});

test("an interrupted activation restores the known-working frontend from durable pending state", linux, () => {
  const f=fixture();
  try {
    writeFileSync(join(f.state,"current"),old); writeFileSync(join(f.state,"pending"),next);
    const result=f.run("recover_pending"); assert.equal(result.status,0,result.stderr);
    assert.equal(readFileSync(join(f.directory,"active"),"utf8").trim(),old);
    assert.equal(readFileSync(join(f.state,"blocked"),"utf8").trim(),next);
    const commands=readFileSync(join(f.directory,"commands"),"utf8"); assert.match(commands,/--project-name oryx-live/); assert.doesNotMatch(commands,/\bdown\b|oryx_api|restart/);
  } finally { f.cleanup(); }
});

test("corrupt rollback archives are refused before replacing the frontend", linux, () => {
  const f=fixture();
  try {
    rmSync(join(f.directory,"image"));
    writeFileSync(join(f.state,"images",`${old}.tar.gz`),"tampered"); writeFileSync(join(f.state,"images",`${old}.sha256`),`${"0".repeat(64)}  ${old}.tar.gz\n`);
    const result=f.run(`restore_image ${old}`); assert.notEqual(result.status,0);
    assert.doesNotMatch(readFileSync(join(f.directory,"commands"),"utf8"),/compose.*up/);
  } finally { f.cleanup(); }
});


test("failed replacement automatically restores the working release", linux, () => {
  const f=fixture();
  try {
    writeFileSync(join(f.state,"current"),old); writeFileSync(join(f.directory,"fail-activation"),next);
    const result=f.run(`git(){ if [[ "$*" = *rev-parse* ]]; then echo ${next}; fi; }; approved(){ return 0; }; preflight(){ return 0; }; build_release(){ return 0; }; stage_candidate(){ return 0; }; trap failure ERR; deploy ''`);
    assert.notEqual(result.status,0); assert.equal(readFileSync(join(f.state,"current"),"utf8"),old);
    assert.equal(readFileSync(join(f.directory,"active"),"utf8").trim(),old);
    assert.equal(readFileSync(join(f.state,"blocked"),"utf8").trim(),next);
    assert.match(result.stderr,/Previous working frontend restored/);
  } finally { f.cleanup(); }
});

test("pause prevents cron fetch/build and resume leaves quarantined SHAs blocked", linux, () => {
  const f=fixture();
  try {
    const config=join(f.directory,"customer.env");
    writeFileSync(config,`ORYX_DEPLOY_BRANCH=entrance-server\nORYX_DEPLOY_STATE=${f.state}\nORYX_SHELL_FLOOR=0.1.0\nDISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/123/fixture-secret\n`,{mode:0o600});
    const command=(operation:string)=>spawnSync("bash",["deploy/customer-docker/deploy.sh",operation],{encoding:"utf8",env:{...process.env,ORYX_CUSTOMER_CONFIG:config}});
    assert.equal(command("pause").status,0);
    writeFileSync(join(f.state,"blocked"),next);
    const poll=command("poll"); assert.equal(poll.status,0,poll.stderr); assert.match(poll.stdout,/Polling paused/);
    assert.equal(command("resume").status,0); assert.equal(readFileSync(join(f.state,"blocked"),"utf8"),next);
  } finally { f.cleanup(); }
});
