import { useMemo } from "react";
import type { AnalyticalTestRequestDto, FormResponseDto } from "@/shared/ard-view/dto";
import type { DomainEntitiesFormsFormDto } from "@/shared/api/generated/forms";
import { buildFormResponsesFromSections } from "@/shared/ard-view/raw-data/form-utils";
import ArdTemplateBody from "@/shared/ard-view/templates/body";
import { ProductSummary } from "@/shared/ard-view/templates/sumary/product";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { DetailPageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useAtrWorksheet } from "../hooks/use-atr-worksheet";

/** A product batch's analytical raw data for one stage: its header, then each test with its specification and results (or blank lines). */
export function AtrWorksheet({ atr, specNumber, stpNumber, form, responses, blank }: {
  atr: AnalyticalTestRequestDto | null; specNumber: string | null; stpNumber: string | null; form: DomainEntitiesFormsFormDto | null; responses: readonly FormResponseDto[]; blank: boolean;
}) {
  const shown = useMemo(() => blank ? buildFormResponsesFromSections(form?.sections ?? undefined) : [...responses], [blank, form, responses]);
  return <div className="ard-print-root min-w-0 space-y-2">
    <ProductSummary title="Product analytical raw data" data={atr ?? undefined} specNumber={specNumber ?? undefined} stpNumber={stpNumber ?? undefined} />
    <ArdTemplateBody sections={form?.sections} responses={shown} showRemarks={!blank} noResponse={blank} />
  </div>;
}

export function AtrWorksheetPrint({ id, filled, onClose }: { id: string; filled: boolean; onClose: () => void }) {
  const sheet = useAtrWorksheet(id);
  return <PrintPreviewDialog title={filled ? "Product analytical raw data" : "Blank product worksheet"} ready={!sheet.loading && Boolean(sheet.rawForm)} onClose={onClose}
    note={sheet.error ?? (sheet.formMissing ? "This product has no test form for this stage, so there is nothing to print." : null)}>
    {sheet.loading ? <DetailPageSkeleton label="Loading worksheet" /> : <AtrWorksheet atr={sheet.rawAtr} specNumber={sheet.ard?.specNumber ?? null} stpNumber={sheet.ard?.productStandardTestProcedure?.stpNumber ?? null}
      form={sheet.rawForm} responses={sheet.responses} blank={!filled} />}
  </PrintPreviewDialog>;
}
