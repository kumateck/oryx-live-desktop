import { useEffect, useRef, useState } from "react";
import type { AttachedFile } from "./file-type";

type OpenState = { status: "idle" } | { status: "reading" } | { status: "error"; message: string } | { status: "open"; file: AttachedFile };
const readTimeout = "The file took too long to load. Check your connection and try again.";

/** Resolves protected reads without storing bearer tokens or temporary object URLs on attachment records. */
export function useAttachmentOpen(file: AttachedFile) {
  const [state, setState] = useState<OpenState>({ status: "idle" });
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const open = async () => {
    if (request.current) return;
    if (!file.read || file.blob) { setState({ status: "open", file }); return; }
    const controller = new AbortController();
    request.current = controller;
    setState({ status: "reading" });
    let timedOut = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let abortRead = () => {};
    try {
      const deadline = new Promise<never>((_resolve, reject) => {
        abortRead = () => reject(new Error("File opening cancelled."));
        controller.signal.addEventListener("abort", abortRead, { once: true });
        timer = setTimeout(() => { timedOut = true; controller.abort(); }, 90_000);
      });
      const blob = await Promise.race([file.read(controller.signal), deadline]);
      if (!controller.signal.aborted) {
        const { read: _read, ...metadata } = file;
        setState({ status: "open", file: { ...metadata, blob } });
      }
    } catch (error) {
      if (!controller.signal.aborted || timedOut) setState({ status: "error", message: timedOut ? readTimeout
        : error instanceof Error ? error.message : "The file could not be opened. Try again." });
    } finally {
      clearTimeout(timer);
      controller.signal.removeEventListener("abort", abortRead);
      if (request.current === controller) request.current = null;
    }
  };
  return { state, open, close: () => setState({ status: "idle" }) };
}
