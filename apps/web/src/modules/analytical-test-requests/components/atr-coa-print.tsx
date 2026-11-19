import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArdCertificatePrint } from "@/modules/pending-approvals/components/details/ard-certificate";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { useAtrWorksheet } from "../hooks/use-atr-worksheet";

/** A test request's certificate of analysis, printable once it has been generated from the checked results. */
export function AtrCoaPrint({ id, onClose }: { id: string; onClose: () => void }) {
  const sheet = useAtrWorksheet(id, { assignees: false });
  const generated = Boolean(sheet.responseId && sheet.responseDetail && "checkedAt" in sheet.responseDetail && sheet.responseDetail.checkedAt);
  if (!sheet.loading && !sheet.error && sheet.responseId && generated) return <ArdCertificatePrint responseId={sheet.responseId} onClose={onClose} />;
  const problem = sheet.error ?? (!sheet.loading ? "The certificate has not been generated yet. Generate it from the checked results first." : null);
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent>
    <DialogHeader><DialogTitle>Certificate of analysis</DialogTitle></DialogHeader>
    <DialogBody>{problem ? <p role="alert" className="text-sm">{problem}</p> : <div aria-label="Loading certificate" className="space-y-2"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-32 w-full" /></div>}</DialogBody>
    <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Close</Button></DialogFooter>
  </DialogContent></Dialog>;
}
