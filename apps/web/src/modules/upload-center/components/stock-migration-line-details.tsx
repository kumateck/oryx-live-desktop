import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { LineDto } from "../api/stock-migration-api";

/** Source-reading and reconciliation notes remain visible to reviewers without correction rights. */
export function StockMigrationLineDetails({ line, onClose }: { line: LineDto; onClose: () => void }) {
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader><DialogTitle>Row {line.rowNumber}: preparation notes</DialogTitle>
        <DialogDescription>{line.sheetMaterialName ?? line.resolvedMaterialName} · {line.batchNumber}</DialogDescription></DialogHeader>
      <DialogBody className="space-y-3 text-sm">
        {(line.blockers ?? []).map((note) => <p key={`blocker-${note}`} className="break-words text-destructive">{note}</p>)}
        {(line.warnings ?? []).map((note) => <p key={`warning-${note}`} className="break-words">{note}</p>)}
        <ul className="list-disc space-y-2 pl-5">{(line.corrections ?? []).map((note) => <li key={note} className="break-words">{note}</li>)}</ul>
      </DialogBody>
      <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Close</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
