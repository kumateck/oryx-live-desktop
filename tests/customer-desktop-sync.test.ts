import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { syncDesktop } from "../deploy/customer-docker/sync-desktop.ts";

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "oryx-desktop-mirror-"));
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const key = publicKey.export({ type: "spki", format: "pem" }).toString();
  let version = "0.2.4"; let bytes = Buffer.from("signed Windows fixture");
  let fault = ""; let envelope = ""; const urls: string[] = [];
  const select = (next: string, value = bytes) => {
    version = next; bytes = value;
    const payload = JSON.stringify({ version, platform: "win32", arch: "universal", architectures: ["ia32", "x64"],
      size: bytes.length, sha512: createHash("sha512").update(bytes).digest("hex"), notes: "" });
    envelope = JSON.stringify({ payload, signature: sign(null, Buffer.from(payload), privateKey).toString("base64") });
  };
  select(version);
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input); urls.push(url);
    assert.equal(init?.redirect, "error"); assert.equal(init?.credentials, "omit");
    if (url.endsWith("latest.json")) {
      if (fault === "oversize") return new Response("x".repeat(65537));
      if (fault === "signature") return new Response(envelope.replace('"signature":"', '"signature":"A'));
      return new Response(envelope);
    }
    assert.ok(url.endsWith(`/${version}/OryxLiveDesktop-Setup.exe`));
    if (fault === "unreachable") throw new Error("Fixture download unavailable");
    return new Response(fault === "corrupt" ? Buffer.from("corrupt") : bytes);
  };
  const run = () => syncDesktop({ downloads: directory, publicKey: key, fetcher });
  return { directory, key, fetcher, run, select, urls, fault: (next: string) => { fault = next; },
    close: () => rmSync(directory, { recursive: true, force: true }) };
}

test("publishes the signed version, manual installer and checksum then keeps old versions", async () => {
  const f = fixture();
  try {
    f.select("0.2.1"); await f.run();
    const old = join(f.directory, "desktop/windows/0.2.1/OryxLiveDesktop-Setup.exe");
    const oldBytes = readFileSync(old);
    f.select("0.2.4", Buffer.from("new signed installer"));
    assert.equal(await f.run(), "0.2.4");
    const feed = JSON.parse(readFileSync(join(f.directory, "desktop/windows/latest.json"), "utf8"));
    assert.equal(JSON.parse(feed.payload).version, "0.2.4");
    assert.deepEqual(readFileSync(old), oldBytes);
    assert.equal(readFileSync(join(f.directory, "OryxLiveDesktop-Setup.exe"), "utf8"), "new signed installer");
    assert.match(readFileSync(join(f.directory, "OryxLiveDesktop-Setup.exe.sha256"), "utf8"), /^[a-f0-9]{64}  OryxLiveDesktop-Setup.exe\n$/);
    const count = f.urls.length;
    assert.equal(await f.run(), "0.2.4");
    assert.equal(f.urls.length, count + 1, "unchanged release does not redownload its installer");
  } finally { f.close(); }
});

for (const fault of ["signature", "oversize", "corrupt", "unreachable"]) {
  test(`${fault} preserves the working feed and installer and cleans staging`, async () => {
    const f = fixture();
    try {
      f.select("0.2.1"); await f.run();
      const feed = join(f.directory, "desktop/windows/latest.json");
      const original = readFileSync(feed);
      const installer = readFileSync(join(f.directory, "OryxLiveDesktop-Setup.exe"));
      f.select("0.2.4"); f.fault(fault);
      await assert.rejects(f.run());
      assert.deepEqual(readFileSync(feed), original);
      assert.deepEqual(readFileSync(join(f.directory, "OryxLiveDesktop-Setup.exe")), installer);
      assert.equal(existsSync(join(f.directory, "desktop/windows/0.2.4")), false);
      assert.equal(readdirSync(f.directory).some(name => name.startsWith(".desktop-sync-")), false);
    } finally { f.close(); }
  });
}

test("refuses a signed downgrade and a same-version byte collision", async () => {
  const f = fixture();
  try {
    await f.run();
    f.select("0.2.1"); await assert.rejects(f.run(), /downgrade/);
    f.select("0.2.4", Buffer.from("different bytes")); await assert.rejects(f.run(), /different bytes/);
  } finally { f.close(); }
});

test("an untrusted key or HTTP source publishes nothing", async () => {
  const f = fixture();
  try {
    const other = generateKeyPairSync("ed25519").publicKey.export({ type: "spki", format: "pem" }).toString();
    await assert.rejects(syncDesktop({ downloads: f.directory, publicKey: other, fetcher: f.fetcher }), /signature/);
    await assert.rejects(syncDesktop({ downloads: f.directory, publicKey: f.key, origin: "http://oryx.kumateck.com", fetcher: f.fetcher }), /HTTPS/);
    assert.deepEqual(readdirSync(f.directory), []);
  } finally { f.close(); }
});

test("refuses symlink destinations rather than writing outside downloads", async () => {
  const f = fixture(); const other = mkdtempSync(join(tmpdir(), "oryx-mirror-outside-"));
  try {
    symlinkSync(other, join(f.directory, "desktop"));
    await assert.rejects(f.run(), /symlink/);
    assert.deepEqual(readdirSync(other), []);
  } finally { f.close(); rmSync(other, { recursive: true, force: true }); }
});
