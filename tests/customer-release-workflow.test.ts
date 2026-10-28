import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import test from "node:test";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { outgoingPushCommits } from "../scripts/pre-push-validation.ts";
import { extractReleaseSource, releaseBuildArguments } from "../scripts/customer-release-validation.ts";

const path = ".github/workflows/customer-docker.yml";
const workflow = readFileSync(path, "utf8");
const sha = "a".repeat(40);

test("development work and open PRs stay quiet until a milestone reaches a release branch", () => {
  const triggers = workflow.slice(workflow.indexOf("\non:\n"), workflow.indexOf("\npermissions:"));
  assert.deepEqual([...triggers.matchAll(/^ {2}([\w_]+):/gm)].map((match) => match[1]), ["push", "workflow_dispatch"]);
  assert.match(triggers, /push:\s+branches: \[testing, entrance-server\]/);
  assert.doesNotMatch(triggers, /development|pull_request|workflow_run/);
});

test("CI validates its checked-out commit without a workstation disk-space admission gate", () => {
  const validator = readFileSync("scripts/customer-release-validation.ts", "utf8");
  assert.doesNotMatch(validator, /statfs|requireValidationDiskSpace|ORYX_MIN_FREE_GB|Free disk space/);
  assert.match(workflow, /ref: \$\{\{ github.sha \}\}/);
  // Customer deployment storage is checked separately, on the server that will actually host releases.
  assert.match(readFileSync("deploy/customer-docker/lib.sh", "utf8"), /free_gb.*ORYX_MIN_FREE_GB|ORYX_MIN_FREE_GB.*free_gb/);
});

test("the exported source remains readable by the non-root read-only probe under umask 077", { skip: process.platform === "win32" }, () => {
  const directory = mkdtempSync(join(tmpdir(), "oryx-source-permissions-"));
  const fixture = mkdtempSync(join(tmpdir(), "oryx-source-fixture-"));
  const previous = process.umask(0o077);
  try {
    mkdirSync(join(fixture, ".github/workflows"), { recursive: true });
    writeFileSync(join(fixture, path), "name: public committed fixture\n");
    for (const folder of [fixture, join(fixture, ".github"), join(fixture, ".github/workflows")]) chmodSync(folder, 0o755);
    chmodSync(join(fixture, path), 0o644);
    const archive = spawnSync("tar", ["-cf", "-", "-C", fixture, ".github"]);
    assert.equal(archive.status, 0);
    extractReleaseSource(archive.stdout, directory);
    for (const folder of [directory, join(directory, ".github"), join(directory, ".github/workflows")]) {
      assert.equal(statSync(folder).mode & 0o005, 0o005, folder);
    }
    assert.equal(statSync(join(directory, path)).mode & 0o004, 0o004);
  } finally {
    process.umask(previous);
    rmSync(directory, { recursive: true, force: true });
    rmSync(fixture, { recursive: true, force: true });
  }
});

test("one production workflow queues all runs and validates before optional Windows packaging", () => {
  const entries = readdirSync(".github/workflows").filter((name) => /\.ya?ml$/.test(name));
  assert.deepEqual(entries, ["customer-docker.yml"]);
  assert.equal(existsSync(".github/workflows/customer-server.yml"), false);
  assert.equal(existsSync(".github/workflows/deploy-testing.yml"), false);
  assert.match(workflow, /push:\s+branches: \[testing, entrance-server\]/);
  assert.doesNotMatch(workflow, /^\s*(?:pull_request|pull_request_target|workflow_run):/m);
  assert.doesNotMatch(workflow, /github\.base_ref/);
  assert.match(workflow, /if: github.ref == 'refs\/heads\/entrance-server' \|\| github.ref == 'refs\/heads\/testing'/);
  assert.match(workflow, /concurrency:\s+group: customer-release\s+cancel-in-progress: false\s+queue: max/);
  assert.equal((workflow.match(/concurrency:/g) ?? []).length, 1);
  assert.doesNotMatch(workflow, /group:.*github\.ref|strategy:|matrix:/);
  assert.match(workflow, /build_windows:[\s\S]*?type: boolean[\s\S]*?default: false/);
  assert.match(workflow, /windows-installer:[\s\S]*?needs: \[web, testing-deploy\][\s\S]*?workflow_dispatch.*refs\/heads\/entrance-server.*inputs\.build_windows/);
  assert.match(workflow, /node scripts\/customer-release-validation\.ts --sha "\$\{\{ github.sha \}\}"/);
  assert.doesNotMatch(workflow.slice(0, workflow.indexOf("  testing-images:")), /docker\/build-push-action|run: bun run check|run: bun run build:web/);
});

