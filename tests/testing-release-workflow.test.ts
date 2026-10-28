import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { desktopInput, changedDesktopInputs, publishedDesktopSource } from "../scripts/testing-desktop-changes.ts";

const workflow = readFileSync(".github/workflows/customer-docker.yml", "utf8");
const images = workflow.slice(workflow.indexOf("  testing-images:"), workflow.indexOf("  testing-deploy:"));
const deploy = workflow.slice(workflow.indexOf("  testing-deploy:"), workflow.indexOf("  windows-installer:"));
const publish = workflow.slice(workflow.indexOf("  testing-desktop-publish:"));
const published = deploy.slice(deploy.indexOf("      - name: Read verified desktop publication"));

export function remoteScript(job: string): string {
  const lines = job.slice(job.indexOf("          script: |\n") + "          script: |\n".length).trimEnd().split("\n");
  const end = lines.findIndex((line) => line.trim() && !line.startsWith("            "));
  return (end < 0 ? lines : lines.slice(0, end)).map((line) => line.slice(12)).join("\n") + "\n";
}

test("web-only changes do not request a desktop installer", () => {
  for (const path of ["apps/web/src/modules/activities/components/final-packing.tsx", "apps/web/package.json", "apps/gateway/src/main.ts", "bun.lock", "assets/login-side.jpg", "assets/company-logo.png", "docs/deployment.md", ".github/workflows/customer-docker.yml", "deploy/Dockerfile"]) {
    assert.equal(desktopInput(path), false, path);
  }
  for (const path of ["apps/desktop/src/main.ts", "apps/desktop/package.json", "apps/desktop/electron-builder.config.cjs", "apps/desktop/build/icon.ico", "assets/oryx-wordmark.svg", "shared/desktop-updates.ts", "shared/alert-priority.ts", "shared/companion.ts", "scripts/make-windows.ts", "scripts/windows-update-smoke.ts"]) {
    assert.equal(desktopInput(path), true, path);
  }
  assert.throws(() => changedDesktopInputs("testing", "main"), /full Git commit SHAs/);
  assert.match(workflow, /fetch-depth: 0/);
  assert.match(workflow, /DESKTOP_PUBLISHED_OUTPUT: \$\{\{ steps.desktop_source.outputs.stdout \}\}/);
});

test("an unpublished desktop release is built even after successful web-only pushes", () => {
  const calls: string[][] = [];
  const paths = changedDesktopInputs("", "a".repeat(40), (args) => {
    calls.push(args);
    return "apps/web/src/page.tsx\0apps/desktop/src/main.ts\0apps/desktop/package.json\0";
  });
  assert.deepEqual(paths, ["apps/desktop/src/main.ts", "apps/desktop/package.json"]);
  assert.deepEqual(calls, [["ls-tree", "-r", "--name-only", "-z", "a".repeat(40)]]);
  assert.doesNotMatch(readFileSync("scripts/testing-desktop-changes.ts", "utf8"), /workflow_runs|event.before|rev-list/);
});

test("only changes since the actual published desktop source require another installer", () => {
  const base = "b".repeat(40); const head = "a".repeat(40);
  const paths = changedDesktopInputs(base, head, (args) => {
    assert.deepEqual(args, ["diff", "--name-only", "--no-renames", "-z", base, head]);
    return "apps/web/src/page.tsx\0apps/desktop/src/main.ts\0";
  });
  assert.deepEqual(paths, ["apps/desktop/src/main.ts"]);
  assert.deepEqual(changedDesktopInputs(base, head, () => "apps/web/src/page.tsx\0bun.lock\0"), []);
  assert.throws(() => changedDesktopInputs("0".repeat(40), head), /full Git commit SHAs/);
  assert.match(workflow, /needs.testing-deploy.outputs.desktop_changed == 'true'/);
  assert.match(deploy, /capture_stdout: true/);
});

