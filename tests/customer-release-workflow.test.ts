import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { productionPushCommits } from "../scripts/pre-push-validation.ts";
import { releaseBuildArguments } from "../scripts/customer-release-validation.ts";

const path = ".github/workflows/customer-docker.yml";
const workflow = readFileSync(path, "utf8");
const sha = "a".repeat(40);

test("one production workflow queues all runs and validates before optional Windows packaging", () => {
  const entries = readdirSync(".github/workflows").filter((name) => /\.ya?ml$/.test(name));
  assert.deepEqual(entries, ["customer-docker.yml"]);
  assert.equal(existsSync(".github/workflows/customer-server.yml"), false);
  assert.equal(existsSync(".github/workflows/deploy-testing.yml"), false);
  assert.match(workflow, /push:\s+branches: \[entrance-server\]/);
  assert.match(workflow, /pull_request:\s+branches: \[entrance-server\]/);
  assert.match(workflow, /concurrency:\s+group: customer-release\s+cancel-in-progress: false/);
  assert.equal((workflow.match(/concurrency:/g) ?? []).length, 1);
  assert.doesNotMatch(workflow, /group:.*github\.ref|strategy:|matrix:/);
  assert.match(workflow, /build_windows:[\s\S]*?type: boolean[\s\S]*?default: false/);
  assert.match(workflow, /windows-installer:[\s\S]*?needs: web[\s\S]*?if:.*workflow_dispatch.*refs\/heads\/entrance-server.*inputs\.build_windows/);
  assert.match(workflow, /node scripts\/customer-release-validation\.ts --sha "\$\{\{ github.sha \}\}"/);
  assert.doesNotMatch(workflow, /docker\/build-push-action|run: bun run check|run: bun run build:web/);
});

test("production approval retains the existing workflow path and requires the complete exact-SHA push run", () => {
  const deploy = readFileSync("deploy/customer-docker/lib.sh", "utf8");
  assert.match(deploy, /actions\/workflows\/customer-docker\.yml\/runs\?head_sha=%s&branch=entrance-server&event=push/);
  assert.match(deploy, /r\.get\("status"\)=="completed"/);
  assert.match(deploy, /r\.get\("conclusion"\)=="success"/);
  assert.match(workflow, /ref: \$\{\{ github.sha \}\}/);
});

test("pre-push validates the actual outgoing production ref, not the checked-out branch name", () => {
  assert.deepEqual(productionPushCommits(`refs/heads/testing ${sha} refs/heads/entrance-server ${"b".repeat(40)}\n`), [sha]);
  assert.deepEqual(productionPushCommits(`refs/heads/entrance-server ${sha} refs/heads/testing ${"b".repeat(40)}\n`), []);
  assert.deepEqual(productionPushCommits(`(delete) ${"0".repeat(40)} refs/heads/entrance-server ${sha}\n`), []);
  assert.deepEqual(productionPushCommits(`refs/heads/a ${sha} refs/heads/entrance-server ${sha}\nrefs/heads/b ${sha} refs/heads/entrance-server ${sha}\n`), [sha]);
  assert.throws(() => productionPushCommits("malformed"), /Invalid pre-push/);
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
  assert.ok(validator.indexOf('releaseBuildArguments(sha, "customer-validation"') < validator.indexOf('releaseBuildArguments(sha, "web"'));
  assert.ok(validator.indexOf('releaseBuildArguments(sha, "web"') < validator.indexOf('"deploy/customer-docker/smoke.ts"'));
  assert.doesNotMatch(validator, /image.*prune|compose.*down/);
  const docker = readFileSync("deploy/Dockerfile", "utf8");
  assert.equal((docker.match(/RUN bun run check && bun run build:web/g) ?? []).length, 1);
  assert.match(docker, /FROM web-build AS customer-validation/);
  assert.match(docker, /ORYX_CUSTOMER_INSTALL_FIXTURE=container-only node scripts\/customer-install-fixture.ts/);
  const fixture = readFileSync("scripts/customer-install-fixture.ts", "utf8");
  for (const check of ["systemd-analyze", "runuser", "check-nginx.ts", "check-release.ts", "uninstall.ts", "before.equals"]) assert.ok(fixture.includes(check), check);
});
