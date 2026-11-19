import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { Skeleton } from "@/shared/skeleton/skeleton";
import { useArdCertificate } from "../../hooks/use-ard-certificate";
import { ArdDocument, type ArdDocumentProps } from "./ard-document";

/** Printing a product batch's generated certificate of analysis. */
export const printCertificatePermission = "CanPrintProductCertificateOfAnalysis";

/** Print-only preview of the same certificate displayed on the approval page. */
export function ArdCertificate({ onClose, ...document }: ArdDocumentProps & { onClose: () => void }) {
  return <PrintPreviewDialog title={`Certificate of analysis · ${document.facts.name ?? document.facts.kind}`} note="A preview of the certificate from the recorded results. Nothing is generated or saved." onClose={onClose}>
    <ArdDocument {...document} />
  </PrintPreviewDialog>;
}

/** Loads a test response's certificate and opens its print preview: the same document as on the approval page. */
export function ArdCertificatePrint({ responseId, onClose }: { responseId: string; onClose: () => void }) {
  const certificate = useArdCertificate(responseId);
  const problem = certificate.state.error ?? (!certificate.loading && (!certificate.facts || certificate.sections.length === 0)
    ? "The certificate's results could not be read, so it cannot be printed." : null);
  if (certificate.loading || problem || !certificate.facts) return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent>
    <DialogHeader><DialogTitle>Certificate of analysis</DialogTitle></DialogHeader>
    <DialogBody>{problem ? <p role="alert" className="text-sm text-destructive">{problem}</p> : <div aria-label="Loading certificate" className="space-y-2"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-32 w-full" /></div>}</DialogBody>
    <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Close</Button></DialogFooter>
  </DialogContent></Dialog>;
  return <ArdCertificate facts={certificate.facts} sections={certificate.certificateSections} recorded={certificate.recorded} signatories={certificate.signatories} onClose={onClose} />;
}
