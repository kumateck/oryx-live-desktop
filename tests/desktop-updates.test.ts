import assert from "node:assert/strict";
import test from "node:test";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { newerVersion, readWebRelease } from "../shared/desktop-updates.ts";
import { verifyRelease } from "../apps/desktop/src/updates/manifest.ts";
import { clearInterruptedDownloads, downloadInstaller, validInstaller } from "../apps/desktop/src/updates/download.ts";
import { DesktopUpdater } from "../apps/desktop/src/updates/controller.ts";
import { desktopSigningStatus } from "../shared/desktop-signing.ts";
const keys = generateKeyPairSync("ed25519", { privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
const bytes = Buffer.from("MZ fixture installer bytes");
const metadata = { version: "0.3.0", platform: "win32", arch: "universal", architectures: ["ia32", "x64"], size: bytes.length, sha512: createHash("sha512").update(bytes).digest("hex"), notes: "Release" };
function envelope(value = metadata): string { const payload = JSON.stringify(value); return JSON.stringify({ payload, signature: sign(null, Buffer.from(payload), keys.privateKey).toString("base64") }); }
const release = verifyRelease(envelope(), keys.publicKey, "x64");
const temp = () => mkdtemp(join(tmpdir(), "oryx-desktop-update-"));
async function settled(updater: DesktopUpdater): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt++) { if (!["idle", "checking", "downloading"].includes(updater.state.phase)) return; await new Promise((resolve) => setTimeout(resolve, 5)); }
  throw new Error(`Updater did not settle: ${updater.state.phase}`);
}

test("versions are compared numerically and malformed metadata is rejected", () => {
  assert.ok(newerVersion("0.10.0", "0.9.9")); assert.ok(!newerVersion("0.1.0", "0.2.0"));
  for (const version of ["1", "01.2.3", "1.2.3;bad", "1.2.-3", "1.2.3-beta"]) assert.throws(() => newerVersion(version,"0.1.0"));
  assert.throws(() => readWebRelease({ commit: "bad", minimumShellVersion: "0.1.0" }));
});

