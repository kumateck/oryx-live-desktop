import assert from "node:assert/strict";
import test from "node:test";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DesktopUpdater } from "../apps/desktop/src/updates/controller.ts";
import { defaultUpdateOrigin, feedOrigins, parseBuildUpdateOrigin, resolveUpdateSource } from "../apps/desktop/src/updates/source.ts";

const pair = () => generateKeyPairSync("ed25519", { privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
const keys = pair();
const bytes = Buffer.from("MZ fixture installer bytes");
function envelope(version: string, privateKey = keys.privateKey): string {
  const payload = JSON.stringify({ version, platform: "win32", arch: "universal", architectures: ["ia32", "x64"], size: bytes.length, sha512: createHash("sha512").update(bytes).digest("hex"), notes: "" });
  return JSON.stringify({ payload, signature: sign(null, Buffer.from(payload), privateKey).toString("base64") });
}
const source = "https://oryx.kumateck.com";
const site = "http://customer.test:3001";
const feed = (origin: string) => `${origin}/downloads/desktop/windows/latest.json`;

type Answer = string | number | "offline";
/** Serves each URL from the table; a number is an HTTP status, "offline" a network failure. Records every request. */
function server(table: Record<string, Answer>, requests: string[]): typeof fetch {
  return async (input, init) => {
    const url = String(input); requests.push(url);
    assert.equal(init?.redirect, "error"); assert.equal(init?.credentials, "omit");
    const answer = table[url];
    if (answer === undefined || answer === "offline") throw new TypeError("fetch failed");
    return typeof answer === "number" ? new Response("", { status: answer }) : new Response(answer);
  };
}
async function updater(table: Record<string, Answer>, cache: string, requests: string[] = [], updateOrigin = source): Promise<DesktopUpdater> {
  const instance = new DesktopUpdater({ version: "0.2.0", arch: "x64", cache, publicKey: keys.publicKey, updateOrigin, supported: true,
    changed: () => {}, prompt: () => {}, install: async () => {}, fetcher: server(table, requests) });
  return instance;
}
async function settled(instance: DesktopUpdater): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt++) { if (!["idle", "checking", "downloading"].includes(instance.state.phase)) return; await new Promise((resolve) => setTimeout(resolve, 5)); }
  throw new Error(`Updater did not settle: ${instance.state.phase}`);
}
async function withCache(run: (cache: string) => Promise<void>): Promise<void> {
  const cache = await mkdtemp(join(tmpdir(), "oryx-update-source-"));
  try { await run(cache); } finally { await rm(cache, { recursive: true, force: true }); }
}

test("every build checks https://oryx.kumateck.com unless the build or launch names another source", () => {
  assert.equal(defaultUpdateOrigin, "https://oryx.kumateck.com");
  assert.deepEqual(resolveUpdateSource("", undefined), { origin: "https://oryx.kumateck.com", warning: "" });
  assert.deepEqual(resolveUpdateSource(" https://staging.oryx.test/ ", undefined), { origin: "https://staging.oryx.test", warning: "" });
  assert.deepEqual(resolveUpdateSource("", "http://192.168.1.20:3001"), { origin: "http://192.168.1.20:3001", warning: "" });
  assert.equal(resolveUpdateSource("https://staging.oryx.test", "https://qa.oryx.test").origin, "https://qa.oryx.test");
});

test("an unusable launch source is ignored rather than leaving the install without updates", () => {
  for (const value of ["oryx.kumateck.com", "https://oryx.kumateck.com/downloads", "ftp://oryx.kumateck.com", "https://user:pass@oryx.kumateck.com"]) {
    const resolved = resolveUpdateSource("", value);
    assert.equal(resolved.origin, "https://oryx.kumateck.com"); assert.match(resolved.warning, /Ignored ORYX_UPDATE_ORIGIN/);
  }
  assert.deepEqual(resolveUpdateSource("", "   "), { origin: "https://oryx.kumateck.com", warning: "" });
});

test("a built-in source must be an HTTPS origin, except a loopback test server", () => {
  assert.equal(parseBuildUpdateOrigin("https://oryx.kumateck.com:443/"), "https://oryx.kumateck.com");
  assert.equal(parseBuildUpdateOrigin("http://127.0.0.1:3001"), "http://127.0.0.1:3001");
  assert.equal(parseBuildUpdateOrigin("http://localhost:3001"), "http://localhost:3001");
  assert.throws(() => parseBuildUpdateOrigin("http://oryx.kumateck.com"), /HTTPS/);
  assert.throws(() => parseBuildUpdateOrigin("https://oryx.kumateck.com/feed"), /only the server origin/);
  assert.throws(() => resolveUpdateSource("http://staging.oryx.test", undefined), /HTTPS/);
});

