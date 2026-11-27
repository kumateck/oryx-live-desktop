import { coaSections } from "@/shared/ard-view/raw-data/coa-sections";
import { CertificateRequestButtons, PendingCertificateEditButton } from "@/shared/ard-view/pending-certificate-actions";
import { buildCoaCompliancePayload, recordedCoaCompliance } from "@/shared/ard-view/raw-data/coa-compliance";
import { useNavigate } from "react-router";
import { useMemo, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { skipToken } from "@reduxjs/toolkit/query";
import { z } from "zod";
import { analyticalApi } from "@/shared/api/generated/analytical";
import { formsApi } from "@/shared/api/generated/forms";
import { GenerateCoaButton } from "@/modules/commercial-certificates/components/generate-coa-button";
import { productionApi } from "@/shared/api/generated/production";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { formatDate, formatMonthYear } from "@/shared/format/dates";
import { useAccess } from "@/shared/auth/use-access";
import { PrintButton } from "@/shared/print/print-button";
import { AtrRequestSection } from "@/shared/qc/atr-request-section";
import { ArdDocument } from "./ard-document";
import { useArdCertificate } from "../../hooks/use-ard-certificate";
import { ArdWorksheet } from "./ard-worksheet";
import { ardAnswersSchema as answers, ardFormSchema as formSchema, ardPersonSchema as person } from "../../schemas/ard-result-schema";
import { ardSignatories } from "../../lib/ard-signatories";
import { answerFails, answersByField } from "../../lib/ard-results";
import { approvalListPath, audit } from "../../lib/approval-documents";
import { ArdCertificate, printCertificatePermission } from "./ard-certificate";
import { DetailState, fullName, quantity, queryState } from "./detail-state";
import { oosPermission, StartOosDialog } from "./start-oos-dialog";

/** A rejection of these results earlier in the approval: who gave which reason, and the document's number. */
export interface ArdRejection { reason: string | null; code: string | null }

/**
 * Analytical raw data for a material or product batch: what was tested, the result recorded against each
 * specification, and whether each complies.
 */
export function ArdDetails({ id, rejection = null }: { id: string; rejection?: ArdRejection | null }) {
  const { has } = useAccess();
  const navigate = useNavigate();
  const [startingOos, setStartingOos] = useState(false);
  const { query, response, state, loading, failures, approved, atr, atrQuery, coaTarget, sections, certificateSections, worksheetSections, recorded, signatories, facts: loadedFacts,
    material, batch, product, ard, materialBatchId } = useArdCertificate(id, { rejection: Boolean(rejection) });
  return <DetailState {...state} loading={loading} value={response} label="certificate of analysis">{(data) => { const unit = material?.materialBatch?.uoM?.symbol;
    const isMaterial = Boolean(materialBatchId);
    const facts = loadedFacts ?? { kind: isMaterial ? "material" as const : "product" as const, name: null, code: null, batch: null, manufactured: null, expires: null, arNumber: null, specNumber: null, sampled: null, analysed: null };
    const { name, batch: batchNumber } = facts;
    return <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <PendingCertificateEditButton response={query.data} sections={coaSections(query.data?.effectiveForm?.sections ?? [], query.data?.coaHiddenFieldIds)}
          compliance={recordedCoaCompliance(coaSections(query.data?.effectiveForm?.sections ?? [], query.data?.coaHiddenFieldIds), query.data?.formResponses ?? [])}
          rechecked={buildCoaCompliancePayload(coaSections(query.data?.effectiveForm?.sections ?? [], query.data?.coaHiddenFieldIds), query.data?.formResponses ?? [])}
          onSaved={() => { void query.refetch(); }} />
        <CertificateRequestButtons response={query.data} onRequested={() => void navigate(approvalListPath("Response"))} />
        {rejection && has(oosPermission) ? <Button type="button" size="sm" variant="outline" className="text-destructive" onClick={() => setStartingOos(true)}><TriangleAlert />Start OOS investigation</Button> : null}
        {coaTarget ? <GenerateCoaButton approved={approved} target={coaTarget} /> : null}
        {sections.length > 0 ? <>
          {has(printCertificatePermission) || isMaterial ? <PrintButton label="Print COA" preview={(close) => <ArdCertificate sections={certificateSections} recorded={recorded} signatories={signatories} onClose={close} facts={facts} />} /> : null}
          <PrintButton label="Print Worksheet" preview={(close) => <ArdWorksheet sections={worksheetSections} recorded={recorded} signatories={signatories} onClose={close} facts={facts} />} />
        </> : null}
      </div>
      {startingOos && rejection && query.data ? <StartOosDialog evidence={query.data} responseId={id} onClose={() => setStartingOos(false)} subject={{ kind: isMaterial ? "material" : "product", materialBatchId, analyticalTestRequestId: atr?.id ?? null,
        coaNumber: rejection.code, name, batchNumber, reason: rejection.reason }} /> : null}
      {materialBatchId ? <div className="grid gap-3 lg:grid-cols-2">
        <DetailGroup title="Material"><DetailItem label="Material" value={[material?.materialBatch?.material?.name ?? data.materialBatch?.name, material?.materialBatch?.material?.code ?? data.materialBatch?.code].filter(Boolean).join(" · ")} />
          <DetailItem label="Batch" value={material?.materialBatch?.batchNumber} /><DetailItem label="Supplier" value={material?.supplier?.name} /><DetailItem label="Manufacturer" value={material?.manufacturer?.name} />
          <DetailItem label="Manufactured" value={formatMonthYear(material?.materialBatch?.manufacturingDate)} /><DetailItem label="Expires" value={formatMonthYear(material?.materialBatch?.expiryDate)} /></DetailGroup>
        <DetailGroup title="Sample"><DetailItem label="AR number" value={material?.arNumber} /><DetailItem label="GRN" value={material?.grnNumber} /><DetailItem label="Specification" value={material?.specNumber} /><DetailItem label="Test procedure" value={material?.stpNumber} />
          <DetailItem label="Sampled" value={[formatDate(material?.sampledDate), fullName(material?.sampledBy)].filter(Boolean).join(" by ")} />
          <DetailItem label="Received / sampled" value={material ? `${quantity(material.quantityReceived, unit)} / ${quantity(material.quantitySampled, unit)}` : null} /></DetailGroup>
      </div> : <div className="grid gap-3 lg:grid-cols-2">
        <DetailGroup title="Product"><DetailItem label="Product" value={batch?.productionScheduleProduct?.product?.name ?? data.batchManufacturingRecord?.name} /><DetailItem label="Batch" value={batch?.batchNumber ?? data.batchManufacturingRecord?.code} />
          <DetailItem label="Manufactured" value={formatMonthYear(batch?.manufacturingDate)} /><DetailItem label="Expires" value={formatMonthYear(batch?.expiryDate)} /></DetailGroup>
        <DetailGroup title="Sample"><DetailItem label="AR number" value={product?.arNumber} /><DetailItem label="Specification" value={product?.specNumber ?? ard?.specNumber} /><DetailItem label="Test procedure" value={ard?.productStandardTestProcedure?.stpNumber} />
          <DetailItem label="Sampled" value={formatDate(product?.sampledDate)} /><DetailItem label="Issued" value={[product?.issueNumber, formatDate(product?.issueDate), fullName(product?.issuedBy)].filter(Boolean).join(" · ")} /></DetailGroup>
      </div>}
      {data.checkedAt || data.checkedBy ? <p className="text-sm text-muted-foreground">Checked {[formatDate(data.checkedAt), fullName(data.checkedBy)].filter(Boolean).join(" by ")}.</p> : null}
      {sections.length === 0 ? <p role="alert" className="rounded-md border border-destructive/50 p-3 text-sm">The tests on this data sheet could not be read, so the results cannot be laid out.</p> : <>
        <p role="status" className={`rounded-md border p-3 text-sm ${failures > 0 ? "border-destructive/50 bg-destructive/5" : "bg-muted/50"}`}>{failures > 0 ? `${failures} ${failures === 1 ? "result does" : "results do"} not comply with the specification.` : "No result is recorded as not complying."}</p>
        <article aria-label="Certificate of analysis" className="print-sheet min-w-0">
          <ArdDocument sections={certificateSections} recorded={recorded} signatories={signatories} facts={facts} />
        </article></>}
      {isMaterial ? null : <AtrRequestSection data={atrQuery.data} response={query.data} />}
    </div>; }}</DetailState>;
}
