import assert from "node:assert/strict";
import test from "node:test";
import { access, mkdir, readFile, stat, utimes, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { atomicWrite, contractDigest } from "../deploy/customer-server/data.ts";
import { readConfig } from "../deploy/customer-server/config.ts";
import { activate, checkCompatibility, compatibility, readRelease } from "../deploy/customer-server/release.ts";
import { currentCommit, loadState, saveState } from "../deploy/customer-server/state.ts";
import { nginxConfiguration } from "../deploy/customer-server/nginx.ts";
import { backend, deploymentFixture, firstSha, secondSha, thirdSha } from "./customer-deployment-fixture.ts";

test("publishes the exact branch SHA, verifies it, and does not rebuild an unchanged commit", async () => {
  const fixture = await deploymentFixture();
  try {
    await fixture.agent.poll();
    assert.equal(await currentCommit(fixture.config), firstSha);
    const state = await loadState(fixture.config); assert.equal(state.active, firstSha); assert.equal(state.flight, null);
    assert.equal((await stat(join(fixture.config.root, "current"))).mode & 0o777, 0o755);
    assert.equal((await stat(join(fixture.config.root, "current/deployment.json"))).mode & 0o777, 0o644);
    assert.ok(fixture.simulation.commands.some((command) => command.args.includes("--frozen-lockfile")));
    assert.ok(fixture.simulation.commands.some((command) => command.args.includes(`refs/heads/entrance-server:refs/remotes/origin/entrance-server`)));
    const builds = fixture.simulation.commands.filter((command) => command.args.join(" ") === "run build:web").length;
    await fixture.agent.poll();
    assert.equal(fixture.simulation.commands.filter((command) => command.args.join(" ") === "run build:web").length, builds);
  } finally { await fixture.cleanup(); }
});

test("failed checks keep the active release, back off and quarantine repeated failures until authorized retry", async () => {
  const fixture = await deploymentFixture();
  try {
    await fixture.agent.poll(); fixture.simulation.sha = secondSha; fixture.simulation.failBuild = true;
    for (let attempt = 0; attempt < 3; attempt += 1) { await assert.rejects(fixture.agent.poll(), /quality check/); fixture.advance(3600_000); }
    assert.equal(await currentCommit(fixture.config), firstSha);
    const count = fixture.simulation.commands.length; await fixture.agent.poll();
    assert.equal(fixture.simulation.commands.slice(count).filter((command) => command.executable === fixture.config.bun).length, 0);
    await fixture.agent.control("retry", secondSha); fixture.simulation.failBuild = false; await fixture.agent.poll();
    assert.equal(await currentCommit(fixture.config), secondSha);
  } finally { await fixture.cleanup(); }
});

test("failed HTTP verification restores the previous symlink and retains previous chunks and viewers", async () => {
  const fixture = await deploymentFixture();
  try {
    await fixture.agent.poll(); fixture.simulation.sha = secondSha; fixture.simulation.failedHealth = secondSha;
    await assert.rejects(fixture.agent.poll(), /selected release SHA/);
    assert.equal(await currentCommit(fixture.config), firstSha);
    await access(join(fixture.config.root, "shared/assets", `app-${firstSha}.js`));
    await access(join(fixture.config.root, "shared/viewers/wordcraft-pinned/dodo-wordcraft_bg.wasm"));
    assert.equal((await loadState(fixture.config)).flight, null);
  } finally { await fixture.cleanup(); }
});

test("recovers an interrupted activation before considering another deployment", async () => {
  const fixture = await deploymentFixture();
  try {
    await fixture.agent.poll(); fixture.simulation.sha = secondSha; await fixture.agent.poll();
    const state = await loadState(fixture.config);
    state.active = firstSha; state.previous = null; state.flight = { sha: secondSha, previous: firstSha, branch: fixture.config.branch, phase: "verifying", worktree: null };
    await saveState(fixture.config, state); // Simulate power loss after switching current but before confirmation.
    await fixture.agent.poll();
    assert.equal(await currentCommit(fixture.config), firstSha);
    assert.equal((await loadState(fixture.config)).failures[`entrance-server:${secondSha}`]?.attempts, 1);
  } finally { await fixture.cleanup(); }
});

test("operator rollback pauses automatic reactivation, and resume and branch switching remain explicit", async () => {
  const fixture = await deploymentFixture();
  try {
    await fixture.agent.poll(); fixture.simulation.sha = secondSha; await fixture.agent.poll();
    await fixture.agent.control("rollback"); await fixture.agent.poll();
    assert.equal(await currentCommit(fixture.config), firstSha); assert.equal((await loadState(fixture.config)).paused, true);
    fixture.simulation.sha = thirdSha; const alternate = fixture.withConfig({ branch: "other-customer" });
    await alternate.control("resume"); await alternate.poll();
    assert.equal(await currentCommit(fixture.config), thirdSha); assert.equal((await loadState(fixture.config)).branch, "other-customer");
  } finally { await fixture.cleanup(); }
});

test("temporary GitHub outages preserve the release and retry when connectivity returns", async () => {
  const fixture = await deploymentFixture();
  try {
    await fixture.agent.poll(); fixture.simulation.offline = true; await assert.rejects(fixture.agent.poll(), /GitHub/);
    assert.equal(await currentCommit(fixture.config), firstSha);
    fixture.simulation.offline = false; fixture.simulation.sha = secondSha; fixture.advance(3600_000); await fixture.agent.poll();
    assert.equal(await currentCommit(fixture.config), secondSha);
  } finally { await fixture.cleanup(); }
});

test("incompatible backends and damaged viewer artifacts cannot activate", async () => {
  const fixture = await deploymentFixture();
  try {
    fixture.simulation.incompatible = true; await assert.rejects(fixture.agent.poll(), /contract/); assert.equal(await currentCommit(fixture.config), null);
    fixture.simulation.incompatible = false; fixture.simulation.corruptViewer = true; fixture.simulation.sha = secondSha;
    await assert.rejects(fixture.agent.poll(), /Invalid wordcraft/); assert.equal(await currentCommit(fixture.config), null);
  } finally { await fixture.cleanup(); }
});

test("detects tampered immutable releases before operator rollback", async () => {
  const fixture = await deploymentFixture();
  try {
    await fixture.agent.poll(); fixture.simulation.sha = secondSha; await fixture.agent.poll();
    await writeFile(join(fixture.config.root, "releases", firstSha, "assets", `app-${firstSha}.js`), "tampered");
    await assert.rejects(fixture.agent.control("rollback", firstSha), /integrity/); assert.equal(await currentCommit(fixture.config), secondSha);
  } finally { await fixture.cleanup(); }
});

test("a deployment never overwrites permanent customer connection configuration", async () => {
  const fixture = await deploymentFixture();
  try {
    const customerEnv = join(fixture.config.state, "customer.env"); await mkdir(fixture.config.state, { recursive: true });
    await atomicWrite(customerEnv, "ORYX_API_ORIGIN=http://existing-backend:8086\n");
    await fixture.agent.poll();
    assert.equal(await readFile(customerEnv, "utf8"), "ORYX_API_ORIGIN=http://existing-backend:8086\n");
    assert.equal((await readRelease(fixture.config, firstSha)).sha, firstSha);
  } finally { await fixture.cleanup(); }
});

test("recovers interrupted builds and discards unpublished staging without touching the active release", async () => {
  const fixture = await deploymentFixture();
  try {
    await fixture.agent.poll();
    const worktree = join(fixture.config.state, "worktrees/build-interrupted"); await mkdir(worktree);
    const stage = join(fixture.config.root, "releases/.stage-interrupted"); await mkdir(stage);
    const state = await loadState(fixture.config);
    state.flight = { sha: secondSha, previous: firstSha, branch: fixture.config.branch, phase: "building", worktree };
    await saveState(fixture.config, state); await fixture.agent.poll();
    assert.equal(await currentCommit(fixture.config), firstSha);
    await assert.rejects(access(worktree)); await assert.rejects(access(stage));
  } finally { await fixture.cleanup(); }
});

test("retention protects active and previous releases while pruning expired unreferenced assets", async () => {
  const fixture = await deploymentFixture();
  try {
    await fixture.agent.poll();
    const oldAsset = join(fixture.config.root, "shared/assets", `app-${firstSha}.js`);
    const oldLog = join(fixture.config.state, "logs", `${firstSha}.log`); await writeFile(oldLog, "old build log");
    const oldTime = new Date(Date.UTC(2026, 9, 26)); await utimes(oldAsset, oldTime, oldTime); await utimes(oldLog, oldTime, oldTime);
    fixture.simulation.sha = secondSha; await fixture.agent.poll(); fixture.advance(45 * 86400_000);
    fixture.simulation.sha = thirdSha; await fixture.agent.poll();
    await assert.rejects(access(join(fixture.config.root, "releases", firstSha)));
    await assert.rejects(access(oldAsset)); await assert.rejects(access(oldLog));
    await access(join(fixture.config.root, "releases", secondSha)); await access(join(fixture.config.root, "releases", thirdSha));
    await access(join(fixture.config.root, "shared/viewers/wordcraft-pinned/dodo-wordcraft_bg.wasm"));
  } finally { await fixture.cleanup(); }
});

test("validates deployment configuration, compatibility and separate API proxy settings", () => {
  const config = readConfig({ ORYX_SITE_URL: "http://oryx.local", ORYX_API_ORIGIN: "http://127.0.0.1:8086" });
  assert.equal(config.branch, "entrance-server");
  assert.throws(() => readConfig({ ORYX_SITE_URL: "http://user:secret@oryx.local", ORYX_API_ORIGIN: config.api }), /origin/);
  assert.throws(() => readConfig({ ORYX_SITE_URL: config.site, ORYX_API_ORIGIN: config.api, ORYX_DEPLOY_BRANCH: "--upload-pack=evil" }), /branch/);
  const policy = compatibility({ deploymentProtocol: 1, minimumShellVersion: "9.0.0", backendContracts: [contractDigest(backend)] });
  assert.throws(() => checkCompatibility(config, policy, contractDigest(backend)), /shell/);
  const nginx = nginxConfiguration(config, {});
  assert.ok(nginx.includes("proxy_pass http://127.0.0.1:8086;"));
  assert.ok(nginx.includes("try_files $uri /index.html"));
  assert.ok(nginx.includes("location /viewers/"));
  assert.ok(nginx.includes("proxy_ssl_verify on"));
});
