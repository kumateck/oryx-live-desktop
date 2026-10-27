import assert from "node:assert/strict";
import test from "node:test";
import { chmodSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fixture, old, next, linux } from "./customer-docker-fixture.ts";

const mode = (path: string) => statSync(path).mode & 0o777;
const build = `build_release ${next}`;

test("umask 077 publishes only the two probe JSON files as 0644 and keeps private files restricted", linux, () => {
  const f=fixture();
  try {
    const result=f.run(`${build}; printf 'fixture credentials' > "$STATE/customer.env"`);
    assert.equal(result.status,0,result.stderr);
    const release=join(f.state,"releases",next);
    for (const file of ["compatibility.json","backend-baseline.json"]) assert.equal(mode(join(release,file)),0o644,file);
    for (const file of [join(release,"runtime.env"),join(f.state,"customer.env"),join(f.state,"images",`${next}.tar.gz`)]) assert.equal(mode(file),0o600,file);
    assert.equal(mode(release),0o700); assert.equal(mode(f.state),0o700);
  } finally { f.cleanup(); }
});

test("retry reuses a verified exact-SHA archive and repairs legacy JSON modes without a second build", linux, () => {
  const f=fixture();
  try {
    assert.equal(f.run(build).status,0);
    const release=join(f.state,"releases",next);
    for (const file of ["compatibility.json","backend-baseline.json"]) chmodSync(join(release,file),0o600);
    rmSync(join(f.directory,"image")); // An unrelated job has pruned the unused image.
    const result=f.run(`ORYX_API_UPSTREAM=http://updated-api:5001; ${build}`);
    assert.equal(result.status,0,result.stderr); assert.match(result.stdout,/Reusing verified image/);
    const commands=readFileSync(join(f.directory,"commands"),"utf8");
    assert.equal((commands.match(/^build --file/gm)??[]).length,1);
    assert.equal((commands.match(/^image save/gm)??[]).length,1);
    assert.match(commands,/image load/);
    for (const file of ["compatibility.json","backend-baseline.json"]) assert.equal(mode(join(release,file)),0o644);
    assert.match(readFileSync(join(release,"runtime.env"),"utf8"),/ORYX_API_UPSTREAM=http:\/\/updated-api:5001/);
    assert.equal(mode(join(release,"runtime.env")),0o600);
    assert.match(readFileSync(join(f.state,"history.tsv"),"utf8"),/build-reused/);
  } finally { f.cleanup(); }
});

test("candidate failure stays blocked until explicit retry, which rechecks CI and reuses the build", linux, () => {
  const f=fixture();
  const actions=`approved(){ echo approved >> "$FIXTURE/approvals"; }; preflight(){ return 0; }; stage_candidate(){ probe_metadata_permissions "$STATE/releases/$1"; backend_checks "$STATE/releases/$1/compatibility.json" candidate-validation "$STATE/releases/$1/backend-baseline.json"; }; trap failure ERR; `;
  try {
    writeFileSync(join(f.state,"current"),old); writeFileSync(join(f.directory,"active"),old);
    const failed=f.run(actions+"export FIXTURE_FAIL_PROBE=api; deploy ''");
    assert.notEqual(failed.status,0); assert.equal(readFileSync(join(f.state,"current"),"utf8"),old);
    assert.equal(readFileSync(join(f.state,"blocked"),"utf8").trim(),next);
    const blocked=f.run(actions+"deploy ''"); assert.equal(blocked.status,0,blocked.stderr); assert.match(blocked.stdout,/is blocked/);
    const failedAgain=f.run(actions+"export FIXTURE_FAIL_PROBE=compatibility; deploy --retry");
    assert.notEqual(failedAgain.status,0); assert.equal(readFileSync(join(f.state,"current"),"utf8"),old);
    assert.equal(readFileSync(join(f.state,"blocked"),"utf8").trim(),next);
    const retry=f.run(actions+"deploy --retry"); assert.equal(retry.status,0,retry.stderr);
    assert.match(retry.stdout,/Reusing verified image/);
    assert.equal(readFileSync(join(f.state,"current"),"utf8").trim(),next);
    assert.equal(readFileSync(join(f.directory,"approvals"),"utf8").trim().split("\n").length,3);
    assert.equal((readFileSync(join(f.directory,"commands"),"utf8").match(/^build --file/gm)??[]).length,1);
    assert.equal(f.run('test ! -f "$STATE/blocked" && test ! -f "$STATE/quarantine/'+next+'"').status,0);
  } finally { f.cleanup(); }
});

test("partial, corrupt or mismatched retained artifacts trigger a fresh build", linux, () => {
  for (const damage of ["archive-missing","archive-corrupt","snapshot-changed","snapshot-missing"]) {
    const f=fixture();
    try {
      assert.equal(f.run(build).status,0);
      const release=join(f.state,"releases",next);
      if (damage==="archive-missing") rmSync(join(f.state,"images",`${next}.tar.gz`));
      if (damage==="archive-corrupt") writeFileSync(join(f.state,"images",`${next}.tar.gz`),"corrupt");
      if (damage==="snapshot-changed") writeFileSync(join(release,"compatibility.json"),'{}');
      if (damage==="snapshot-missing") rmSync(join(release,"backend-baseline.json"));
      const result=f.run(build); assert.equal(result.status,0,`${damage}: ${result.stderr}`);
      assert.doesNotMatch(result.stdout,/Reusing verified image/);
      assert.equal((readFileSync(join(f.directory,"commands"),"utf8").match(/^build --file/gm)??[]).length,2,damage);
    } finally { f.cleanup(); }
  }
});

test("retained builds never bypass a fresh CI approval check", linux, () => {
  const f=fixture();
  try {
    assert.equal(f.run(build).status,0);
    const before=readFileSync(join(f.directory,"commands"),"utf8");
    const result=f.run("approved(){ return 1; }; OPERATION=poll; deploy --retry");
    assert.equal(result.status,0,result.stderr); assert.match(result.stdout,/Waiting for successful/);
    assert.equal(readFileSync(join(f.directory,"commands"),"utf8"),before);
  } finally { f.cleanup(); }
});


test("metadata repair refuses symlinks without changing credential permissions", linux, () => {
  const f=fixture();
  try {
    const result=f.run('printf fixture-secret > "$STATE/customer.env"; ln -s "$STATE/customer.env" "$STATE/releases/'+next+'/compatibility.json"; cp "$REPO/contracts/openapi/backend.v1.json" "$STATE/releases/'+next+'/backend-baseline.json"; probe_metadata_permissions "$STATE/releases/'+next+'"');
    assert.notEqual(result.status,0); assert.equal(mode(join(f.state,"customer.env")),0o600);
  } finally { f.cleanup(); }
});

test("a retained image with the wrong revision cannot qualify for reuse", linux, () => {
  const f=fixture();
  try {
    assert.equal(f.run(build).status,0);
    const result=f.run(`docker(){ if [[ "$1" = image && "$2" = inspect && "$*" = *--format* ]]; then echo ${old}; else command docker "$@"; fi; }; reusable_build ${next}`);
    assert.notEqual(result.status,0);
  } finally { f.cleanup(); }
});
