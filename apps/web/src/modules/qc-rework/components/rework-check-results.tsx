import { useMemo, useState } from "react";
import { formsApi, type DomainEntitiesFormsFormDto, type DomainEntitiesFormsResponseDetailDto } from "@/shared/api/generated/forms";
import { qcApi } from "@/shared/api/generated/qc";
import { ConfirmActionDialog } from "@/shared/actions";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { Button } from "@/components/ui/button";
import { useVerifiedMutation } from "@/shared/workflows/use-verified-mutation";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { CertificatePreview } from "@/shared/ard-view/certificate-preview";
import { buildCoaCompliancePayload } from "@/shared/ard-view/raw-data/coa-compliance";
import { reworkAudit as audit, type ReworkDetail } from "../schemas/rework";
export function ReworkCheckResults({ record, response, form, kind, onDone }: {
  record: ReworkDetail; response: DomainEntitiesFormsResponseDetailDto; form: DomainEntitiesFormsFormDto; kind: 0 | 1; onDone: () => void;
}) {
  const material = Boolean(record.task.materialBatchId);
  const require = material ? kind === 1 ? "CanCheckPackagingMaterialTestResult" : "CanCheckRawMaterialTestResult" : "CanCheckProductTest";
  const command = useVerifiedMutation<{ response: DomainEntitiesFormsResponseDetailDto; form: DomainEntitiesFormsFormDto }>(require, { response, form });
  const [read] = formsApi.useLazyGetApiV1FormResponsesByFormResponseIdQuery();
  const [readForm] = qcApi.useLazyGetApiV1QcReworkTasksByIdFormQuery();
  const [generateMaterial] = formsApi.usePostApiV1FormGenerateCertificateByMaterialBatchIdMutation();
  const [generateProduct] = formsApi.usePostApiV1FormGenerateCertificateProductByBatchManufacturingRecordIdAndProductionActivityStepIdMutation();
  const [confirm, setConfirm] = useState(false);
  const inferred = useMemo(() => buildCoaCompliancePayload(form.sections ?? [], response.formResponses ?? []), [form, response]);
  const [compliance, setCompliance] = useState(inferred);
  if (response.checkedAt || response.approved || response.rejected) return <p role="status">This response has already been checked or decided.</p>;
  return <PermissionGuard require={require}><section className="space-y-3"><h2 className="font-semibold">Check the new test for QA</h2>
    <CertificatePreview kind={material ? "Material" : "Product"} facts={{ batchNumber: record.task.batchNumber ?? null, made: null, expires: null, arNumber: null, sampled: null, analysed: null, subject: record.task.batchNumber ?? "Rework test" }}
      sections={form.sections ?? []} responses={response.formResponses ?? []} compliance={compliance}
      onCompliance={(id, complies) => setCompliance((rows) => rows.map((row) => row.formSectionId === id ? { ...row, complies, requiresReview: false } : row))} />
    <Button disabled={!compliance.length || compliance.some((row) => row.requiresReview)} onClick={() => setConfirm(true)}>Send checked results to QA</Button>
    {confirm ? <ConfirmActionDialog title="Send checked rework results to QA?" description="Only this new response is submitted. Its current values and test definition are verified again." confirmLabel="Send to QA" busyLabel="Verifying…" destructive={false} require={require} onClose={() => setConfirm(false)} onConfirm={async () => {
      const responseId = record.task.newResponseId;
      if (!responseId || !form.id) return "The response or test definition identity is missing.";
      const failure = await command.run({ response, form }, async () => {
        const [current, definition] = await Promise.all([read({ ...audit, formResponseId: responseId }, false).unwrap(), readForm({ ...audit, id: record.task.id }, false).unwrap()]);
        return { response: current, form: definition };
      }, async () => {
        const body = compliance.flatMap((row) => row.formSectionId ? [{ formSectionId: row.formSectionId, complies: row.complies === true }] : []);
        const result = material && record.task.materialBatchId ? await generateMaterial({ ...audit, materialBatchId: record.task.materialBatchId, expectedResponseId: responseId, body })
          : record.task.batchManufacturingRecordId && record.productionActivityStepId ? await generateProduct({ ...audit, batchManufacturingRecordId: record.task.batchManufacturingRecordId, productionActivityStepId: record.productionActivityStepId, expectedResponseId: responseId, body }) : null;
        if (!result) throw new Error("The exact batch and production step are required.");
        if ("error" in result) throw new Error(apiErrorMessage(result.error));
      });
      if (!failure) onDone();
      return failure;
    }} /> : null}
  </section></PermissionGuard>;
}
