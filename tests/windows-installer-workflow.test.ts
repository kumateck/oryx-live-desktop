import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const workflow=readFileSync(".github/workflows/deploy-testing.yml","utf8");

test("customer Windows installer is manually dispatched from entrance-server and cannot deploy services", () => {
  assert.match(workflow,/workflow_dispatch:/);
  assert.doesNotMatch(workflow,/^\s+(?:push|pull_request|schedule):/m);
  assert.match(workflow,/if: github.event_name == 'workflow_dispatch' && github.ref == 'refs\/heads\/entrance-server'/);
  assert.match(workflow,/runs-on: windows-latest/);
  assert.match(workflow,/ref: \$\{\{ github.sha \}\}/);
  assert.doesNotMatch(workflow,/ssh-action|scp-action|docker\/|docker (?:run|build|compose)|secrets\./);
});

test("installer reuses the existing x64 maker and publishes only after native installation and launch checks", () => {
  assert.match(workflow,/bun run --filter @oryx\/desktop make:windows/);
  assert.match(workflow,/name: oryx-live-windows-installer\s+path: downloads\/OryxLiveDesktop-Setup.exe\s+if-no-files-found: error/);
  assert.match(workflow,/0x8664/); assert.match(workflow,/Get-FileHash.*SHA256/);
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
