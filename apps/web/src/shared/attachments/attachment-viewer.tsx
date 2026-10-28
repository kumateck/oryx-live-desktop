import { lazy, Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { attachmentAddress, documentFormat, isImageFile, safeFileLink, type AttachedFile } from "./file-type";

const CraftPreview = lazy(() => import("./craft-preview"));
export default function AttachmentViewer({ file, onClose }: { file: AttachedFile; onClose: () => void }) {
  const [localLink, setLocalLink] = useState<string | null>(null);
  useEffect(() => {
    if (!file.blob || !isImageFile(file.name)) return;
    const url = URL.createObjectURL(file.blob);
    setLocalLink(url);
    return () => URL.revokeObjectURL(url);
  }, [file.blob, file.name]);
  const link = file.blob ? localLink : safeFileLink(file.link);
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="h-[90dvh] sm:max-w-[calc(100vw-3rem)]">
      <DialogHeader><DialogTitle className="break-all">{file.name}</DialogTitle><DialogDescription>Read-only attachment viewer.</DialogDescription></DialogHeader>
      <DialogBody className="flex min-h-0 flex-col">
        {(link || file.blob) && documentFormat(file) ? <Suspense fallback={<p role="status">Loading document viewer…</p>}><CraftPreview key={file.id} file={file} /></Suspense>
          : link && isImageFile(file.name) ? <img src={file.blob ? link : attachmentAddress(link)} referrerPolicy="no-referrer" alt={file.name} className="m-auto max-h-full max-w-full object-contain" />
          : file.blob && isImageFile(file.name) && !localLink ? <p role="status">Preparing file preview…</p> : <p role="alert">This file format is not supported by the viewer yet.</p>}
      </DialogBody>
      <DialogFooter><Button type="button" onClick={onClose}>Close preview</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