test("SSH status messages cannot become a desktop source or silently skip the first release", () => {
  const sha = "a".repeat(40);
  const framed = (value: string) => `CLI status\nORYX_DESKTOP_PUBLISHED_SHA=${value}\n===============================================\n✅ Successfully executed commands to all hosts.\n`;
  assert.equal(publishedDesktopSource(framed(sha)), sha);
  assert.equal(publishedDesktopSource(framed("none")), "");
  assert.equal(publishedDesktopSource(`out: ORYX_DESKTOP_PUBLISHED_SHA=${sha}\r\n`), sha);
  for (const invalid of ["", "CLI succeeded", framed("invalid"), framed(sha) + framed("none")]) {
    assert.throws(() => publishedDesktopSource(invalid), /Missing or ambiguous/);
  }
});

test("only testing pushes or explicit testing dispatch publish images and activate the demo", () => {
  for (const job of [images, deploy]) {
    assert.match(job, /if: github.ref == 'refs\/heads\/testing' && \(github.event_name == 'push' \|\| \(github.event_name == 'workflow_dispatch' && inputs.deploy_testing\)\)/);
  }
  assert.match(images, /needs: web/);
  assert.match(deploy, /needs: testing-images/);
  assert.match(images, /RELEASE_SHA=\$\{\{ github.sha \}\}/);
  assert.match(images, /RELEASE_BRANCH=testing/);
  assert.equal((images.match(/platforms: linux\/amd64/g) ?? []).length, 2);
  assert.match(deploy, /-p 3011:80/);
  assert.doesNotMatch(deploy, /3000|3001|oryx_api|compose.*down|docker (?:image|system) prune/);
  assert.match(deploy, /m.commit!==sha\|\|m.branch!=="testing"/);
  assert.match(deploy, /Wrong content for/);
  assert.ok(deploy.indexOf('"container:$CANDIDATE"') < deploy.indexOf('docker stop "$OLD_WEB"'));
  assert.match(deploy, /docker rename "\$OLD_WEB" "\$WEB" && docker start "\$WEB"/);
});

test("desktop publication waits for installed smoke tests and publishes immutable payloads before the signed feed", () => {
  assert.match(publish, /needs: \[testing-deploy, windows-installer\]/);
  assert.match(publish, /if: github.ref == 'refs\/heads\/testing'/);
  assert.match(publish, /name: oryx-live-windows-installer/);
  assert.match(publish, /needs.windows-installer.outputs.signed == 'true'/);
  assert.match(publish, /strip_components: 1/);
  assert.ok(publish.indexOf('mv "$target.pending-$TAG" "$target"') < publish.indexOf('"$public/desktop/windows/latest.json"'));
  assert.match(publish, /cmp .*OryxLiveDesktop-Setup.exe/);
  assert.match(publish, /bump apps\/desktop\/package.json/);
  assert.ok(publish.indexOf('"$public/OryxLiveDesktop-Setup.exe"\n') < publish.indexOf('> "$HOME/oryx-live/desktop-release.sha.pending-$TAG"'));
});

test("the desktop source record is trusted only while its actual installer still matches", () => {
  for (const scenario of ["legacy", "published", "corrupt", "invalid", "missing"]) {
    const directory = mkdtempSync(join(tmpdir(), "oryx-desktop-source-"));
    try {
      const root = join(directory, "oryx-live"); const installer = join(root, "downloads/OryxLiveDesktop-Setup.exe");
      mkdirSync(join(root, "downloads"), { recursive: true });
      const sha = "a".repeat(40); const digest = createHash("sha256").update("installer").digest("hex");
      if (scenario !== "missing") writeFileSync(installer, scenario === "corrupt" ? "different-installer" : "installer");
      if (scenario !== "legacy") writeFileSync(join(root, "desktop-release.sha"), scenario === "invalid" ? "invalid record\n" : `${sha} ${digest}\n`);
      const result = spawnSync("sh", ["-s"], { input: remoteScript(published), encoding: "utf8", env: { ...process.env, HOME: directory } });
      assert.equal(result.status === 0, !["corrupt", "invalid"].includes(scenario), result.stderr);
      if (result.status === 0) assert.equal(publishedDesktopSource(result.stdout), scenario === "published" ? sha : "");
    } finally { rmSync(directory, { recursive: true, force: true }); }
  }
});

