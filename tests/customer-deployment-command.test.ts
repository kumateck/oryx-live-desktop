import assert from "node:assert/strict";
import test from "node:test";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { commandRunner } from "../deploy/customer-server/command.ts";
import { deploymentFixture } from "./customer-deployment-fixture.ts";

test("the real command runner captures status, protects build logs and terminates stalled child groups", async () => {
  const fixture = await deploymentFixture();
  try {
    await fixture.agent.initialize();
    const run = commandRunner(fixture.config);
    assert.equal(await run({ executable: process.execPath, args: ["-e", "process.stdout.write(process.env.CI+':'+process.env.HUSKY)"] }), "1:0");
    await assert.rejects(run({ executable: process.execPath, args: ["-e", "process.exit(23)"] }), /exited 23/);
    const log = join(fixture.config.state, "logs/command-test.log");
    await run({ executable: process.execPath, args: ["-e", "console.log('build result')"], log });
    assert.match(await readFile(log, "utf8"), /build result/); assert.equal((await stat(log)).mode & 0o777, 0o600);
    const short = commandRunner({ ...fixture.config, commandTimeoutMs: 100 });
    await assert.rejects(short({ executable: process.execPath, args: ["-e", "setTimeout(()=>{},30000)"] }), /without a status/);
  } finally { await fixture.cleanup(); }
});
