import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync } from "fflate";
import { engineDirectory, engines, viewerPolicy, type DocumentFormat } from "../apps/web/src/shared/attachments/engines.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
/** Extract only reviewed, pinned assets. Keep binary tooling out of normal web builds. */
export async function prepareViewers() {
  for (const format of Object.keys(engines) as DocumentFormat[]) {
    const engine = engines[format];
    const archive = await readFile(resolve(root, "viewers", engine.name, "vendor.bundle.zip"));
    if (createHash("sha256").update(archive).digest("hex") !== engine.archive) throw new Error(`${engine.name} bundle checksum mismatch`);
    const target = resolve(root, "apps/web/public", engineDirectory(format).slice(1));
    const entries = unzipSync(archive);
    const policy = entries["read-only.json"];
    if (!policy || new TextDecoder().decode(policy) !== JSON.stringify({ policy: viewerPolicy, source: engine.revision })) {
      throw new Error(`${engine.name} is not a pinned read-only viewer`);
    }
    for (const [name, bytes] of Object.entries(entries)) {
      if (name.startsWith("/") || name.includes("..") || name.includes("\\")) throw new Error("Unsafe viewer asset path");
      // Dodo's native editor host is replaced by the Oryx assigned-file sandbox.
      if (["index.html", "editor.js", "editor.css"].includes(name)) continue;
      const path = resolve(target, name);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, bytes);
    }
    await writeFile(resolve(target, "provenance.json"), await readFile(resolve(root, "viewers", engine.name, "provenance.json")));
    console.log(`Verified ${engine.name} ${engine.revision.slice(0, 12)}`);
  }
}
if (import.meta.main) await prepareViewers();
