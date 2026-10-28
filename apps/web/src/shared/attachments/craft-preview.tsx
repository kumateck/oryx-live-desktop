import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/shared/skeleton/skeleton";
import type { AttachedFile } from "./file-type";
import { previewFrame, previewSandbox } from "./preview-frame";
import { usePreviewDocument, type PreviewDocument } from "./use-preview-document";

const message = z.object({ channel: z.string(), kind: z.enum(["ready", "error"]) });
function EngineFrame({ file, document, onRetry }: { file: AttachedFile; document: Extract<PreviewDocument, { state: "ready" }>; onRetry: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const source = useMemo(() => previewFrame(document.format, document.glue, document.channel, window.location.origin), [document]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.origin !== "null") return;
      const value = message.safeParse(event.data);
      if (value.success && value.data.channel === document.channel) setState((current) => current === "error" ? current : value.data.kind);
    };
    window.addEventListener("message", receive);
    const timer = setTimeout(() => setState((current) => current === "loading" ? "error" : current), 60_000);
    return () => { window.removeEventListener("message", receive); clearTimeout(timer); };
  }, [document.channel]);
  const start = () => {
    const bytes = document.bytes.slice(0);
    const wasm = document.wasm.slice(0);
    frame.current?.contentWindow?.postMessage({ channel: document.channel, kind: "initialize", name: `${file.name.slice(0, 460).replace(/\.(pdf|docx|xlsx)$/i, "")}.${document.format}`, bytes, wasm }, "*", [bytes, wasm]);
  };
  return <div className="flex h-full min-h-0 flex-col gap-2">
    {state === "error" ? <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive">The document viewer could not render this file. Please retry.<Button size="sm" variant="outline" onClick={onRetry}>Retry preview</Button></div>
      : <p role="status" className="text-xs text-muted-foreground">{state === "loading" ? "Starting document viewer…" : "Read-only attachment"}</p>}
    {state !== "error" ? <iframe ref={frame} title={`Preview of ${file.name}`} sandbox={previewSandbox} srcDoc={source} referrerPolicy="no-referrer"
      allow="camera 'none'; microphone 'none'; geolocation 'none'; clipboard-read 'none'; clipboard-write 'none'; display-capture 'none'"
      className="min-h-0 w-full flex-1 rounded border bg-background" onLoad={start} /> : null}
  </div>;
}
export default function CraftPreview({ file }: { file: AttachedFile }) {
  const [attempt, setAttempt] = useState(0);
  const document = usePreviewDocument(file, attempt);
  if (document.state === "loading") return <div role="status" aria-label="Loading document preview" className="space-y-3"><Skeleton className="h-6 w-64" /><Skeleton className="h-[48vh] w-full" /></div>;
  if (document.state === "error") return <div role="alert" className="space-y-3 p-4 text-sm"><p>{document.message}</p><Button variant="outline" size="sm" onClick={() => setAttempt((value) => value + 1)}>Retry preview</Button></div>;
  return <EngineFrame key={document.channel} document={document} file={file} onRetry={() => setAttempt((value) => value + 1)} />;
}