test("release signing checks fail early for partial or mismatched configuration without returning secrets", () => {
  assert.deepEqual(desktopSigningStatus("", ""), { configured: false, fingerprint: "" });
  const status = desktopSigningStatus(keys.publicKey, keys.privateKey);
  assert.equal(status.configured, true); assert.match(status.fingerprint, /^[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(status).includes("PRIVATE KEY"));
  assert.throws(() => desktopSigningStatus(keys.publicKey, ""), /both/);
  assert.throws(() => desktopSigningStatus("", keys.privateKey), /both/);
  const other = generateKeyPairSync("ed25519", { privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
  assert.throws(() => desktopSigningStatus(keys.publicKey, other.privateKey), /matching/);
});

test("the universal release is verified for both Windows architectures, including its signed target and digest", () => {
  assert.equal(verifyRelease(envelope(),keys.publicKey,"ia32").version,"0.3.0");
  for (const change of [{platform:"darwin"},{arch:"x64"},{architectures:["x64"]},{size:0},{sha512:"bad"}]) assert.throws(() => verifyRelease(envelope({...metadata,...change}),keys.publicKey,"ia32"));
  const forged = JSON.parse(envelope()); forged.payload = forged.payload.replace("0.3.0","9.0.0");
  assert.throws(() => verifyRelease(JSON.stringify(forged),keys.publicKey,"x64"),/signature/);
  const other = generateKeyPairSync("ed25519",{ publicKeyEncoding:{type:"spki",format:"pem"},privateKeyEncoding:{type:"pkcs8",format:"pem"} });
  assert.throws(() => verifyRelease(envelope(),other.publicKey,"x64"),/signature/);
});

test("downloads verify bytes and progress before committing a private installer", async () => {
  const directory = await temp(); const file = join(directory,"installer.exe"); const progress:number[]=[];
  try {
    await downloadInstaller("http://customer.test/file",file,release,new AbortController().signal,(received)=>progress.push(received),async (_input,init)=>{ assert.equal(init?.redirect,"error");assert.equal(init?.credentials,"omit");return new Response(bytes); });
    assert.equal(await validInstaller(file,release),true); assert.equal(progress.at(-1),bytes.length);
    assert.deepEqual(await readFile(file),bytes);
  } finally { await rm(directory,{recursive:true,force:true}); }
});

test("corrupt, oversized, truncated and cancelled downloads never replace a valid cached installer", async () => {
  const directory = await temp(); const file=join(directory,"installer.exe");
  try {
    await writeFile(file,bytes);
    for(const body of [Buffer.from("wrong"),Buffer.alloc(bytes.length+1),Buffer.alloc(bytes.length)]) {
      await assert.rejects(downloadInstaller("http://customer.test/file",file,release,new AbortController().signal,()=>{},async()=>new Response(body)));
      assert.deepEqual(await readFile(file),bytes); assert.deepEqual(await readdir(directory),["installer.exe"]);
    }
    const cancellation=new AbortController(); cancellation.abort();
    await assert.rejects(downloadInstaller("http://customer.test/file",file,release,cancellation.signal,()=>{},async()=>new Response(bytes)));
    assert.deepEqual(await readdir(directory),["installer.exe"]);
  } finally { await rm(directory,{recursive:true,force:true}); }
});

test("checks, download, revalidation and install are explicit; duplicate work and downgrades are refused", async () => {
  const directory = await temp();let prompts=0;let installs=0;let requests=0;
  const updater = new DesktopUpdater({version:"0.2.0",arch:"ia32",cache:directory,publicKey:keys.publicKey,supported:true,changed:()=>{},prompt:()=>{prompts++;},install:async()=>{installs++;},fetcher:async(input)=>{requests++;return String(input).endsWith("latest.json")?new Response(envelope()):new Response(bytes);} });
  try {
    updater.connect("http://customer.test");await settled(updater);assert.equal(updater.state.phase,"available");assert.equal(prompts,1);assert.equal(installs,0);
    await updater.install();assert.equal(installs,0);
    await Promise.all([updater.download(),updater.download()]);assert.equal(updater.state.phase,"ready");assert.equal(requests,2);
    await updater.install();assert.equal(installs,1);
    const current = new DesktopUpdater({version:"0.4.0",arch:"x64",cache:directory,publicKey:keys.publicKey,supported:true,changed:()=>{},prompt:()=>{prompts++;},install:async()=>{},fetcher:async()=>new Response(envelope())});
    current.connect("http://customer.test");await settled(current);assert.equal(current.state.phase,"current");assert.equal(prompts,1);
  } finally { await rm(directory,{recursive:true,force:true}); }
});

test("remind later lasts only this launch; verified pending downloads are offered again offline after restart", async () => {
  const directory=await temp();let prompts=0;
  const options={version:"0.2.0",arch:"x64" as const,cache:directory,publicKey:keys.publicKey,supported:true,changed:()=>{},prompt:()=>{prompts++;},install:async()=>{}};
  try {
    const first=new DesktopUpdater({...options,fetcher:async(input)=>String(input).endsWith("latest.json")?new Response(envelope()):new Response(bytes)});
    first.connect("http://customer.test");await settled(first);first.remindLater();await first.download();await first.check();assert.equal(prompts,1);
    const restarted=new DesktopUpdater({...options,fetcher:async()=>{throw new Error("offline");}});
    restarted.connect("http://customer.test");await settled(restarted);assert.equal(restarted.state.phase,"ready");assert.equal(prompts,2);assert.match(restarted.state.error,/previously verified/);
  } finally { await rm(directory,{recursive:true,force:true}); }
});

test("a changed installer cannot run and a failed installation remains retryable", async () => {
  const directory=await temp();let installs=0;
  const updater=new DesktopUpdater({version:"0.2.0",arch:"x64",cache:directory,publicKey:keys.publicKey,supported:true,changed:()=>{},prompt:()=>{},install:async()=>{installs++;throw new Error("Save your work");},fetcher:async(input)=>String(input).endsWith("latest.json")?new Response(envelope()):new Response(bytes)});
  try {
    updater.connect("http://customer.test");await settled(updater);await updater.download();await updater.install();assert.equal(updater.state.phase,"ready");assert.equal(installs,1);assert.match(updater.state.error,/Save your work/);
    const file=(await readdir(directory)).find((file)=>file.endsWith(".exe"));if(!file)throw new Error("No cached installer");await writeFile(join(directory,file),"changed");
    await updater.install();assert.equal(installs,1);assert.match(updater.state.error,/cached installer changed/);
  } finally { await rm(directory,{recursive:true,force:true}); }
});

test("launching again reminds during a deferred active download without starting another download", async () => {
  const directory = await temp(); let prompts = 0; let downloads = 0;
  let finish: (response: Response) => void = () => { throw new Error("No download started"); };
  const updater = new DesktopUpdater({ version: "0.2.0", arch: "x64", cache: directory, publicKey: keys.publicKey, supported: true,
    changed: () => {}, prompt: () => { prompts++; }, install: async () => {},
    fetcher: async (input) => {
      if (String(input).endsWith("latest.json")) return new Response(envelope());
      downloads++;
      return new Promise<Response>((resolve) => { finish = resolve; });
    },
  });
  try {
    updater.connect("http://customer.test"); await settled(updater);
    const download = updater.download();
    // The filesystem preparation happens before the download request.
    for (let attempt = 0; downloads === 0 && attempt < 100; attempt++) await new Promise((resolve) => setTimeout(resolve, 5));
    assert.equal(downloads, 1);
    updater.remindLater(); updater.newLaunch();
    assert.equal(prompts, 2); assert.equal(updater.state.phase, "downloading");
    finish(new Response(bytes)); await download;
    assert.equal(updater.state.phase, "ready"); assert.equal(downloads, 1);
    await updater.check(); assert.equal(prompts, 2);
  } finally { updater.cancel(); await rm(directory, { recursive: true, force: true }); }
});

test("interrupted download cleanup preserves completed installers and unrelated cache files", async () => {
  const directory = await temp();
  try {
    await writeFile(join(directory, "universal-0.3.0-deadbeef.exe.123.partial"), "incomplete");
    await writeFile(join(directory, "installer.exe"), bytes);
    await writeFile(join(directory, "metadata.json"), envelope());
    await clearInterruptedDownloads(directory);
    assert.deepEqual((await readdir(directory)).sort(), ["installer.exe", "metadata.json"]);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("installation checks unsaved work and revalidates the installer after asynchronous preparation", async () => {
  const directory = await temp(); let allowed = false; let changed = false; let installs = 0; let preparation = 0;
  const updater = new DesktopUpdater({ version: "0.2.0", arch: "x64", cache: directory, publicKey: keys.publicKey, supported: true,
    changed: () => {}, prompt: () => {}, install: async () => { installs++; },
    beforeInstall: async () => {
      preparation++;
      if (changed) {
        const file = (await readdir(directory)).find((entry) => entry.endsWith(".exe"));
        if (!file) throw new Error("Missing cached installer");
        await writeFile(join(directory, file), Buffer.alloc(bytes.length));
      }
      return allowed;
    },
    fetcher: async (input) => String(input).endsWith("latest.json") ? new Response(envelope()) : new Response(bytes),
  });
  try {
    updater.connect("http://customer.test"); await settled(updater); await updater.download();
    await updater.install();
    assert.equal(installs, 0); assert.equal(updater.state.phase, "ready"); assert.match(updater.state.error, /unsaved changes/);
    allowed = true; changed = true;
    await updater.install();
    assert.equal(installs, 0); assert.equal(preparation, 2); assert.equal(updater.state.phase, "error"); assert.match(updater.state.error, /cached installer changed/);
  } finally { updater.cancel(); await rm(directory, { recursive: true, force: true }); }
});
