import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const pipeline=readFileSync(".github/workflows/customer-docker.yml","utf8");
const workflow=pipeline.slice(pipeline.indexOf("  windows-installer:"), pipeline.indexOf("  testing-desktop-publish:"));

test("Windows builds follow native testing changes or explicit production dispatch and cannot deploy services", () => {
  assert.match(pipeline,/workflow_dispatch:/);
  assert.match(workflow,/needs: \[web, testing-deploy\]/);
  assert.match(workflow,/&& inputs\.build_windows/);
  assert.doesNotMatch(workflow,/^\s+(?:push|pull_request|schedule):/m);
  assert.match(workflow,/github.event_name == 'workflow_dispatch' && github.ref == 'refs\/heads\/entrance-server'/);
  assert.match(workflow, /needs.testing-deploy.outputs.desktop_changed == 'true'/);
  assert.match(workflow, /github.ref == 'refs\/heads\/testing' && needs.testing-deploy.result == 'success'/);
  assert.match(workflow, /always\(\) && needs.web.result == 'success'/);
  assert.match(workflow,/runs-on: windows-latest/);
  assert.match(workflow,/ref: \$\{\{ github.sha \}\}/);
  assert.doesNotMatch(workflow,/ssh-action|scp-action|docker\/|docker (?:run|build|compose)|SSH_HOST|SSH_PRIVATE_KEY|RABBITMQ_PASS/);
});

test("installer reuses the existing maker for a combined x86/x64 installer and publishes only after native installation and launch checks", () => {
  assert.match(workflow,/bun run --filter @oryx\/desktop make:windows/);
  assert.match(workflow,/name: oryx-live-windows-installer\s+path: downloads\/OryxLiveDesktop-Setup.exe\s+if-no-files-found: error/);
  assert.match(workflow,/0x14c/); assert.match(workflow,/win-ia32-unpacked/); assert.match(workflow,/0x8664/); assert.match(workflow,/Get-FileHash.*SHA256/);
  assert.match(workflow,/ArgumentList '\/S' -Wait -PassThru/);
  assert.match(workflow,/Connect to Oryx/); assert.match(workflow,/Oryx installer smoke site/);
  assert.match(workflow,/ORYX Companion/); assert.match(workflow,/Missing shortcut/);
  assert.ok(workflow.indexOf("Launch 'connected'")<workflow.indexOf("name: oryx-live-windows-installer"));
});

test("connected installer smoke uses a loopback fixture on customer frontend port 3001", () => {
  const fixture=readFileSync("scripts/windows-installer-site.ts","utf8");
  assert.match(fixture,/listen\(3001, "127.0.0.1"\)/);
  assert.match(fixture,/application-name.*Oryx Live/);
  assert.match(workflow,/site-url.txt.*http:\/\/127.0.0.1:3001/);
  assert.doesNotMatch(fixture+workflow,/164\.90\.|oryx_api|SSH_HOST|:8080|:3000/);
  assert.match(readFileSync("apps/desktop/forge.config.ts","utf8"),/companion_window/);
  assert.match(readFileSync("apps/desktop/electron-builder.config.cjs","utf8"),/createDesktopShortcut: "always"/);
});

test("the main command packages both architectures with the same ia32-capable Electron runtime", () => {
  const command = readFileSync("scripts/make-windows.ts", "utf8");
  const builder = readFileSync("apps/desktop/electron-builder.config.cjs", "utf8");
  const forge = readFileSync("apps/desktop/forge.config.ts", "utf8");
  assert.match(command, /index < 0 \? "universal"/);
  assert.match(command, /arch === "universal" \? \["--ia32", "--x64"\]/);
  assert.match(builder, /: \["ia32", "x64"\]/);
  const runtime = /electronVersion: "([^"]+)"/.exec(builder)?.[1];
  assert.ok(runtime?.startsWith("43."), "Electron 44 removed Windows ia32");
  assert.equal(/electronVersion: "([^"]+)"/.exec(forge)?.[1], runtime);
  assert.match(workflow, /Launch 'x86-runtime'/);
  assert.ok(workflow.indexOf("bun scripts/windows-update-smoke.ts") < workflow.indexOf("name: oryx-live-windows-installer"));
});

test("signing is validated before packaging and failed installed-upgrade diagnostics remain downloadable", () => {
  assert.ok(workflow.indexOf("bun scripts/check-desktop-signing.ts") < workflow.indexOf("bun run --filter @oryx/desktop make:windows"));
  assert.match(workflow, /steps\.signing\.outputs\.configured == 'true'/);
  assert.match(workflow, /Tee-Object -FilePath 'shots\/update-smoke.log'/);
  assert.match(workflow, /\$LASTEXITCODE -ne 0/);
  assert.match(workflow, /if: always\(\)\s+with:\s+name: oryx-live-windows-smoke/);
  const smoke = readFileSync("scripts/windows-update-smoke.ts", "utf8");
  assert.match(smoke, /unsaved-work installation refusal/);
  assert.match(smoke, /30_000/);
});
