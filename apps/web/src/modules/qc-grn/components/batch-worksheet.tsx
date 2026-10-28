import { useMemo } from "react";
import type { DomainEntitiesFormsFormDto } from "@/shared/api/generated/forms";
import type { MaterialBatchArdRead, FormResponseDto } from "@/shared/ard-view/dto";
import { buildFormResponsesFromSections } from "@/shared/ard-view/raw-data/form-utils";
import ArdTemplateBody from "@/shared/ard-view/templates/body";
import { MaterialSummary } from "@/shared/ard-view/templates/sumary/material";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useBatchWorksheet } from "../hooks/use-batch-worksheet";

const kindTitle = (details: MaterialBatchArdRead | null) => `${(details?.materialBatch as { material?: { kind?: number | null } } | undefined)?.material?.kind === 1 ? "Packaging" : "Raw"} material analytical raw data`;

/** The analytical raw data sheet of a batch: its header, then each test with its specification and recorded results (or blank lines to fill in). */
export function BatchWorksheet({ details, form, responses, blank }: { details: MaterialBatchArdRead | null; form: DomainEntitiesFormsFormDto | null; responses: readonly FormResponseDto[]; blank: boolean }) {
  const shown = useMemo(() => blank ? buildFormResponsesFromSections(form?.sections ?? undefined) : [...responses], [blank, form, responses]);
  return <div className="ard-print-root min-w-0 space-y-2">
    <MaterialSummary data={details ?? undefined} title={kindTitle(details)} />
    <ArdTemplateBody sections={form?.sections} responses={shown} showRemarks={!blank} noResponse={blank} />
  </div>;
}

/** Prints a batch's worksheet: blank for the bench until results are in, then with them. */
export function BatchWorksheetPrint({ batchId, filled, onClose }: { batchId: string; filled: boolean; onClose: () => void }) {
  const sheet = useBatchWorksheet(batchId, { assignees: false });
  return <PrintPreviewDialog title={filled ? "Analytical raw data" : "Blank analytical worksheet"} ready={!sheet.loading && Boolean(sheet.rawForm)} onClose={onClose}
    note={sheet.error ?? (sheet.formMissing ? "This material has no test form linked, so there is nothing to print." : null)}>
    {sheet.loading ? <DetailPageSkeleton label="Loading worksheet" /> : <BatchWorksheet details={sheet.details} form={sheet.rawForm} responses={sheet.responses} blank={!filled} />}
  </PrintPreviewDialog>;
}
