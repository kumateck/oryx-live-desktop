import { FileText } from "lucide-react";
import { AttachmentOpener } from "./attachment-opener";
import { AttachmentPreviewButton } from "./attachment-preview-button";
import { attachmentAddress, canOpenAttachment, safeFileLink, isImageFile, type AttachedFile } from "./file-type";
export { safeFileLink, isImageFile, type AttachedFile } from "./file-type";

/** Filenames and View both open the shared in-app viewer. The viewer reads the attached file itself. */
export function AttachmentList({ title, files, empty = "Nothing is attached." }: { title: string; files: readonly AttachedFile[]; empty?: string }) {
  return <section className="space-y-2"><h2 className="text-sm font-semibold">{title} ({files.length})</h2>
    {files.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{files.map((file) => {
      const link = safeFileLink(file.link);
      return <li key={file.id} className="flex min-w-0 items-center gap-3 rounded-md border p-3 text-sm">
        {link && isImageFile(file.name) ? <img src={file.blob ? link : attachmentAddress(link)} referrerPolicy="no-referrer" alt="" loading="lazy" className="size-12 shrink-0 rounded border object-cover" /> : <span className="flex size-12 shrink-0 items-center justify-center rounded border bg-muted"><FileText className="size-5 text-muted-foreground" /></span>}
        <span className="min-w-0 flex-1"><AttachmentOpener file={file} />{canOpenAttachment(file) ? null : <span className="block text-xs text-muted-foreground">No file to open</span>}</span>
        <AttachmentPreviewButton file={file} />
      </li>; })}</ul>}
  </section>;
}
