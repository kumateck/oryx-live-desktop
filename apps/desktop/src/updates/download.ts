import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, open, readdir, rename, rm, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { InstallerRelease } from "./manifest.ts";

export async function validInstaller(file: string, release: InstallerRelease): Promise<boolean> {
  try {
    const info = await stat(file);
    if (!info.isFile() || info.size !== release.size) return false;
    const hash = createHash("sha512");
    for await (const chunk of createReadStream(file)) hash.update(chunk);
    return hash.digest("hex") === release.sha512;
  } catch { return false; }
}
export async function downloadInstaller(url: string, file: string, release: InstallerRelease, signal: AbortSignal, progress: (received: number) => void, fetcher: typeof fetch = fetch): Promise<void> {
  const temporary = `${file}.${randomUUID()}.partial`;
  await mkdir(dirname(file), { recursive: true, mode: 0o700 });
  await rm(temporary, { force: true });
  try {
    const response = await fetcher(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(30 * 60_000)]), redirect: "error", credentials: "omit" });
    if (!response.ok || !response.body) throw new Error(`Installer download returned HTTP ${response.status}`);
    const length = response.headers.get("content-length");
    if (length !== null && Number(length) !== release.size) throw new Error("Installer download size does not match its signed release");
    const output = await open(temporary, "wx", 0o600);
    const reader = response.body.getReader(); const hash = createHash("sha512"); let received = 0;
    try {
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        if (signal.aborted) throw new Error("Download cancelled");
        received += next.value.length;
        if (received > release.size) throw new Error("Installer download exceeded its signed size");
        hash.update(next.value); await output.writeFile(next.value); progress(received);
      }
      if (received !== release.size || hash.digest("hex") !== release.sha512) throw new Error("Installer download failed integrity verification");
      await output.sync();
    } finally { await output.close(); await reader.cancel().catch(() => {}); }
    signal.throwIfAborted();
    await rm(file, { force: true });
    await rename(temporary, file);
  } finally { await rm(temporary, { force: true }); }
}


export async function clearInterruptedDownloads(cache: string): Promise<void> {
  try {
    for (const entry of await readdir(cache, { withFileTypes: true })) {
      if (entry.isFile() && /^[a-z0-9.-]+\.partial$/.test(entry.name)) await rm(join(cache, entry.name), { force: true });
    }
  } catch { /* A missing cache is normal on first launch. */ }
}