test("all remote scripts have valid POSIX shell syntax", () => {
  for (const job of [deploy, published, publish]) {
    const result = spawnSync("sh", ["-n"], { input: remoteScript(job), encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  }
});

test("the real release probe accepts protected APIs but rejects stale metadata and broken connectivity", async () => {
  const probe = /RELEASE_OK='([^']+)'/.exec(deploy)?.[1];
  assert.ok(probe);
  const sha = "a".repeat(40);
  let marker = JSON.stringify({ commit: sha, branch: "testing" });
  let apiStatus = 401;
  const server = createServer((request, response) => {
    if (request.url === "/api/v1/user/authenticated") response.writeHead(apiStatus).end();
    else if (request.url === "/deployment.json") response.end(marker);
    else if (request.url === "/healthz") response.end("ok");
    else response.writeHead(404).end();
  });
  await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const run = () => new Promise<number | null>((resolve, reject) => {
      const child = spawn(process.execPath, ["--input-type=module", "-e", probe, `http://127.0.0.1:${address.port}`, sha], { stdio: "ignore" });
      child.once("error", reject); child.once("exit", resolve);
    });
    assert.equal(await run(), 0);
    apiStatus = 403; assert.equal(await run(), 0);
    apiStatus = 502; assert.notEqual(await run(), 0);
    apiStatus = 401; marker = JSON.stringify({ commit: "unversioned", branch: "testing" }); assert.notEqual(await run(), 0);
    marker = JSON.stringify({ commit: sha, branch: "entrance-server" }); assert.notEqual(await run(), 0);
    marker = "not-json"; assert.notEqual(await run(), 0);
  } finally { await new Promise<void>((resolve) => server.close(() => resolve())); }
});

test("testing activation preserves unrelated services and restores the working web on every failed gate", () => {
  for (const failure of ["", "pull", "backend", "candidate", "rename", "activation", "health", "assets"]) {
    const directory = mkdtempSync(join(tmpdir(), "oryx-testing-deploy-"));
    try {
      const bin = join(directory, "bin"); mkdirSync(bin);
      const state = join(directory, "state");
      writeFileSync(state, "oryx-live-web|old\noryx-live-gateway|old\noryx_api|untouched\noryx-next|untouched\ndatabase|untouched\n");
      for (const command of ["docker", "curl"]) {
        writeFileSync(join(bin, command), `#!/bin/sh\nexec "$ORYX_FIXTURE_NODE" "$ORYX_FIXTURE_PATH" ${command} "$@"\n`, { mode: 0o755 });
      }
      writeFileSync(join(bin, "sleep"), "#!/bin/sh\nexit 0\n", { mode: 0o755 });
      writeFileSync(join(bin, "seq"), "#!/bin/sh\necho 1\n", { mode: 0o755 });
      const result = spawnSync("sh", ["-s"], {
        input: remoteScript(deploy), encoding: "utf8", timeout: 30_000,
        env: { ...process.env, HOME: directory, PATH: `${bin}:${process.env.PATH ?? ""}`, TAG: "a".repeat(40),
          REGISTRY_USER: "fixture", REGISTRY_TOKEN: "fixture-token", RABBITMQ_HOST: "broker:5672", RABBITMQ_PASS: "fixture-pass",
          ORYX_TESTING_STATE: state, ORYX_TESTING_FAIL: failure, ORYX_FIXTURE_NODE: process.execPath,
          ORYX_FIXTURE_PATH: resolve("tests/testing-release-fixture.ts") },
      });
      assert.equal(result.status === 0, !failure, `${failure}: ${result.stdout}\n${result.stderr}`);
      const remaining = readFileSync(state, "utf8");
      for (const service of ["oryx_api", "oryx-next", "database"]) assert.ok(remaining.includes(`${service}|untouched`), `${failure}: ${service}`);
      for (const service of ["oryx-live-web", "oryx-live-gateway"]) assert.ok(remaining.includes(`${service}|${failure ? "old" : "new"}`), `${failure}: ${remaining}`);
      assert.doesNotMatch(remaining, /candidate-|previous-/);
    } finally { rmSync(directory, { recursive: true, force: true }); }
  }
});

