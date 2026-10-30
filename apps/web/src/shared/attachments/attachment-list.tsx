import { useState } from "react";
import { AttachmentOpener } from "./attachment-opener";
import { AttachmentPreviewButton } from "./attachment-preview-button";
import { fileKindLabel, kindFromName } from "./file-kind";
import { FileKindIcon } from "./file-kind-icon";
import { attachmentAddress, canOpenAttachment, safeFileLink, type AttachedFile } from "./file-type";
import { useObjectUrl } from "./use-attachment-content";
export { safeFileLink, isImageFile, type AttachedFile } from "./file-type";

/** A small picture of an image attachment; any other file, or an image that cannot load, shows its type icon. */
function Thumbnail({ file }: { file: AttachedFile }) {
  const kind = kindFromName(file.name);
  const local = useObjectUrl(kind === "image" && file.blob ? file.blob : null);
  const link = safeFileLink(file.link);
  const [failed, setFailed] = useState(false);
  const src = kind !== "image" || failed ? null : local ?? (link && !file.blob ? attachmentAddress(link) : null);
  return src ? <img src={src} referrerPolicy="no-referrer" alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} className="size-12 shrink-0 rounded-md border bg-muted object-cover" />
    : <FileKindIcon kind={kind} className="size-12" />;
}

/** Filenames and View both open the shared in-app viewer. The viewer reads the attached file itself. */
export function AttachmentList({ title, files, empty = "Nothing is attached." }: { title: string; files: readonly AttachedFile[]; empty?: string }) {
  return <section className="space-y-2"><h2 className="text-sm font-semibold">{title} ({files.length})</h2>
    {files.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{files.map((file) => {
      const kind = kindFromName(file.name);
      return <li key={file.id} className="flex min-w-0 items-center gap-3 rounded-md border p-2 text-sm">
        <Thumbnail file={file} />
        <span className="min-w-0 flex-1"><AttachmentOpener file={file} />
          <span className="block truncate text-muted-foreground">{canOpenAttachment(file) ? kind === "unknown" ? "File" : fileKindLabel(kind) : "No file to open"}</span></span>
        <AttachmentPreviewButton file={file} />
      </li>; })}</ul>}
  </section>;
}
