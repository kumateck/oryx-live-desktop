import { useState } from "react";
import { ExternalLink, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface AttachedFile { id: string; name: string; link: string | null }

/** Only web addresses are ever opened; anything else is shown by name alone. */
export const safeFileLink = (link: string | null) => link && /^https?:\/\//i.test(link) ? link : null;
const extension = (name: string) => /\.([a-z0-9]+)$/i.exec(name)?.[1]?.toLowerCase() ?? "";
export const isImageFile = (name: string) => ["png", "jpg", "jpeg", "webp", "gif"].includes(extension(name));
const isPdfFile = (name: string) => extension(name) === "pdf";

function Viewer({ file, link, onClose }: { file: AttachedFile; link: string; onClose: () => void }) {
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="sm:max-w-5xl">
      <DialogHeader><DialogTitle className="break-all">{file.name}</DialogTitle><DialogDescription>Attached file</DialogDescription></DialogHeader>
      <DialogBody className="flex min-h-[50vh] items-center justify-center rounded-md bg-muted/60 p-2">
        {isImageFile(file.name) ? <img src={link} alt={file.name} className="max-h-[70vh] max-w-full object-contain" /> : <iframe src={link} title={file.name} className="h-[70vh] w-full rounded border-0 bg-white" />}
      </DialogBody>
      <DialogFooter><Button asChild type="button" variant="outline"><a href={link} target="_blank" rel="noreferrer"><ExternalLink />Open in browser</a></Button><Button type="button" onClick={onClose}>Close</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}

/**
 * The files attached to a record. Images show a thumbnail; images and PDFs can be looked at without leaving
 * the page; every file can be opened in the browser.
 */
export function AttachmentList({ title, files, empty = "Nothing is attached." }: { title: string; files: readonly AttachedFile[]; empty?: string }) {
  const [viewing, setViewing] = useState<AttachedFile | null>(null);
  const viewingLink = viewing ? safeFileLink(viewing.link) : null;
  return <section className="space-y-2"><h2 className="text-sm font-semibold">{title} ({files.length})</h2>
    {files.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{files.map((file) => { const link = safeFileLink(file.link); const viewable = link && (isImageFile(file.name) || isPdfFile(file.name));
      return <li key={file.id} className="flex min-w-0 items-center gap-3 rounded-md border p-3 text-sm">
        {link && isImageFile(file.name) ? <img src={link} alt="" loading="lazy" className="size-12 shrink-0 rounded border object-cover" /> : <span className="flex size-12 shrink-0 items-center justify-center rounded border bg-muted"><FileText className="size-5 text-muted-foreground" /></span>}
        <span className="min-w-0 flex-1 break-all">{file.name}{link ? null : <span className="block text-xs text-muted-foreground">No link to open</span>}</span>
        {viewable ? <Button type="button" size="sm" variant="outline" aria-label={`View ${file.name}`} onClick={() => setViewing(file)}><Eye />View</Button> : null}
        {link ? <Button asChild type="button" size="icon-sm" variant="ghost"><a href={link} target="_blank" rel="noreferrer" aria-label={`Open ${file.name} in the browser`}><ExternalLink /></a></Button> : null}</li>; })}</ul>}
    {viewing && viewingLink ? <Viewer file={viewing} link={viewingLink} onClose={() => setViewing(null)} /> : null}
  </section>;
}
