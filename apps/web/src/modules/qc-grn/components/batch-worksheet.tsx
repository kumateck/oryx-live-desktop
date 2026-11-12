import { useMemo } from "react";
import { WorksheetPreview } from "@/shared/qc/worksheet-preview";
import type { DomainEntitiesFormsFormDto } from "@/shared/api/generated/forms";
import type { MaterialBatchArdRead, FormResponseDto } from "@/shared/ard-view/dto";
import { hasMeaningfulResponse } from "@/shared/ard-view/raw-data/print/section-utils";
import { buildFormResponsesFromSections } from "@/shared/ard-view/raw-data/form-utils";
import ArdTemplateBody from "@/shared/ard-view/templates/body";
import { MaterialSummary } from "@/shared/ard-view/templates/sumary/material";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { qcGrnAnalyticalApi } from "../api/qc-grn-api";
import { useBatchWorksheet } from "../hooks/use-batch-worksheet";
import { printsFilled, qcGrnAudit, qcWorksheetAccess } from "../lib/qc-grn";

const kindTitle = (details: MaterialBatchArdRead | null) => `${(details?.materialBatch as { material?: { kind?: number | null } } | undefined)?.material?.kind === 1 ? "Packaging" : "Raw"} material analytical raw data`;

/** The analytical raw data sheet of a batch: its header, then each test with its specification and recorded results (or blank lines to fill in). */
export function BatchWorksheet({ details, form, responses, blank }: { details: MaterialBatchArdRead | null; form: DomainEntitiesFormsFormDto | null; responses: readonly FormResponseDto[]; blank: boolean }) {
  const shown = useMemo(() => blank ? buildFormResponsesFromSections(form?.sections ?? undefined) : [...responses], [blank, form, responses]);
  return <div className="ard-print-root min-w-0 space-y-2">
    <MaterialSummary data={details ?? undefined} title={kindTitle(details)} />
    {form?.name ? <p className="text-sm font-semibold">{form.name}</p> : null}
    <ArdTemplateBody sections={form?.sections} responses={shown} showRemarks={!blank} noResponse={blank} />
  </div>;
}


type PrintProps = { batchId: string; filled: boolean; onClose: () => void };

export function BatchWorksheetPrint(props: PrintProps) {
  const batch = qcGrnAnalyticalApi.useGetApiV1MaterialArdMaterialBatchDetailsByMaterialBatchIdQuery({
    ...qcGrnAudit, materialBatchId: props.batchId,
  });
  const kind = batch.currentData?.materialBatch?.material?.kind;
  const unavailable = <PrintPreviewDialog title="Material worksheet" ready={false} onClose={props.onClose}
    note={batch.error ? apiErrorMessage(batch.error) : !batch.isLoading ? "This worksheet is unavailable." : null}>
    {batch.isLoading ? <DetailPageSkeleton label="Loading worksheet" /> : null}
  </PrintPreviewDialog>;
  if (batch.error || (kind !== 0 && kind !== 1)) return unavailable;
  return <PermissionGuard require={qcWorksheetAccess(kind)} fallback={unavailable}>
    <BatchWorksheetPrintContent {...props} />
  </PermissionGuard>;
}

function BatchWorksheetPrintContent({ batchId, filled, onClose }: PrintProps) {
  const sheet = useBatchWorksheet(batchId, { assignees: false, fresh: true });
  return <BatchWorksheetPreview sheet={sheet} filled={filled} onClose={onClose} />;
}

export function BatchWorksheetPreview({ sheet, filled, onClose }: {
  sheet: ReturnType<typeof useBatchWorksheet>;
  filled: boolean;
  onClose: () => void;
}) {
  const submitted = printsFilled(sheet.details?.materialBatch?.status ?? null);
  const hasResults = sheet.responses.some((row) => hasMeaningfulResponse(row));
  return <WorksheetPreview title={filled ? "Filled material worksheet" : "Blank analytical worksheet"}
    loading={sheet.loading} error={sheet.error} hasForm={Boolean(sheet.rawForm)}
    missingForm="This material has no test form linked, so there is nothing to print."
    filled={filled} hasResults={hasResults} submitted={submitted} onClose={onClose}>
    <BatchWorksheet details={sheet.details} form={sheet.rawForm} responses={sheet.responses} blank={!filled} />
  </WorksheetPreview>;
}
