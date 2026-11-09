import { randomUUID, createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { chmod, copyFile, lstat, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { verifyRelease, installerPath, feedPath } from "../../apps/desktop/src/updates/manifest.ts";
import { downloadInstaller, validInstaller } from "../../apps/desktop/src/updates/download.ts";
import { defaultUpdateOrigin } from "../../apps/desktop/src/updates/source.ts";
import { newerVersion } from "../../shared/desktop-updates.ts";

interface MirrorOptions { downloads: string; publicKey: string; origin?: string; fetcher?: typeof fetch }
async function directory(path: string): Promise<void> {
  await mkdir(path, { recursive: true, mode: 0o755 });
  const info = await lstat(path);
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error(`Update directory must not be a symlink: ${path}`);
}
async function present(path: string): Promise<boolean> {
  try {
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink()) throw new Error(`Update file must be a regular file: ${path}`);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return false;
    throw error;
  }
}
async function feed(origin: string, fetcher: typeof fetch): Promise<string> {
  const response = await fetcher(origin + feedPath(), { redirect: "error", credentials: "omit", signal: AbortSignal.timeout(15_000) });
  if (!response.ok || !response.body) throw new Error(`Desktop feed returned HTTP ${response.status}`);
  const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const next = await reader.read(); if (next.done) break;
      size += next.value.length;
      if (size > 64 * 1024) throw new Error("Desktop feed exceeds 64 KiB");
      chunks.push(next.value);
    }
    return Buffer.concat(chunks).toString("utf8");
  } finally { await reader.cancel().catch(() => {}); }
}
async function atomicFile(source: string, destination: string): Promise<void> {
  const temporary = `${destination}.${randomUUID()}.tmp`;
  try { await copyFile(source, temporary); await chmod(temporary, 0o644); await rename(temporary, destination); }
  finally { await rm(temporary, { force: true }); }
}

/** Mirror a signed native release only; never deploy the web site, run an installer or access ERP data. */
export async function syncDesktop(options: MirrorOptions): Promise<string> {
  const origin = options.origin ?? defaultUpdateOrigin;
  const url = new URL(origin);
  if (url.protocol !== "https:" || url.origin !== origin || url.username || url.password) throw new Error("Update source must be an HTTPS origin");
  const fetcher = options.fetcher ?? fetch;
  const envelope = await feed(origin, fetcher);
  const release = verifyRelease(envelope, options.publicKey, "ia32");
  verifyRelease(envelope, options.publicKey, "x64");
  const downloads = resolve(options.downloads); await directory(downloads);
  const desktop = join(downloads, "desktop"); await directory(desktop);
  const windows = join(desktop, "windows"); await directory(windows);
  const latest = join(windows, "latest.json");
  if (await present(latest)) {
    const current = verifyRelease(await readFile(latest, "utf8"), options.publicKey, "x64");
    if (newerVersion(current.version, release.version)) throw new Error("Refusing to downgrade the published desktop release");
    if (current.version === release.version && (current.sha512 !== release.sha512 || current.size !== release.size)) throw new Error("Published desktop version has different bytes");
  }
  const version = join(windows, release.version); const installer = join(version, "OryxLiveDesktop-Setup.exe");
  const alias = join(downloads, "OryxLiveDesktop-Setup.exe");
  let exists = false;
  try { const info = await lstat(version); if (!info.isDirectory() || info.isSymbolicLink()) throw new Error("Invalid immutable release directory"); exists = true; }
  catch (error) { if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error; }
  if (exists && (!await present(installer) || !await validInstaller(installer, release))) throw new Error("Existing immutable installer failed verification; refusing overwrite");
  const stage = join(downloads, `.desktop-sync-${randomUUID()}`); await mkdir(stage, { mode: 0o700 });
  try {
    if (!exists) {
      const payload = join(stage, "release"); await mkdir(payload, { mode: 0o755 });
      const file = join(payload, "OryxLiveDesktop-Setup.exe");
      await downloadInstaller(origin + installerPath(release.version), file, release, new AbortController().signal, () => {}, fetcher);
      await chmod(file, 0o644);
      await writeFile(join(payload, "latest.json"), envelope, { mode: 0o644 });
      await rename(payload, version); // Install immutable bytes before publishing the feed.
    }
    if (!await present(alias) || !await validInstaller(alias, release)) await atomicFile(installer, alias);
    const checksum = createHash("sha256");
    for await (const chunk of createReadStream(installer)) checksum.update(chunk);
    const sidecar = join(stage, "checksum");
    await writeFile(sidecar, `${checksum.digest("hex")}  OryxLiveDesktop-Setup.exe\n`);
    await atomicFile(sidecar, `${alias}.sha256`);
    const newFeed = join(stage, "latest.json"); await writeFile(newFeed, envelope);
    await atomicFile(newFeed, latest); // Atomic final commit; prior version directories remain available.
    return release.version;
  } finally { await rm(stage, { recursive: true, force: true }); }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const downloads = process.argv[2]; const keyFile = process.argv[3];
    if (!downloads || !keyFile) throw new Error("Pass the downloads directory and trusted public-key file");
    const version = await syncDesktop({ downloads, publicKey: await readFile(keyFile, "utf8") });
    console.log(`Verified desktop ${version} is published locally.`);
  } catch (error) { console.error(error instanceof Error ? error.message : "Desktop synchronization failed"); process.exitCode = 1; }
}
