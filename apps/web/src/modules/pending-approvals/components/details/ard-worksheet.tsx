import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { ArdDocument, type ArdDocumentProps } from "./ard-document";

/** Review and print the detailed recorded readings and equations without changing the results. */
export function ArdWorksheet({ onClose, ...document }: ArdDocumentProps & { onClose: () => void }) {
  return <PrintPreviewDialog title={`Worksheet · ${document.facts.name ?? document.facts.kind}`} note="The worksheet contains the recorded readings, observations and formulas. Printing does not save or approve results." onClose={onClose}>
    <ArdDocument {...document} worksheet />
  </PrintPreviewDialog>;
}
