import type { DomainEntitiesAnalyticalTestRequestsAnalyticalTestRequestDto as AtrDto } from "@/shared/api/generated/analytical";
import type { DomainEntitiesFormsResponseDetailDto as ResponseDto } from "@/shared/api/generated/forms";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { PrintButton } from "@/shared/print/print-button";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { AtrRequestForm, atrRequestPrintPermission, parseAtrRequest } from "./atr-request-form";

/** The product's Analytical Test Request (with `response`, its test response, naming who generated and approved the certificate), shown as the paper form with a print action for holders of the print key. */
export function AtrRequestSection({ data, response }: { data: AtrDto | null | undefined; response?: ResponseDto | null | undefined }) {
  const request = parseAtrRequest(data, response);
  if (!request) return null;
  return <section aria-label="Analytical test request" className="space-y-2">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-sm font-semibold">Analytical test request</h3>
      <PermissionGuard require={atrRequestPrintPermission}>
        <PrintButton label="Print request form" preview={(close) => <PrintPreviewDialog title="Analytical test request" note="The request form as QA raised it. Nothing is saved." onClose={close}>
          <AtrRequestForm request={request} />
        </PrintPreviewDialog>} />
      </PermissionGuard>
    </div>
    <article className="print-sheet min-w-0 overflow-x-auto"><AtrRequestForm request={request} /></article>
  </section>;
}
