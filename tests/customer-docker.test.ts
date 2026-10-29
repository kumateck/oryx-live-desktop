import assert from "node:assert/strict";
import test from "node:test";
import { mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fixture, old, next, linux } from "./customer-docker-fixture.ts";

test("customer package restricts fetches and CI approval to entrance-server and never uses compose down or global pruning", () => {
  const script=readFileSync("deploy/customer-docker/deploy.sh","utf8"); const lib=readFileSync("deploy/customer-docker/lib.sh","utf8");
  assert.match(script,/accept origin\/entrance-server only/);
  assert.match(lib,/\+refs\/heads\/entrance-server:refs\/remotes\/origin\/entrance-server/);
  assert.match(lib,/head_branch.*entrance-server/);
  assert.doesNotMatch(lib.split("\n").filter((line)=>!line.trimStart().startsWith("#")).join("\n"),/compose .*\bdown\b|docker (?:system|image) prune/);
  assert.match(lib,/docker image save/); assert.match(lib,/docker image load/);
  const workflow=readFileSync(".github/workflows/customer-docker.yml","utf8");
  assert.equal((workflow.match(/branches: \[testing, entrance-server\]/g)??[]).length,1);
  assert.match(workflow, /testing-deploy:[\s\S]*?if: github.ref == 'refs\/heads\/testing'/);
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


test("candidate compatibility uses sail API and a selected-baseline host-network probe", () => {
  const f=fixture();
  try {
    const result=f.run('ORYX_SWAGGER_ORIGIN=http://localhost:8081; backend_checks "$STATE/releases/'+next+'/compatibility.json" candidate-validation "$STATE/baseline.json"');
    assert.equal(result.status,0,result.stderr);
    const calls=readFileSync(join(f.directory,"commands"),"utf8").trim().split("\n");
    assert.equal(calls.length,2);
    assert.match(calls[0]??"",/--network sail .*probe.ts api http:\/\/oryx_api:5001/);
    assert.match(calls[1]??"",/--network host .*probe.ts compatibility http:\/\/localhost:8081/);
    for (const call of calls) {
      assert.match(call,/--rm --read-only --user node --cap-drop ALL/);
      assert.ok(call.includes(`/releases/${next}/compatibility.json,dst=/release-policy.json,readonly`));
      assert.doesNotMatch(call,/--header|--env|Host:/);
    }
    const lib=readFileSync("deploy/customer-docker/lib.sh","utf8");
    assert.ok(lib.includes('backend_checks "$REPO/deploy/customer-docker/requirements.json" preflight'));
    assert.ok(lib.includes('backend_checks "$STATE/releases/$sha/compatibility.json" candidate-validation "$STATE/releases/$sha/backend-baseline.json"'));
    assert.doesNotMatch(readFileSync("deploy/customer-docker/compose.yml","utf8"),/SWAGGER/);
  } finally { f.cleanup(); }
});

test("API probe failure stops before Swagger and preserves a failing exit status", () => {
  const f=fixture();
  try {
    const result=f.run('export FIXTURE_FAIL_PROBE=api; backend_checks "$STATE/policy.json" preflight');
    assert.equal(result.status,23,result.stderr);
    const calls=readFileSync(join(f.directory,"commands"),"utf8").trim().split("\n");
    assert.equal(calls.length,1); assert.match(calls[0]??"",/--network sail/);
  } finally { f.cleanup(); }
});

test("confirmed critical incompatibility fails the candidate before activation", () => {
  const f=fixture();
  try {
    const result=f.run('export FIXTURE_FAIL_PROBE=compatibility; backend_checks "$STATE/policy.json" candidate-validation "$STATE/baseline.json"; echo unexpected-activation');
    assert.equal(result.status,23,result.stderr);
    assert.doesNotMatch(result.stdout,/unexpected-activation/);
    const calls=readFileSync(join(f.directory,"commands"),"utf8").trim().split("\n");
    assert.equal(calls.length,2);
    assert.match(calls[1]??"",/--network host .*probe.ts compatibility http:\/\/127.0.0.1:8080/);
  } finally { f.cleanup(); }
});


test("preflight never requests Swagger or reads the legacy fingerprint policy", () => {
  const f=fixture();
  try {
    const result=f.run('ORYX_SWAGGER_ORIGIN=http://unavailable.invalid; backend_checks "$STATE/requirements.json" preflight');
    assert.equal(result.status,0,result.stderr);
    const commands=readFileSync(join(f.directory,"commands"),"utf8").trim().split("\n");
    assert.equal(commands.length,1); assert.match(commands[0]??"",/--network sail .*probe.ts api/);
    const sources=["deploy/customer-docker/probe.ts","deploy/customer-docker/probe-checks.ts","deploy/customer-docker/build-metadata.ts","deploy/customer-docker/lib.sh"].map((path)=>readFileSync(path,"utf8")).join("\n");
    assert.doesNotMatch(sources,/backendContracts|contractDigest|customer-server\/release.json|verifySwaggerContract/);
    assert.doesNotMatch(readFileSync("deploy/Dockerfile","utf8"),/customer-server\/check-release/);
  } finally { f.cleanup(); }
});


test("CI approval requires the exact successful production push and holds activation otherwise", () => {
  const f=fixture();
  try {
    mkdirSync(join(f.state,"tmp"),{recursive:true});
    const valid={head_sha:next,head_branch:"entrance-server",event:"push",status:"completed",conclusion:"success"};
    for (const invalid of [{head_sha:old},{head_branch:"testing"},{head_branch:"main"},{event:"pull_request"},{status:"in_progress"},{conclusion:"failure"}]) {
      writeFileSync(join(f.directory,"approval.json"),JSON.stringify({workflow_runs:[{...valid,...invalid}]}));
      assert.notEqual(f.run(`approved ${next}`).status,0);
    }
    writeFileSync(join(f.directory,"approval.json"),JSON.stringify({workflow_runs:[valid]}));
    assert.equal(f.run(`approved ${next}`).status,0);
    writeFileSync(join(f.state,"current"),old);
    const result=f.run(`git(){ if [[ "$*" = *rev-parse* ]]; then echo ${next}; fi; }; approved(){ return 1; }; OPERATION=poll; deploy ''`);
    assert.equal(result.status,0,result.stderr); assert.match(result.stdout,/Waiting for successful/);
    assert.equal(readFileSync(join(f.state,"current"),"utf8"),old);
    assert.equal(f.run('test ! -f "$FIXTURE/commands"').status,0);
  } finally { f.cleanup(); }
});

test("Discord alerts announce start, success, failure and rollback like the customer backend", linux, () => {
  const alerts=(f:ReturnType<typeof fixture>)=>readFileSync(join(f.directory,"curl-commands"),"utf8").split("\n")
    .filter((line)=>line.includes("--data-binary")).map((line)=>JSON.parse(line.slice(line.indexOf("--data-binary ")+14)).content as string);
  const stubs=`ORYX_SERVER_NAME=test-server; git(){ if [[ "$*" = *rev-parse* ]]; then echo ${next}; fi; }; approved(){ return 0; }; preflight(){ return 0; }; stage_candidate(){ return 0; };`;
  let f=fixture();
  try {
    writeFileSync(join(f.state,"current"),old);
    const result=f.run(`${stubs} build_release(){ return 0; }; trap failure ERR; deploy ''`); assert.equal(result.status,0,result.stderr);
    assert.deepEqual(alerts(f),[
      `🟡 ORYX Frontend deployment STARTED | test-server | entrance-server ${next.slice(0,8)} | building | replacing ${old.slice(0,8)}`,
      `🟢 ORYX Frontend deployment SUCCESS | test-server | entrance-server ${next.slice(0,8)} | frontend healthy, API reachable | port 3001`]);
    assert.doesNotMatch(readFileSync(join(f.directory,"curl-commands"),"utf8"),/fixture-secret/);
    const unchanged=f.run(`${stubs} deploy ''`); assert.equal(unchanged.status,0,unchanged.stderr);
    assert.equal(alerts(f).length,2);
  } finally { f.cleanup(); }
  f=fixture();
  try {
    writeFileSync(join(f.state,"current"),old);
    const result=f.run(`${stubs} build_release(){ STAGE=building; return 17; }; trap failure ERR; deploy --retry`); assert.notEqual(result.status,0);
    assert.deepEqual(alerts(f),[
      `🟡 ORYX Frontend deployment STARTED | test-server | entrance-server ${next.slice(0,8)} | building (retry) | replacing ${old.slice(0,8)}`,
      `🔴 ORYX Frontend deployment FAILED | test-server | entrance-server ${next.slice(0,8)} | stage: building | previous frontend still running | run: bash deploy/customer-docker/deploy.sh deploy --retry after checking the logs`]);
  } finally { f.cleanup(); }
  f=fixture();
  try {
    writeFileSync(join(f.state,"current"),old); writeFileSync(join(f.directory,"fail-activation"),next);
    const result=f.run(`${stubs} build_release(){ return 0; }; trap failure ERR; deploy ''`); assert.notEqual(result.status,0);
    assert.match(alerts(f).at(-1)??"",/^🔴 ORYX Frontend deployment FAILED \| test-server \| entrance-server bbbbbbbb \| stage: activating \| previous frontend restored \|/);
  } finally { f.cleanup(); }
  f=fixture();
  try {
    writeFileSync(join(f.state,"current"),next); writeFileSync(join(f.state,"previous"),old);
    const result=f.run(`ORYX_SERVER_NAME=test-server; trap failure ERR; rollback`); assert.equal(result.status,0,result.stderr);
    assert.deepEqual(alerts(f),[`🔵 ORYX Frontend rollback SUCCESS | test-server | entrance-server ${old.slice(0,8)} | ${next.slice(0,8)} blocked | automatic deployments paused, run resume when fixed`]);
  } finally { f.cleanup(); }
});
