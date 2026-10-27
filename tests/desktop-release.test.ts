import assert from "node:assert/strict";
import test from "node:test";
import { createHash, generateKeyPairSync } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { verifyRelease } from "../apps/desktop/src/updates/manifest.ts";

test("the release command signs the immutable installer for both architectures and refuses version replacement", () => {
  const directory = mkdtempSync(join(tmpdir(), "oryx-release-cli-"));
  const keys = generateKeyPairSync("ed25519", { privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
  const bytes = Buffer.alloc(1024 * 1024); bytes.write("MZ");
  const installer = join(directory, "fixture.exe"); const output = join(directory, "release");
  const env = { ...process.env, ORYX_DESKTOP_UPDATE_PUBLIC_KEY: keys.publicKey, ORYX_DESKTOP_UPDATE_PRIVATE_KEY: keys.privateKey };
  const publish = () => spawnSync(process.execPath, [resolve("scripts/create-desktop-update.ts"), "publish", installer, output], { env, encoding: "utf8" });
  try {
    writeFileSync(installer, bytes);
    const first = publish(); assert.equal(first.status, 0, first.stderr);
    const feed = readFileSync(join(output, "desktop/windows/latest.json"), "utf8");
    for (const architecture of ["ia32", "x64"] as const) {
      const release = verifyRelease(feed, keys.publicKey, architecture);
      assert.equal(release.sha512, createHash("sha512").update(bytes).digest("hex"));
      assert.equal(release.size, bytes.length);
      assert.deepEqual(readFileSync(join(output, "desktop/windows", release.version, "OryxLiveDesktop-Setup.exe")), bytes);
    }
    bytes[10] = 1; writeFileSync(installer, bytes);
    assert.notEqual(publish().status, 0, "An existing version must never be replaced with different bytes");
    assert.equal(readFileSync(join(output, "desktop/windows/latest.json"), "utf8"), feed);
    assert.ok(!feed.includes("PRIVATE KEY"));
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
