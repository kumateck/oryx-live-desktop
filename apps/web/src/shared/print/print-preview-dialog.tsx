import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { formatDateTime } from "@/shared/format/dates";
import { DesktopTabPortal } from "../workspace-tabs/context";

function Sheet({ children, printedBy, landscape }: { children: ReactNode; printedBy: string | null; landscape: boolean }) {
  return <article className={landscape ? "print-sheet print-sheet-landscape" : "print-sheet"}>{children}
    <footer className="print-footer">Printed {formatDateTime(new Date().toISOString()) ?? ""}{printedBy ? ` by ${printedBy}` : ""}</footer></article>;
}

/**
 * Shows a document as it will print, with a button that prints it. Printing only ever prints: it never
 * saves or sends anything. `children` is the document, built from the `print-sheet` pieces; give `note`
 * when the document leaves something out, so the reader knows before printing.
 */
export function PrintPreviewDialog({ title, note, ready = true, children, onClose, landscape = false }: { title: string; note?: string | null | undefined; ready?: boolean; children: ReactNode; onClose: () => void; landscape?: boolean }) {
  const printedBy = useCurrentUser()?.name ?? null;
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className={landscape ? "sm:max-w-6xl" : "sm:max-w-4xl"}>
      <DialogHeader><DialogTitle>Print preview · {title}</DialogTitle>
        <DialogDescription>{note ?? "This is the document as it will be printed."}</DialogDescription></DialogHeader>
      <DialogBody className="overflow-x-auto rounded-md bg-muted/60 p-3"><Sheet printedBy={printedBy} landscape={landscape}>{children}</Sheet></DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Close</Button>
        <Button type="button" disabled={!ready} onClick={() => window.print()}><Printer />Print</Button>
      </DialogFooter>
    </DialogContent>
    {/* The copy the printer sees. On screen it is hidden; in print it is the only thing shown. */}
    <DesktopTabPortal>{createPortal(<div className="print-portal" aria-hidden="true"><Sheet printedBy={printedBy} landscape={landscape}>{children}</Sheet></div>, document.body)}</DesktopTabPortal>
  </Dialog>;
}
