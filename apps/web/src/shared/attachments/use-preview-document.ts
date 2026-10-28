import { useEffect, useState } from "react";
import { attachmentAddress, attachmentLimit, documentFormat, safeFileLink, type AttachedFile } from "./file-type";
import { engineDirectory, engines, type DocumentFormat } from "./engines";
import { readBounded } from "./read-file";
import { validateInWorker } from "./validation-client";

export type PreviewDocument = { state: "loading" } | { state: "error"; message: string }
  | { state: "ready"; format: DocumentFormat; bytes: ArrayBuffer; wasm: ArrayBuffer; glue: string; channel: string };

export function usePreviewDocument(file: AttachedFile, attempt: number): PreviewDocument {
  const [result, setResult] = useState<PreviewDocument>({ state: "loading" });
  const format = documentFormat(file);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90_000);
    let closed = false;
    setResult({ state: "loading" });
    async function load() {
      const link = safeFileLink(file.link);
      if ((!link && !file.blob) || !format) throw new Error("This attachment does not have a supported preview link.");
      const options: RequestInit = { signal: controller.signal, credentials: "omit", referrerPolicy: "no-referrer" };
      const assets = engineDirectory(format);
      const engine = engines[format].name;
      const read = async (url: string, limit: number) => readBounded(await fetch(url, options), limit);
      const fileBytes = file.blob
        ? file.blob.size > attachmentLimit ? Promise.reject(new Error("The preview supports files up to 16 MiB.")) : file.blob.arrayBuffer()
        : link ? read(attachmentAddress(link), attachmentLimit) : Promise.reject(new Error("No file to open."));
      const [bytes, glueBytes, wasm] = await Promise.all([
        fileBytes.then((bytes) => validateInWorker(bytes, format, controller.signal)),
        read(`${assets}/dodo-${engine}.js`, 1024 * 1024),
        read(`${assets}/dodo-${engine}_bg.wasm`, 64 * 1024 * 1024),
      ]);
      if (!closed) setResult({ state: "ready", format, bytes, wasm, glue: new TextDecoder().decode(glueBytes), channel: Array.from(crypto.getRandomValues(new Uint8Array(16)), (value) => value.toString(16).padStart(2, "0")).join("") });
    }
    void load().catch((error: Error) => {
      if (!closed) {
        setResult({ state: "error", message: controller.signal.aborted ? "The preview took too long to load. Check your connection and retry." : error.message || "The preview could not be opened. Please retry." });
        controller.abort();
      }
    }).finally(() => clearTimeout(timer));
    return () => { closed = true; clearTimeout(timer); controller.abort(); };
  }, [file.link, file.blob, format, attempt]);
  return result;
}
