import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AttachmentList } from "@/shared/attachments/attachment-list";
import type { Certification } from "./types";

export function CertificationFiles({ record, onClose }: { record: Certification; onClose: () => void }) {
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="sm:max-w-2xl">
    <DialogHeader><DialogTitle>Certificate {record.certificateNumber}</DialogTitle><DialogDescription>Attached supplier certification evidence.</DialogDescription></DialogHeader>
    <DialogBody><AttachmentList title="Attachments" files={record.attachments.map((file, index) => ({ id: file.id ?? `file-${index}`, name: file.name ?? "Attachment", link: file.link ?? null }))} /></DialogBody>
    <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Close attachments</Button></DialogFooter>
  </DialogContent></Dialog>;
}
