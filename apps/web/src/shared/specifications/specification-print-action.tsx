import { skipToken } from "@reduxjs/toolkit/query";
import { Button } from "@/components/ui/button";
import { analyticalApi } from "@/shared/api/generated/analytical";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { PrintButton } from "@/shared/print/print-button";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { SpecificationPrint } from "./specification-print";
import type { Specification, SpecificationSection } from "./specification-schema";

const printPermission = {
  raw: "CanExportRawMaterialSpecification",
  packaging: "CanExportPackagingMaterialSpecification",
  product: "CanExportProductSpecification",
} as const;

interface SpecificationPrintActionProps {
  kind: keyof typeof printPermission;
  title: string;
  specification: Specification;
  sections: readonly SpecificationSection[];
  subjectFacts: readonly { label: string; value: string | null }[];
}

function SpecificationPrintPreview({ kind, title, specification, sections, subjectFacts, onClose }: SpecificationPrintActionProps & { onClose: () => void }) {
  const args = { id: specification.id, module: "Quality Assurance", subModule: `${title} print` };
  const options = { refetchOnMountOrArgChange: true };
  const raw = analyticalApi.useGetRawMaterialSpecificationPrintHistoryQuery(kind === "raw" ? args : skipToken, options);
  const packaging = analyticalApi.useGetPackagingMaterialSpecificationPrintHistoryQuery(kind === "packaging" ? args : skipToken, options);
  const product = analyticalApi.useGetProductSpecificationPrintHistoryQuery(kind === "product" ? args : skipToken, options);
  const query = { raw, packaging, product }[kind];
  const history = query.isSuccess && !query.isFetching ? query.currentData : undefined;
  return <PrintPreviewDialog title={`${title} · ${specification.number}`} onClose={onClose} ready={Boolean(history)}>
    {history ? <SpecificationPrint title={title} specification={specification} sections={sections} subjectFacts={subjectFacts} history={history} />
      : query.isError && !query.isFetching ? <div role="alert" className="space-y-2 p-4">
        <p>{apiErrorMessage(query.error)}</p><Button variant="outline" onClick={() => void query.refetch()}>Retry</Button>
      </div> : <p role="status" className="p-4">Loading specification history…</p>}
  </PrintPreviewDialog>;
}

export function SpecificationPrintAction(props: SpecificationPrintActionProps) {
  return <PermissionGuard require={printPermission[props.kind]}>
    <PrintButton label="Print specification" size="default" preview={(close) => <SpecificationPrintPreview {...props} onClose={close} />} />
  </PermissionGuard>;
}