test("the update source is asked first and the connected server second, each once", () => {
  assert.deepEqual(feedOrigins(source, site), [source, site]);
  assert.deepEqual(feedOrigins(source, source), [source]);
  assert.deepEqual(feedOrigins(source, ""), [source]);
  assert.deepEqual(feedOrigins("", site), [site]);
  assert.deepEqual(feedOrigins("", ""), []);
});

test("a verified release from the update source wins, and its installer is downloaded from there", async () => withCache(async (cache) => {
  const requests: string[] = [];
  const instance = await updater({ [feed(source)]: envelope("0.3.0"), [feed(site)]: envelope("0.9.0"), [`${source}/downloads/desktop/windows/0.3.0/OryxLiveDesktop-Setup.exe`]: bytes.toString() }, cache, requests);
  instance.connect(site); await settled(instance);
  assert.equal(instance.state.phase, "available"); assert.equal(instance.state.latestVersion, "0.3.0");
  assert.deepEqual(requests, [feed(source)]);
  await instance.download();
  assert.equal(instance.state.phase, "ready");
  assert.equal(requests.at(-1), `${source}/downloads/desktop/windows/0.3.0/OryxLiveDesktop-Setup.exe`);
}));

test("an up-to-date answer from the update source is final; the connected server is not asked", async () => withCache(async (cache) => {
  const requests: string[] = [];
  const instance = await updater({ [feed(source)]: envelope("0.2.0"), [feed(site)]: envelope("0.9.0") }, cache, requests);
  instance.connect(site); await settled(instance);
  assert.equal(instance.state.phase, "current"); assert.deepEqual(requests, [feed(source)]);
}));

test("installs check the update source before any server is connected", async () => withCache(async (cache) => {
  const requests: string[] = [];
  const instance = await updater({ [feed(source)]: envelope("0.3.0") }, cache, requests);
  instance.connect(""); await settled(instance);
  assert.equal(instance.state.phase, "available"); assert.deepEqual(requests, [feed(source)]);
  assert.equal(await instance.minimumForSite(), null);
}));

for (const [label, answer] of [["unreachable", "offline"], ["missing its feed", 404], ["serving a release signed by another key", envelope("0.9.0", pair().privateKey)]] as const) {
  test(`an update source ${label} falls back to the connected server, with the same verification`, async () => withCache(async (cache) => {
    const requests: string[] = [];
    const installer = `${site}/downloads/desktop/windows/0.3.0/OryxLiveDesktop-Setup.exe`;
    const instance = await updater({ [feed(source)]: answer, [feed(site)]: envelope("0.3.0"), [installer]: bytes.toString() }, cache, requests);
    instance.connect(site); await settled(instance);
    assert.equal(instance.state.phase, "available"); assert.equal(instance.state.latestVersion, "0.3.0");
    assert.deepEqual(requests, [feed(source), feed(site)]);
    await instance.download();
    assert.equal(instance.state.phase, "ready"); assert.equal(requests.at(-1), installer);
  }));
}

test("a forged fallback feed is refused too; the first source's error is reported", async () => withCache(async (cache) => {
  const instance = await updater({ [feed(source)]: 503, [feed(site)]: envelope("0.9.0", pair().privateKey) }, cache);
  instance.connect(site); await settled(instance);
  assert.equal(instance.state.phase, "error"); assert.match(instance.state.error, /HTTP 503/); assert.equal(instance.state.latestVersion, null);
}));

test("when every source fails, a release verified earlier from either source is still offered", async () => withCache(async (cache) => {
  const first = await updater({ [feed(source)]: "offline", [feed(site)]: envelope("0.3.0") }, cache);
  first.connect(site); await settled(first);
  assert.equal(first.state.phase, "available");
  const restarted = await updater({}, cache);
  restarted.connect(site); await settled(restarted);
  assert.equal(restarted.state.phase, "available"); assert.equal(restarted.state.latestVersion, "0.3.0");
  assert.match(restarted.state.error, /previously verified/);
}));

test("an empty update source keeps the previous behaviour: only the connected server is checked", async () => withCache(async (cache) => {
  const requests: string[] = [];
  const instance = await updater({ [feed(site)]: envelope("0.3.0") }, cache, requests, "");
  instance.connect(""); await instance.check();
  assert.equal(instance.state.phase, "unconfigured"); assert.deepEqual(requests, []);
  instance.connect(site); await settled(instance);
  assert.equal(instance.state.phase, "available"); assert.deepEqual(requests, [feed(site)]);
}));
