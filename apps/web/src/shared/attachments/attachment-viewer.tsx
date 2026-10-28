import { lazy, Suspense, useState } from "react";
import { Download, Eye, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { ViewerProblem } from "./craft-preview";
import { fileKindLabel, formatFileSize, kindFromName, type FileKind } from "./file-kind";
import { FileKindIcon } from "./file-kind-icon";
import type { AttachedFile } from "./file-type";
import { ImageViewer } from "./image-viewer";
import { DelimitedViewer, TextViewer } from "./text-viewer";
import { useAttachmentContent, useObjectUrl } from "./use-attachment-content";

const CraftPreview = lazy(() => import("./craft-preview"));
const viewable = new Set<FileKind>(["pdf", "docx", "xlsx", "csv", "json", "text", "image", "audio", "video"]);

const Busy = ({ text }: { text: string }) => <div role="status" className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground"><Spinner className="size-5" />{text}</div>;

const fallbackText: Partial<Record<FileKind, string>> = {
  "office-legacy": "Older Word, Excel and PowerPoint files (.doc, .xls, .ppt) cannot be shown in the app. Download the file to open it in Office, or ask for a PDF, .docx or .xlsx copy.",
  "office-other": "This Office format cannot be shown in the app yet. Download the file to open it, or ask for a PDF, .docx or .xlsx copy.",
  archive: "Compressed archives cannot be opened in the app. Download the file to see what it contains.",
};

/** For files the app cannot draw: say why, and offer the file itself. */
function Unviewable({ kind, name, href, reason }: { kind: FileKind; name: string; href: string | null; reason?: string }) {
  return <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-center">
    <FileKindIcon kind={kind} className="size-14" />
    <p className="font-medium">{fileKindLabel(kind)}</p>
    <p className="max-w-md text-sm text-muted-foreground">{reason ?? fallbackText[kind] ?? "This file type cannot be shown in the app. Download the file to open it."}</p>
    {href ? <Button asChild size="sm" variant="outline"><a href={href} download={name}><Download />Download file</a></Button> : null}
  </div>;
}

function Content({ file, blob, src, kind }: { file: AttachedFile; blob: Blob | null; src: string | null; kind: FileKind }) {
  // Documents and text are drawn from the bytes; only pictures, media and downloads need a local address.
  const local = useObjectUrl(src ? null : kind === "image" || kind === "audio" || kind === "video" || !viewable.has(kind) ? blob : null);
  const url = src ?? local;
  const [broken, setBroken] = useState(false);
  if (blob && (kind === "pdf" || kind === "docx" || kind === "xlsx")) {
    return <Suspense fallback={<Busy text="Loading document viewer…" />}><CraftPreview key={`${file.id}:${kind}`} file={{ ...file, blob, link: null }} format={kind} /></Suspense>;
  }
  if (blob && kind === "csv") return <DelimitedViewer blob={blob} name={file.name} />;
  if (blob && (kind === "text" || kind === "json")) return <TextViewer blob={blob} json={kind === "json"} />;
  if (!url) return <Busy text="Preparing file…" />;
  if (kind === "image") return broken
    ? <Unviewable kind={kind} name={file.name} href={url} reason={src ? "This image could not be loaded. Its link may have expired, or the format cannot be displayed by this browser." : "This image format cannot be displayed by this browser. Download the file to open it."} />
    : <ImageViewer key={url} src={url} name={file.name} onFailed={() => setBroken(true)} />;
  if (kind === "video" || kind === "audio") return broken
    ? <Unviewable kind={kind} name={file.name} href={url} reason="This media format cannot be played by this browser. Download the file to open it." />
    : <div className="flex min-h-0 flex-1 items-center justify-center rounded-md border bg-black/90 p-2">
      {kind === "video" ? <video src={url} controls playsInline aria-label={file.name} className="max-h-full max-w-full" onError={() => setBroken(true)} />
        : <audio src={url} controls aria-label={file.name} className="w-full max-w-xl" onError={() => setBroken(true)} />}
    </div>;
  return <Unviewable kind={kind} name={file.name} href={url} />;
}

/** One viewer for every attachment. Content is read once, its real type is detected, and it is shown read-only. */
export default function AttachmentViewer({ file, onClose }: { file: AttachedFile; onClose: () => void }) {
  const [attempt, setAttempt] = useState(0);
  const content = useAttachmentContent(file, attempt);
  const kind = content.state === "ready" ? content.kind : kindFromName(file.name);
  const details = [content.state === "ready" ? fileKindLabel(kind) : null, content.state === "ready" && content.size !== null ? formatFileSize(content.size) : null].filter(Boolean).join(" · ");
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent showCloseButton={false}
      className="h-[92dvh] max-h-[92dvh] gap-3 sm:max-w-[min(1400px,calc(100vw-4rem))]">
      <div className="flex min-w-0 shrink-0 items-center gap-3">
        <FileKindIcon kind={kind} className="size-9" />
        <div className="min-w-0 flex-1">
          <DialogTitle className="truncate" title={file.name}>{file.name}</DialogTitle>
          <DialogDescription className="truncate">{details || "Opening file…"}</DialogDescription>
        </div>
        <Badge variant="outline"><Eye />Read-only</Badge>
        <Button type="button" size="icon-sm" variant="ghost" aria-label="Close preview" onClick={onClose}><X /></Button>
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {content.state === "loading" ? <Busy text="Opening file…" />
          : content.state === "error" ? <ViewerProblem message={content.message} onRetry={() => setAttempt((value) => value + 1)} />
          : <Content key={`${attempt}:${content.kind}`} file={file} blob={content.blob} src={content.src} kind={content.kind} />}
      </div>
    </DialogContent>
  </Dialog>;
}