test("desktop publication preserves an unsigned feed and rejects a changed immutable version", () => {
  for (const scenario of ["unsigned", "signed", "conflict", "retry"]) {
    const directory = mkdtempSync(join(tmpdir(), "oryx-testing-desktop-"));
    try {
      const sha = "a".repeat(40);
      const stage = join(directory, "oryx-live", `desktop-staging-${sha}`, "downloads");
      const publicPath = join(directory, "oryx-live", "downloads");
      const payload = join(publicPath, "desktop/windows/0.3.0/OryxLiveDesktop-Setup.exe");
      const feed = join(publicPath, "desktop/windows/latest.json");
      mkdirSync(stage, { recursive: true }); mkdirSync(join(publicPath, "desktop/windows"), { recursive: true });
      writeFileSync(join(stage, "OryxLiveDesktop-Setup.exe"), "new-installer");
      writeFileSync(join(publicPath, "OryxLiveDesktop-Setup.exe"), "old-installer");
      writeFileSync(feed, "old-feed");
      const record = join(directory, "oryx-live/desktop-release.sha");
      writeFileSync(record, "previous-publication\n");
      if (scenario !== "unsigned") {
        mkdirSync(join(stage, "desktop/windows/0.3.0"), { recursive: true, mode: 0o700 });
        writeFileSync(join(stage, "desktop/windows/0.3.0/OryxLiveDesktop-Setup.exe"), "new-installer", { mode: 0o600 });
        writeFileSync(join(stage, "desktop/windows/latest.json"), "signed-new-feed", { mode: 0o600 });
      }
      if (scenario === "conflict" || scenario === "retry") {
        mkdirSync(join(publicPath, "desktop/windows/0.3.0"));
        writeFileSync(payload, scenario === "retry" ? "new-installer" : "immutable-old-installer");
      }
      const result = spawnSync("sh", ["-s"], { input: `umask 077\n${remoteScript(publish)}`, encoding: "utf8", env: { ...process.env, HOME: directory, TAG: sha } });
      assert.equal(result.status === 0, scenario !== "conflict", result.stdout + result.stderr);
      assert.equal(readFileSync(feed, "utf8"), ["signed", "retry"].includes(scenario) ? "signed-new-feed" : "old-feed");
      assert.equal(readFileSync(join(publicPath, "OryxLiveDesktop-Setup.exe"), "utf8"), scenario === "conflict" ? "old-installer" : "new-installer");
      if (scenario === "conflict") assert.equal(readFileSync(record, "utf8"), "previous-publication\n");
      else {
        const digest = createHash("sha256").update("new-installer").digest("hex");
        assert.equal(readFileSync(record, "utf8"), `${sha} ${digest}\n`);
        assert.equal(statSync(record).mode & 0o777, 0o600);
        assert.equal(readFileSync(join(publicPath, "OryxLiveDesktop-Setup.exe.sha256"), "utf8"), `${digest}  OryxLiveDesktop-Setup.exe\n`);
      }
      if (scenario === "signed") {
        assert.equal(statSync(payload).mode & 0o777, 0o644);
        assert.equal(statSync(join(publicPath, "desktop/windows/0.3.0")).mode & 0o777, 0o755);
        assert.equal(statSync(feed).mode & 0o777, 0o644);
      }
      if (scenario !== "conflict") assert.equal(existsSync(stage), false);
    } finally { rmSync(directory, { recursive: true, force: true }); }
  }
});
