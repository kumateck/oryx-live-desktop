import { lazy, Suspense, type ReactNode } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { canOpenAttachment, type AttachedFile } from "./file-type";
import { useAttachmentOpen } from "./use-attachment-open";

const Viewer = lazy(() => import("./attachment-viewer"));
/** Every attachment open action enters the same viewer, including unsupported-format fallbacks. */
export function AttachmentOpener({ file, action = false, children }: { file: AttachedFile; action?: boolean; children?: ReactNode }) {
  const { state, open, close } = useAttachmentOpen(file);
  if (!canOpenAttachment(file)) return action ? null : <span>{children ?? file.name}</span>;
  const busy = state.status === "reading";
  return <span className={action ? "inline-flex shrink-0 print:hidden" : "min-w-0"}>
    <Button type="button" size={action ? "xs" : "sm"} variant={action ? "outline" : "link"} disabled={busy} aria-haspopup="dialog"
      {...(action ? { "aria-label": `View ${file.name}` } : {})}
      className={action ? undefined : "h-auto max-w-full justify-start whitespace-normal break-all p-0 text-left"}
      onClick={() => void open()}>{busy ? <Spinner /> : action ? <Eye /> : null}{action ? "View" : children ?? file.name}</Button>
    {state.status === "error" ? <span role="alert" className="block text-xs text-destructive">{state.message}</span> : null}
    {state.status === "open" ? <Suspense fallback={<span role="status">Loading attachment preview…</span>}><Viewer file={state.file} onClose={close} /></Suspense> : null}
  </span>;
}
