/** Disposable GitHub Windows runner only: exercise the actual signed download → NSIS update → restart. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { generateKeyPairSync } from "node:crypto";
import { createReadStream } from "node:fs";
import { copyFile, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { jsonObject, parseJson, versionParts, type Json } from "../shared/desktop-updates.ts";
if (process.platform !== "win32" || process.env.GITHUB_ACTIONS !== "true") throw new Error("Run this installed-update smoke only on a disposable GitHub Windows runner");
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const directory = await mkdtemp(join(tmpdir(), "oryx-installed-update-"));
const packageFile = resolve("apps/desktop/package.json"); const original = await readFile(packageFile, "utf8");
const metadata = jsonObject(parseJson(original));
if (typeof metadata.version !== "string") throw new Error("No desktop version");
const version = metadata.version; const parts = versionParts(version); const targetVersion = `${parts[0]}.${parts[1]}.${(parts[2] ?? 0) + 1}`;
const keys = generateKeyPairSync("ed25519", { privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
const env = { ...process.env, ORYX_DESKTOP_UPDATE_PUBLIC_KEY: keys.publicKey, ORYX_DESKTOP_UPDATE_PRIVATE_KEY: keys.privateKey };
async function command(executable: string, args: string[], capture = false): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { env, shell: false, stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit" });
    let output = ""; let errors = "";
    child.stdout?.on("data", (data: Buffer) => { output += data.toString(); });
    child.stderr?.on("data", (data: Buffer) => { errors += data.toString(); });
    child.once("error", reject); child.once("exit", (code) => code === 0 ? resolve(output.trim()) : reject(new Error(`Smoke command failed (${code}): ${errors.slice(-2000)}`)));
  });
}
const ps = (script: string) => command("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", `[Console]::OutputEncoding=[Text.UTF8Encoding]::new(); $ErrorActionPreference='Stop'; ${script}`], true);
const literal = (value: string) => `'${value.replaceAll("'", "''")}'`;
const stop = () => ps("Get-Process OryxLiveDesktop -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Sleep 2");
async function until<T>(read: () => Promise<T | null>, label: string, attempts = 120): Promise<T> {
  for (let attempt = 0; attempt < attempts; attempt++) { try { const value = await read(); if (value !== null) return value; } catch { /* wait for install/window readiness */ } await delay(500); }
  throw new Error(`Timed out waiting for ${label}`);
}
class Page {
  private id = 0;
  private pending = new Map<number, { resolve: (value: Json) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  constructor(private socket: WebSocket) {
    socket.addEventListener("message", (event) => {
      if (typeof event.data !== "string") return;
      const message = jsonObject(parseJson(event.data)); if (typeof message.id !== "number") return;
      const pending = this.pending.get(message.id); if (!pending) return; this.pending.delete(message.id); clearTimeout(pending.timer);
      if (message.error) { pending.reject(new Error(JSON.stringify(message.error))); return; }
      const result = jsonObject(message.result ?? null);
      if (result.exceptionDetails) pending.reject(new Error(JSON.stringify(result.exceptionDetails)));
      else pending.resolve(jsonObject(result.result ?? null).value ?? null);
    });
    socket.addEventListener("close", () => { for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(new Error("Window closed")); } this.pending.clear(); });
  }
  evaluate(expression: string): Promise<Json> {
    return new Promise((resolve, reject) => {
      if (this.socket.readyState !== WebSocket.OPEN) { reject(new Error("The smoke window is not connected")); return; }
      const id = ++this.id;
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error("The smoke window did not respond within 30 seconds")); }, 30_000);
      this.pending.set(id, { resolve, reject, timer });
      this.socket.send(JSON.stringify({ id, method: "Runtime.evaluate", params: { expression, awaitPromise: true, returnByValue: true } }));
    });
  }
  close(): void { this.socket.close(); }
}
async function page(match: string): Promise<Page> {
  const url = await until(async () => {
    const rows = parseJson(await (await fetch("http://127.0.0.1:9229/json/list")).text()); if (!Array.isArray(rows)) return null;
    for (const row of rows) { const target = jsonObject(row); if (typeof target.url === "string" && target.url.includes(match) && typeof target.webSocketDebuggerUrl === "string") return target.webSocketDebuggerUrl; }
    return null;
  }, match);
  const socket = new WebSocket(url);
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => { socket.close(); reject(new Error("Cannot connect to the smoke window within 10 seconds")); }, 10_000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Cannot inspect smoke window")); }, { once: true });
  });
  return new Page(socket);
}
const server = createServer(async (request, response) => {
  if (request.url === "/downloads/desktop/windows/latest.json") {
    response.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" }); response.end(await readFile(join(directory, "feed/desktop/windows/latest.json"))); return;
  }
  if (request.url === `/downloads/desktop/windows/${targetVersion}/OryxLiveDesktop-Setup.exe`) {
    const file = join(directory, "target.exe"); response.writeHead(200, { "Content-Length": (await stat(file)).size });
    try { for await (const chunk of createReadStream(file, { highWaterMark: 64 * 1024 })) { if (response.destroyed) break; response.write(chunk); await delay(5); } response.end(); } catch { response.destroy(); }
    return;
  }
  response.writeHead(200, { "Content-Type": "text/html" }); response.end('<meta name="application-name" content="Oryx Live"><title>Oryx update smoke</title>Installed-update fixture');
});
let appPage: Page | null = null; let updatePage: Page | null = null;
try {
  // The production installer is already copied to downloads/. These test-key installers are never published.
  await command(process.execPath, ["run", "--filter", "@oryx/desktop", "make:windows"]);
  await copyFile("apps/desktop/out/make/nsis/OryxLiveDesktop-Setup.exe", join(directory, "seed.exe"));
  metadata.version = targetVersion; await writeFile(packageFile, `${JSON.stringify(metadata, null, 2)}\n`);
  await command(process.execPath, ["run", "--filter", "@oryx/desktop", "make:windows"]);
  await copyFile("apps/desktop/out/make/nsis/OryxLiveDesktop-Setup.exe", join(directory, "target.exe"));
  await command(process.execPath, ["scripts/create-desktop-update.ts", "publish", join(directory, "target.exe"), join(directory, "feed")]);
  await stop(); await ps(`$p=Start-Process ${literal(join(directory, "seed.exe"))} -ArgumentList '/S' -Wait -PassThru; if($p.ExitCode -ne 0){throw 'Seed installation failed'}`); await stop();
  const executable = await ps("(Get-ChildItem \"$env:LOCALAPPDATA\\Programs\" -Recurse -Filter OryxLiveDesktop.exe | Select-Object -First 1).FullName");
  if (!executable) throw new Error("Seed application not installed");
  const profile = join(process.env.APPDATA ?? "", "Oryx Live Desktop");
  await writeFile(join(profile, "site-url.txt"), "http://127.0.0.1:3001");
  await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(3001, "127.0.0.1", resolve); });
  const launch = () => { const child = spawn(executable, ["--remote-debugging-port=9229"], { detached: true, stdio: "ignore", env }); child.unref(); };
  launch(); appPage = await page("http://127.0.0.1:3001"); updatePage = await page("update_window");
  await appPage.evaluate('window.oryxSession.save("fixture-refresh-token")');
  await updatePage.evaluate('setTimeout(() => document.querySelector("#later").click(), 100); true'); await delay(1000); updatePage.close(); updatePage = null;
  // A fresh invocation, including while the companion keeps the app alive, must remind again.
  launch(); updatePage = await page("update_window");
  await updatePage.evaluate('document.querySelector("#action").click()');
  await until(async () => { const value = jsonObject(await appPage?.evaluate("window.oryxUpdates.status()") ?? null); return value.phase === "downloading" && typeof value.received === "number" && value.received > 0 ? true : null; }, "download progress");
  await until(async () => jsonObject(await appPage?.evaluate("window.oryxUpdates.status()") ?? null).phase === "ready" ? true : null, "verified installer", 600);
  await appPage.evaluate('window.oryxSmokeUnsaved = (event) => event.preventDefault(); window.addEventListener("beforeunload", window.oryxSmokeUnsaved); true');
  await updatePage.evaluate('document.querySelector("#action").click()');
  await until(async () => {
    const value = jsonObject(await appPage?.evaluate("window.oryxUpdates.status()") ?? null);
    return value.phase === "ready" && typeof value.error === "string" && value.error.includes("unsaved changes") ? true : null;
  }, "unsaved-work installation refusal");
  assert.equal(jsonObject(await appPage.evaluate("window.oryxUpdates.status()")).currentVersion, version);
  await appPage.evaluate('window.removeEventListener("beforeunload", window.oryxSmokeUnsaved); delete window.oryxSmokeUnsaved; true');
  await updatePage.evaluate('document.querySelector("#action").click()');
  await until(async () => {
    const installed = await ps(`$v=(Get-Item ${literal(executable)}).VersionInfo.ProductVersion; $running=@(Get-Process OryxLiveDesktop -ErrorAction SilentlyContinue).Count; if($running -gt 0){Write-Output $v}`);
    return installed.startsWith(targetVersion) ? true : null;
  }, "updated application restart", 240);
  assert.equal((await readFile(join(profile, "site-url.txt"), "utf8")).trim(), "http://127.0.0.1:3001");
  appPage.close(); updatePage.close(); appPage = null; updatePage = null;
  await stop(); launch(); appPage = await page("http://127.0.0.1:3001");
  assert.equal(await appPage.evaluate("window.oryxSession.load()"), "fixture-refresh-token");
  assert.equal(jsonObject(await appPage.evaluate("window.oryxUpdates.status()")).currentVersion, targetVersion);
  console.log(`PASS: installed ${version} → signed universal ${targetVersion}, launch reminder, progress, unsaved-work refusal, NSIS install/restart, saved server and OS-encrypted session`);
} finally {
  appPage?.close(); updatePage?.close(); await stop().catch(() => {});
  server.close(); await writeFile(packageFile, original); await rm(directory, { recursive: true, force: true });
}
