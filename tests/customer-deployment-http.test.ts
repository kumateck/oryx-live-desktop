import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { DeploymentAgent } from "../deploy/customer-server/agent.ts";
import { currentCommit } from "../deploy/customer-server/state.ts";
import { backend, deploymentFixture, firstSha } from "./customer-deployment-fixture.ts";

test("activation verifies the release through a real HTTP origin and existing API proxy", async () => {
  const fixture = await deploymentFixture();
  const server = createServer((request, response) => {
    void (async () => {
      const path = new URL(request.url ?? "/", "http://localhost").pathname;
      if (path === "/swagger/v1/swagger.json") { response.setHeader("Content-Type", "application/json"); response.end(JSON.stringify(backend)); return; }
      if (path === "/api/v1/user/authenticated") { response.writeHead(401); response.end(); return; }
      const active = await currentCommit(fixture.config); if (!active) { response.writeHead(503); response.end(); return; }
      const bytes = await readFile(join(fixture.config.root, "releases", active, path.slice(1)));
      response.setHeader("Content-Length", bytes.length); response.setHeader("Content-Type", path.endsWith(".json") ? "application/json" : path.endsWith(".html") ? "text/html" : "application/octet-stream");
      response.end(request.method === "HEAD" ? undefined : bytes);
    })().catch(() => { response.writeHead(404); response.end(); });
  });
  try {
    await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
    const address = server.address(); if (!address || typeof address === "string") throw new Error("Expected a local test listener");
    const site = `http://127.0.0.1:${address.port}`;
    const agent = new DeploymentAgent({ ...fixture.config, site, api: site }, { ...fixture.dependencies, fetch });
    await agent.poll(); assert.equal(await currentCommit(fixture.config), firstSha);
  } finally { await new Promise<void>((resolve) => server.close(() => resolve())); await fixture.cleanup(); }
});
