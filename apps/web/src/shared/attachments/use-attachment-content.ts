import { useEffect, useState } from "react";
import { detectKind, kindFromName, type FileKind } from "./file-kind";
import { attachmentAddress, attachmentLimit, safeFileLink, type AttachedFile } from "./file-type";
import { readBounded } from "./read-file";

export type AttachmentContent = { state: "loading" } | { state: "error"; message: string }
  /** `src` is set when the browser loads the file straight from its link (pictures and media); `blob` when its bytes were read. */
  | { state: "ready"; kind: FileKind; blob: Blob | null; src: string | null; size: number | null };

const tooLarge = "This file is larger than 20 MB, so it cannot be viewed here.";

/** Loads the file once, then works out what it really is from its bytes, name and served type. */
export function useAttachmentContent(file: AttachedFile, attempt: number): AttachmentContent {
  const [result, setResult] = useState<AttachmentContent>({ state: "loading" });
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90_000);
    let closed = false;
    setResult({ state: "loading" });
    // Pictures and media load straight from their link: the file store need not allow scripted reads, and video streams.
    const named = kindFromName(file.name);
    const direct = safeFileLink(file.link);
    if (!file.blob && direct && (named === "image" || named === "audio" || named === "video")) {
      setResult({ state: "ready", kind: named, blob: null, src: attachmentAddress(direct), size: null });
      return () => { closed = true; clearTimeout(timer); controller.abort(); };
    }
    async function load(): Promise<{ blob: Blob; mime: string | null }> {
      if (file.blob) {
        if (file.blob.size > attachmentLimit) throw new Error(tooLarge);
        return { blob: file.blob, mime: file.blob.type || null };
      }
      const link = safeFileLink(file.link);
      if (!link) throw new Error("This attachment has no file to open.");
      const response = await fetch(attachmentAddress(link), { signal: controller.signal, credentials: "omit", referrerPolicy: "no-referrer" });
      const mime = response.headers.get("Content-Type");
      // Proxies and expired links can answer with a web page; never show that as if it were the attachment.
      if (response.ok && /^text\/html/i.test(mime ?? "") && !/\.html?$/i.test(file.name)) {
        await response.body?.cancel();
        throw new Error("The file could not be loaded. Its link may have expired. Close this preview and refresh the record.");
      }
      const bytes = await readBounded(response, attachmentLimit).catch((error: Error) => {
        throw /size limit/.test(error.message) ? new Error(tooLarge) : error;
      });
      return { blob: new Blob([bytes], mime ? { type: mime } : {}), mime };
    }
    void load().then(async ({ blob, mime }) => {
      const head = new Uint8Array(await blob.slice(0, 64 * 1024).arrayBuffer());
      // A zip's file list sits at its end, so Word and Excel detection needs the whole file.
      const bytes = head[0] === 0x50 && head[1] === 0x4b ? new Uint8Array(await blob.arrayBuffer()) : head;
      if (!closed) setResult({ state: "ready", blob, src: null, size: blob.size, kind: detectKind(file.name, mime, bytes) });
    }).catch((error: unknown) => {
      if (closed) return;
      setResult({ state: "error", message: controller.signal.aborted ? "The file took too long to load. Check your connection and retry."
        : error instanceof Error && error.message ? error.message : "The file could not be opened. Please retry." });
    }).finally(() => clearTimeout(timer));
    return () => { closed = true; clearTimeout(timer); controller.abort(); };
  }, [file.blob, file.link, file.name, attempt]);
  return result;
}

/** A temporary local address for content already in memory, released when the viewer closes. */
export function useObjectUrl(blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) { setUrl(null); return; }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}
