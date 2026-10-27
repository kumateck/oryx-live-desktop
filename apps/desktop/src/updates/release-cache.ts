import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, rm } from "node:fs/promises";
import { join } from "node:path";
export function releaseCachePath(cache: string, origin: string): string {
  return join(cache, `release-${createHash("sha256").update(origin).digest("hex")}.json`);
}
export async function saveRelease(cache: string, origin: string, text: string): Promise<void> {
  await mkdir(cache, { recursive: true, mode: 0o700 });
  const target = releaseCachePath(cache, origin); const temporary = `${target}.${randomUUID()}.tmp`;
  try {
    const file = await open(temporary, "wx", 0o600);
    try { await file.writeFile(text); await file.sync(); } finally { await file.close(); }
    await rename(temporary, target);
  } finally { await rm(temporary, { force: true }); }
}
export async function cachedRelease(cache: string, origin: string): Promise<string | null> {
  try { return await readFile(releaseCachePath(cache, origin), "utf8"); } catch { return null; }
}
export async function metadataText(response: Response): Promise<string> {
  if (!response.body) throw new Error("The update server returned empty metadata");
  const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let bytes = 0;
  try {
    while (true) {
      const next = await reader.read(); if (next.done) break;
      bytes += next.value.length;
      if (bytes > 64 * 1024) throw new Error("Update metadata is too large");
      chunks.push(next.value);
    }
    return Buffer.concat(chunks).toString("utf8");
  } finally { await reader.cancel().catch(() => {}); }
}
