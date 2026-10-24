import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { ArdDocument, type ArdDocumentProps } from "./ard-document";

/** Print-only preview of the same certificate displayed on the approval page. */
export function ArdCertificate({ onClose, ...document }: ArdDocumentProps & { onClose: () => void }) {
  return <PrintPreviewDialog title={`Certificate of analysis · ${document.facts.name ?? document.facts.kind}`} note="A preview of the certificate from the recorded results. Nothing is generated or saved." onClose={onClose}>
    <ArdDocument {...document} />
  </PrintPreviewDialog>;
}
