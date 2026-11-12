import type { ReactNode } from "react";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";

interface WorksheetPreviewProps {
  title: string;
  loading: boolean;
  error: string | null;
  hasForm: boolean;
  missingForm: string;
  filled: boolean;
  hasResults: boolean;
  submitted: boolean;
  onClose: () => void;
  children: ReactNode;
}

function printReadiness({ loading, error, hasForm, missingForm, filled, hasResults }: WorksheetPreviewProps) {
  if (loading) return { ready: false, note: null };
  if (error) return { ready: false, note: error };
  if (!hasForm) return { ready: false, note: missingForm };
  if (filled && !hasResults) return { ready: false, note: "There are no saved results to print yet." };
  return { ready: true, note: null };
}

export function WorksheetPreview(props: WorksheetPreviewProps) {
  const { title, onClose, loading, filled, submitted, hasResults, children } = props;
  const { ready, note } = printReadiness(props);
  return <PrintPreviewDialog title={title} ready={ready} note={note} onClose={onClose}>
    {loading ? <DetailPageSkeleton label="Loading worksheet" /> : <>
      {filled && !submitted && hasResults
        ? <p className="mb-2 text-sm font-semibold">Worksheet in progress · saved responses</p>
        : null}
      {children}
    </>}
  </PrintPreviewDialog>;
}
