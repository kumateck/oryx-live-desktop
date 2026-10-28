import assert from "node:assert/strict";
import test from "node:test";
import { spawn, spawnSync } from "node:child_process";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

test("Linux flock excludes overlapping deployment processes and releases after process death", { skip: process.platform !== "linux" }, async () => {
  const directory = await mkdtemp(join(tmpdir(), "oryx-lock-test-"));
  const lock = join(directory, "lock"); const ready = join(directory, "ready"); const protectedFile = join(directory, "protected");
  const first = spawn("flock", [lock, process.execPath, "-e", "require('node:fs').writeFileSync(process.argv[1],'ready');setTimeout(()=>{},30000)", ready]);
  const finished = new Promise<void>((resolve, reject) => { first.on("error", reject); first.on("exit", () => resolve()); });
  try {
    let started = false;
    for (let attempt = 0; attempt < 200; attempt += 1) {
      try { await access(ready); started = true; break; } catch { await new Promise((resolve) => setTimeout(resolve, 10)); }
    }
    assert.equal(started, true, "First deployment process must acquire the lock");
    const second = spawnSync("flock", ["-n", "-E", "9", lock, process.execPath, "-e", "require('node:fs').writeFileSync(process.argv[1],'wrong')", protectedFile]);
    assert.equal(second.status, 9);
    const ownerPid = spawnSync("pgrep", ["-P", String(first.pid)], { encoding: "utf8" });
    for (const value of ownerPid.stdout.trim().split(/\s+/)) if (value && Number.isInteger(Number(value))) process.kill(Number(value), "SIGKILL");
    first.kill("SIGKILL"); await finished;
    // flock's parent can exit before the killed child closes its inherited lock descriptor.
    // Keep the overlapping attempt nonblocking; allow bounded kernel teardown for recovery.
    const third = spawnSync("flock", ["-w", "5", "-E", "9", lock, process.execPath, "-e", "require('node:fs').writeFileSync(process.argv[1],'recovered')", protectedFile]);
    assert.equal(third.status, 0); assert.equal(await readFile(protectedFile, "utf8"), "recovered");
  } finally { first.kill("SIGKILL"); await rm(directory, { recursive: true, force: true }); }
});