test("production approval retains the existing workflow path and requires the complete exact-SHA push run", () => {
  const deploy = readFileSync("deploy/customer-docker/lib.sh", "utf8");
  assert.match(deploy, /actions\/workflows\/customer-docker\.yml\/runs\?head_sha=%s&branch=entrance-server&event=push/);
  assert.match(deploy, /r\.get\("status"\)=="completed"/);
  assert.match(deploy, /r\.get\("conclusion"\)=="success"/);
  assert.match(workflow, /ref: \$\{\{ github.sha \}\}/);
});

test("pre-push validates every outgoing branch SHA, including development and testing before their production PRs", () => {
  assert.deepEqual(outgoingPushCommits(`refs/heads/testing ${sha} refs/heads/entrance-server ${"b".repeat(40)}\n`), [sha]);
  assert.deepEqual(outgoingPushCommits(`refs/heads/entrance-server ${sha} refs/heads/testing ${"b".repeat(40)}\n`), [sha]);
  assert.deepEqual(outgoingPushCommits(`(delete) ${"0".repeat(40)} refs/heads/entrance-server ${sha}\n`), []);
  assert.deepEqual(outgoingPushCommits(`refs/heads/a ${sha} refs/heads/entrance-server ${sha}\nrefs/heads/b ${sha} refs/heads/entrance-server ${sha}\n`), [sha]);
  assert.throws(() => outgoingPushCommits("malformed"), /Invalid pre-push/);
  assert.equal(readFileSync(".husky/pre-push", "utf8").trim(), "node scripts/pre-push-validation.ts");
});

test("local and CI validation build the same frozen AMD64 release sequentially and retain unrelated Docker state", () => {
  const args = releaseBuildArguments(sha, "customer-validation", "fixture:validation");
  assert.deepEqual(args.slice(0, 5), ["buildx", "build", "--load", "--platform", "linux/amd64"]);
  assert.ok(args.includes(`RELEASE_SHA=${sha}`)); assert.ok(args.includes("RELEASE_BRANCH=entrance-server"));
  assert.ok(args.includes("customer-validation")); assert.equal(args.at(-1), ".");
  assert.ok(releaseBuildArguments(sha, "web", "fixture:web").includes("web"));
  assert.throws(() => releaseBuildArguments("testing", "web", "fixture:web"), /full Git commit SHA/);
  const validator = readFileSync("scripts/customer-release-validation.ts", "utf8");
  assert.match(validator, /\["archive", "--format=tar", sha\]/);
  assert.match(validator, /ghcr.io\/kjanat\/actionlint:1\.17\.0@sha256:[a-f0-9]{64}/);
  assert.doesNotMatch(validator, /"-ignore"|"--ignore"/);
  assert.match(validator, /"--network", "none"/);
  assert.ok(validator.indexOf('releaseBuildArguments(sha, "customer-validation"') < validator.indexOf('releaseBuildArguments(sha, "web"'));
  assert.ok(validator.indexOf('releaseBuildArguments(sha, "web"') < validator.indexOf('"deploy/customer-docker/smoke.ts"'));
  assert.doesNotMatch(validator, /image.*prune|compose.*down/);
  const docker = readFileSync("deploy/Dockerfile", "utf8");
  assert.equal((docker.match(/RUN bun run check && bun run build:web/g) ?? []).length, 1);
  assert.match(docker, /FROM \$\{NODE_IMAGE\} AS customer-validation/);
  assert.match(docker, /nginx systemd util-linux git ca-certificates/);
  assert.match(docker, /ORYX_CUSTOMER_INSTALL_FIXTURE=container-only node scripts\/customer-install-fixture.ts/);
  const apt = readFileSync("scripts/customer-apt-source.ts", "utf8");
  assert.match(apt, /rootCertificates/); assert.match(apt, /https:\/\/deb\.debian\.org/);
  assert.doesNotMatch(apt + docker, /Verify-Peer=false|Verify-Host=false|allow-unauthenticated/);
  const fixture = readFileSync("scripts/customer-install-fixture.ts", "utf8");
  for (const check of ["systemd-analyze", "runuser", "check-nginx.ts", "check-release.ts", "uninstall.ts", "before.equals"]) assert.ok(fixture.includes(check), check);
});

test("a failed release check exits pre-push unsuccessfully before any upload", { skip: process.platform === "win32" }, () => {
  const directory = mkdtempSync(join(tmpdir(), "oryx-pre-push-test-"));
  try {
    writeFileSync(join(directory, "docker"), `#!${process.execPath}\nprocess.exit(42);\n`, { mode: 0o755 });
    const result = spawnSync(process.execPath, ["scripts/pre-push-validation.ts"], {
      encoding: "utf8", input: `refs/heads/development ${sha} refs/heads/development ${"b".repeat(40)}\n`,
      env: { ...process.env, PATH: `${directory}:${process.env.PATH ?? ""}` },
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Start Docker before pushing/);
    assert.match(result.stderr, /Push blocked: customer release validation failed/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
