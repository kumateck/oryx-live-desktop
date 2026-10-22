import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createSessionVault, isRefreshToken, type Cipher } from "../apps/desktop/src/session-vault.ts";

// Stands in for the operating system's encryption: reversible, and never the plain text on disk.
const cipher: Cipher = { encrypt: (plain) => Buffer.from(plain).reverse(), decrypt: (sealed) => Buffer.from(sealed).reverse().toString() };
const site = "http://10.0.0.5";

async function vaultFile() { return path.join(await mkdtemp(path.join(tmpdir(), "oryx-vault-")), "session.bin"); }

test("keeps a sign-in encrypted, only for the server it came from", async () => {
  const file = await vaultFile();
  const vault = createSessionVault(file, () => cipher);
  await vault.save(site, "refresh-abc");
  assert.equal((await readFile(file)).includes("refresh-abc"), false);
  assert.equal((await stat(file)).mode & 0o777, 0o600);
  assert.equal(await vault.load(site), "refresh-abc");
  assert.equal(await vault.load("http://10.0.0.6"), null);
});

test("signing out, or a server without OS encryption, keeps nothing", async () => {
  const file = await vaultFile();
  const vault = createSessionVault(file, () => cipher);
  await vault.save(site, "refresh-abc");
  await vault.save(site, null);
  assert.equal(await vault.load(site), null);
  const plain = createSessionVault(file, () => null);
  await plain.save(site, "refresh-abc");
  await assert.rejects(stat(file));
  assert.equal(await plain.load(site), null);
});

test("refuses what is not a token, and drops a file it cannot read", async () => {
  const file = await vaultFile();
  const vault = createSessionVault(file, () => cipher);
  await assert.rejects(vault.save(site, "has space"));
  assert.equal(isRefreshToken("x".repeat(5000)), false);
  const broken = createSessionVault(file, () => ({ ...cipher, decrypt: () => { throw new Error("key changed"); } }));
  await vault.save(site, "refresh-abc");
  assert.equal(await broken.load(site), null);
  await assert.rejects(stat(file));
});

test("a fresh process restores the latest token, and concurrent reads cannot see a half-written file", async () => {
  const file = await vaultFile();
  const vault = createSessionVault(file, () => cipher);
  const first = vault.save(site, "refresh-first");
  const read = vault.load(site);
  const second = vault.save(site, "refresh-second");
  await first;
  assert.equal(await read, "refresh-first");
  await second;
  await vault.flush();
  assert.equal(await createSessionVault(file, () => cipher).load(site), "refresh-second");
});

test("queued sign-out cannot be overtaken by an earlier token save", async () => {
  const file = await vaultFile();
  const vault = createSessionVault(file, () => cipher);
  const writing = vault.save(site, "refresh-first");
  const signingOut = vault.forget();
  await Promise.all([writing, signingOut, vault.flush()]);
  assert.equal(await createSessionVault(file, () => cipher).load(site), null);
});

test("a failed encrypted replacement preserves the previous complete token", async () => {
  const file = await vaultFile();
  let broken = false;
  const vault = createSessionVault(file, () => broken ? { ...cipher, encrypt: () => { throw new Error("keyring unavailable"); } } : cipher);
  await vault.save(site, "refresh-good");
  broken = true;
  await assert.rejects(vault.save(site, "refresh-replacement"));
  broken = false;
  assert.equal(await vault.load(site), "refresh-good");
});
