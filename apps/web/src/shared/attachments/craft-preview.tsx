import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { DocumentFormat } from "./engines";
import type { AttachedFile } from "./file-type";
import { previewFrame, previewSandbox } from "./preview-frame";
import { usePreviewDocument, type PreviewDocument } from "./use-preview-document";

const message = z.object({ channel: z.string(), kind: z.enum(["ready", "error"]) });
const engineNames: Record<DocumentFormat, string> = { pdf: "PDF viewer", docx: "Word viewer", xlsx: "spreadsheet viewer" };

function Starting({ format }: { format: DocumentFormat | undefined }) {
  return <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/40 text-sm text-muted-foreground">
    <Spinner className="size-5" /><span>Starting document viewer…</span>
    <span className="sr-only">{format ? `Opening the ${engineNames[format]}` : null}</span>
  </div>;
}

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
    const base = file.name.slice(0, 460).replace(/\.[a-z0-9]{1,5}$/i, "") || "Attachment";
    frame.current?.contentWindow?.postMessage({ channel: document.channel, kind: "initialize", name: `${base}.${document.format}`, bytes, wasm }, "*", [bytes, wasm]);
  };
  if (state === "error") return <ViewerProblem message="The document viewer could not show this file." onRetry={onRetry} />;
  return <div className="relative min-h-0 flex-1 overflow-hidden rounded-md border bg-background">
    <iframe ref={frame} title={`Preview of ${file.name}`} sandbox={previewSandbox} srcDoc={source} referrerPolicy="no-referrer"
      allow="camera 'none'; microphone 'none'; geolocation 'none'; clipboard-read 'none'; clipboard-write 'none'; display-capture 'none'"
      className="size-full" onLoad={start} />
    {state === "loading" ? <Starting format={document.format} /> : <p role="status" className="sr-only">Read-only attachment</p>}
  </div>;
}

/** A failure inside the viewer area, with a way to try again. */
export function ViewerProblem({ message: text, onRetry }: { message: string; onRetry?: () => void }) {
  return <div role="alert" className="flex min-h-48 flex-1 flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-center text-sm">
    <p className="max-w-md">{text}</p>
    {onRetry ? <Button variant="outline" size="sm" onClick={onRetry}>Retry preview</Button> : null}
  </div>;
}

export default function CraftPreview({ file, format }: { file: AttachedFile; format?: DocumentFormat }) {
  const [attempt, setAttempt] = useState(0);
  const document = usePreviewDocument(file, attempt, format);
  const retry = () => setAttempt((value) => value + 1);
  if (document.state === "loading") return <div className="relative min-h-48 flex-1 rounded-md border" aria-label="Loading document preview"><Starting format={format} /></div>;
  if (document.state === "error") return <ViewerProblem message={document.message} onRetry={retry} />;
  return <EngineFrame key={document.channel} document={document} file={file} onRetry={retry} />;
}
