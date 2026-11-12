import { useMemo } from "react";
import { WorksheetPreview } from "@/shared/qc/worksheet-preview";
import type { AnalyticalTestRequestDto, FormResponseDto } from "@/shared/ard-view/dto";
import type { DomainEntitiesFormsFormDto } from "@/shared/api/generated/forms";
import { hasMeaningfulResponse } from "@/shared/ard-view/raw-data/print/section-utils";
import { buildFormResponsesFromSections } from "@/shared/ard-view/raw-data/form-utils";
import ArdTemplateBody from "@/shared/ard-view/templates/body";
import { ProductSummary } from "@/shared/ard-view/templates/sumary/product";
import { useAtrWorksheet } from "../hooks/use-atr-worksheet";
import { atrPrintsFilled } from "../lib/atr";

/** A product batch's analytical raw data for one stage: its header, then each test with its specification and results (or blank lines). */
export function AtrWorksheet({ atr, specNumber, stpNumber, form, responses, blank }: {
  atr: AnalyticalTestRequestDto | null; specNumber: string | null; stpNumber: string | null; form: DomainEntitiesFormsFormDto | null; responses: readonly FormResponseDto[]; blank: boolean;
}) {
  const shown = useMemo(() => blank ? buildFormResponsesFromSections(form?.sections ?? undefined) : [...responses], [blank, form, responses]);
  return <div className="ard-print-root min-w-0 space-y-2">
    <ProductSummary title="Product analytical raw data" data={atr ?? undefined} specNumber={specNumber ?? undefined} stpNumber={stpNumber ?? undefined} />
    {form?.name ? <p className="text-sm font-semibold">{form.name}</p> : null}
    <ArdTemplateBody sections={form?.sections} responses={shown} showRemarks={!blank} noResponse={blank} />
  </div>;
}

export function AtrWorksheetPrint({ id, filled, onClose }: { id: string; filled: boolean; onClose: () => void }) {
  const sheet = useAtrWorksheet(id, { fresh: true, assignees: false });
  return <AtrWorksheetPreview sheet={sheet} filled={filled} onClose={onClose} />;
}

export function AtrWorksheetPreview({ sheet, filled, onClose }: {
  sheet: ReturnType<typeof useAtrWorksheet>;
  filled: boolean;
  onClose: () => void;
}) {
  const submitted = atrPrintsFilled(sheet.atr?.status ?? null);
  const hasResults = sheet.responses.some((row) => hasMeaningfulResponse(row));
  return <WorksheetPreview title={filled ? "Filled product worksheet" : "Blank product worksheet"}
    loading={sheet.loading} error={sheet.error} hasForm={Boolean(sheet.rawForm)}
    missingForm="This product has no test form for this stage, so there is nothing to print."
    filled={filled} hasResults={hasResults} submitted={submitted} onClose={onClose}>
    <AtrWorksheet atr={sheet.rawAtr} specNumber={sheet.ard?.specNumber ?? null} stpNumber={sheet.ard?.productStandardTestProcedure?.stpNumber ?? null}
      form={sheet.rawForm} responses={sheet.responses} blank={!filled} />
  </WorksheetPreview>;
}
