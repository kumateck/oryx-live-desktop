import assert from "node:assert/strict";
import { mkdtemp, copyFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { checked, run } from "./command.ts";
import { verifyProbePermissions } from "./probe-permissions-smoke.ts";

const image = process.argv[2] ?? "";
if (!image || !/^[a-zA-Z0-9./:_-]+$/.test(image)) throw new Error("Pass the local image tag to smoke.ts");
const prefix = `oryx-live-smoke-${randomUUID()}`;
const network = `${prefix}-net`; const volume = `${prefix}-assets`; const api = `${prefix}-api`; const web = `${prefix}-web`; const connected = `${prefix}-connected`;
const downloads = `${prefix}-downloads`;
const directory = await mkdtemp(join(tmpdir(), "oryx-docker-smoke-"));
const docker = (args: string[]) => checked(run, { executable: "docker", args });
const wait = () => new Promise<void>((resolve) => setTimeout(resolve, 500));
async function start(name: string, gateway = "") {
  await docker(["run", "--detach", "--name", name, "--network", network, "--publish", "127.0.0.1::80", "--mount", `type=volume,src=${volume},dst=/srv/assets`,
    "--mount", `type=volume,src=${downloads},dst=/srv/downloads,readonly`,
    "--env", "ORYX_API_ORIGIN=http://fixture-api:5001", "--env", `ORYX_GATEWAY_UPSTREAM=${gateway ? "fixture-api:5001" : "disabled.invalid:4100"}`, image]);
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (await docker(["inspect", "--format", "{{.State.Health.Status}}", name]) === "healthy") {
      const port = (await docker(["port", name, "80/tcp"])).split(":").at(-1);
      assert.match(port ?? "", /^\d+$/); return `http://127.0.0.1:${port}`;
    }
    await wait();
  }
  throw new Error(`Smoke container did not become healthy: ${await docker(["logs", name])}`);
}
try {
  await copyFile(resolve("deploy/customer-docker/mock-api.ts"), join(directory, "mock-api.ts"));
  await copyFile(resolve("contracts/openapi/backend.v1.json"), join(directory, "backend.json"));
  await docker(["network", "create", network]); await docker(["volume", "create", volume]); await docker(["volume", "create", downloads]);
  await docker(["run", "--detach", "--name", api, "--network", network, "--network-alias", "fixture-api", "--mount", `type=bind,src=${directory},dst=/fixtures,readonly`,
    "node:24.22.1-bookworm-slim", "node", "/fixtures/mock-api.ts"]);
  await docker(["run", "--rm", "--mount", `type=volume,src=${volume},dst=/srv/assets`, "--entrypoint", "sh", image, "-c", "mkdir -p /srv/assets; printf '/* retained previous release */' > /srv/assets/previous-deadbeef.js"]);
  await docker(["run", "--rm", "--mount", `type=volume,src=${downloads},dst=/srv/downloads`, "--entrypoint", "sh", image, "-c",
    "mkdir -p /srv/downloads/desktop/windows/0.2.0; printf 'fixture signed envelope' > /srv/downloads/desktop/windows/latest.json; printf 'MZ fixture installer' > /srv/downloads/desktop/windows/0.2.0/OryxLiveDesktop-Setup.exe; chmod -R a+rX /srv/downloads"]);
  const base = await start(web);
  await docker(["exec", web, "nginx", "-t"]);
  const version = await fetch(`${base}/deployment.json`); assert.equal(version.status, 200); assert.equal(version.headers.get("cache-control"), "no-store");
  const metadata: { backendContracts?: string[] } = await version.clone().json();
  assert.equal(Object.hasOwn(metadata, "backendContracts"), false);
  const marker: { commit: string; criticalAssets: string[] } = await version.json();
  assert.match(marker.commit, /^[a-f0-9]{40}$/);
  assert.equal((await fetch(`${base}/healthz`)).status, 200);
  assert.match(await (await fetch(`${base}/production/activities/fixture/board`)).text(), /name="application-name" content="Oryx Live"/);
  assert.equal((await fetch(`${base}/assets/missing.js`)).status, 404);
  assert.equal((await fetch(`${base}/viewers/missing.wasm`)).status, 404);
  assert.equal((await fetch(`${base}/.assets-manifest.json`)).status, 403);
  const feed = await fetch(`${base}/downloads/desktop/windows/latest.json`);
  assert.equal(feed.status, 200); assert.equal(await feed.text(), "fixture signed envelope");
  assert.match(feed.headers.get("cache-control") ?? "", /no-cache/);
  assert.equal(await (await fetch(`${base}/downloads/desktop/windows/0.2.0/OryxLiveDesktop-Setup.exe`)).text(), "MZ fixture installer");
  assert.equal((await fetch(`${base}/downloads/missing-installer.exe`)).status, 404);
  assert.notEqual((await run({ executable: "docker", args: ["exec", web, "touch", "/srv/downloads/must-remain-readonly"] })).code, 0);
  assert.equal(await (await fetch(`${base}/assets/previous-deadbeef.js`)).text(), "/* retained previous release */");
  for (const asset of marker.criticalAssets) {
    const response = await fetch(`${base}${asset}`); assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control") ?? "", /immutable/); assert.notEqual(response.headers.get("content-type"), "text/html");
  }
  const proxy = await fetch(`${base}/api/echo?keep=path`, { headers: { Authorization: "Bearer fixture-only" } });
  const echoed: { url: string; authorization: string; proto: string } = await proxy.json();
  assert.equal(echoed.url, "/api/echo?keep=path"); assert.equal(echoed.authorization, "Bearer fixture-only"); assert.equal(echoed.proto, "http");
  assert.equal((await fetch(`${base}/api/v1/user/authenticated`)).status, 401);
  // Exercise actual TypeScript probe entrypoints without the customer's sail network or host services.
  const probe = async (mode: string, origin: string, probeNetwork: string) => docker([
    "run", "--rm", "--read-only", "--user", "node", "--cap-drop", "ALL", "--security-opt", "no-new-privileges:true", "--network", probeNetwork,
    "--mount", `type=bind,src=${resolve(".")},dst=/repo,readonly`, "node:24.22.1-bookworm-slim",
    "node", "/repo/deploy/customer-docker/probe.ts", mode, origin, "0.1.0", "/repo/deploy/customer-docker/requirements.json", "1",
    "/repo/contracts/openapi/backend.v1.json",
  ]);
  assert.match(await probe("api", "http://fixture-api:5001", network), /API connectivity/);
  assert.match(await probe("compatibility", "http://127.0.0.1:5001", `container:${api}`), /Critical API contracts verified/);
  assert.match(await probe("compatibility", "http://127.0.0.1:1", `container:${api}`), /no confirmed breaking changes/);
  await verifyProbePermissions(api, network);

  assert.equal((await fetch(`${base}/realtime/health`)).status, 503);
  await docker(["exec", web, "sh", "-c", "test ! -d /app && ! command -v node && ! command -v bun && test ! -e /usr/share/nginx/html/.env"]);
  const live = await start(connected, "http://fixture-api:5001");
  assert.equal((await fetch(`${live}/realtime/health`)).status, 200);
  await new Promise<void>((resolve, reject) => {
    const socket = new WebSocket(`${live.replace("http:", "ws:")}/realtime/socket.io/?EIO=4&transport=websocket`);
    const timer = setTimeout(() => { socket.close(); reject(new Error("WebSocket upgrade timed out")); }, 10_000);
    socket.addEventListener("open", () => { clearTimeout(timer); socket.close(); resolve(); });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("WebSocket upgrade failed")); });
  });
  assert.equal(await (await fetch(`${live}/assets/previous-deadbeef.js`)).text(), "/* retained previous release */");
  console.log("PASS: Nginx syntax, health/version, SPA routes, real HTTP API proxy, API/compatibility probes, optional gateway/WebSocket, immutable asset retention, read-only desktop downloads, runtime contents");
} finally {
  for (const name of [web, connected, api]) await run({ executable: "docker", args: ["rm", "--force", name] });
  await run({ executable: "docker", args: ["volume", "rm", volume] });
  await run({ executable: "docker", args: ["volume", "rm", downloads] });
  await run({ executable: "docker", args: ["network", "rm", network] });
  await rm(directory, { recursive: true, force: true });
}
