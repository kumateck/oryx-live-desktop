import { useMemo } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { qcApi } from "@/shared/api/generated/qc";
import { formsApi } from "@/shared/api/generated/forms";
import { materialsApi } from "@/shared/api/generated/materials";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formSchema } from "@/shared/form-response/form-model";
import { storedAnswerRowsSchema } from "@/shared/form-response/stored-answer-schema";
import { latestAnswers } from "@/shared/form-response/use-answer-form";
import { TestEntry } from "@/shared/qc/test-entry";
import { assignedFieldIds, formAssigneeSchema } from "@/shared/qc/assignments";
import { RecordState } from "@/shared/workflows/record-state";
import { PageHeader } from "@/shared/navigation/page-header";
import { reworkDetailSchema, reworkAudit as audit, reworkPath, type ReworkDetail } from "../schemas/rework";
import { ReworkResponsePreview } from "./response-preview";
import { ReworkCheckResults } from "./rework-check-results";
const responseSchema = z.object({ id: z.string().min(1), form: z.object({ id: z.string().min(1) }), formResponses: storedAnswerRowsSchema.nullish(), materialSamplingId: z.string().nullish(), checkedAt: z.string().nullish(), approved: z.boolean().nullish(), rejected: z.boolean().nullish() });
function ReworkTest({ record }: { record: ReworkDetail }) {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const task = record.task;
  const responseId = task.newResponseId;
  const responseQuery = formsApi.useGetApiV1FormResponsesByFormResponseIdQuery(responseId ? { ...audit, formResponseId: responseId } : skipToken);
  const response = useMemo(() => responseSchema.safeParse(responseQuery.data), [responseQuery.data]);
  const formId = response.success ? response.data.form.id : null;
  const formQuery = qcApi.useGetApiV1QcReworkTasksByIdFormQuery({ ...audit, id: task.id });
  const form = formSchema.safeParse(formQuery.data);
  const batch = materialsApi.useGetApiV1MaterialBatchByBatchIdQuery(task.materialBatchId ? { ...audit, batchId: task.materialBatchId } : skipToken);
  const materialInfo = materialsApi.useGetApiV1MaterialByMaterialIdQuery(batch.data?.material?.id ? { ...audit, materialId: batch.data.material.id } : skipToken);
  const materialAssignments = formsApi.useGetApiV1FormAssigneesMaterialBatchByMaterialBatchIdQuery(task.materialBatchId ? { ...audit, materialBatchId: task.materialBatchId } : skipToken);
  const productAssignments = formsApi.useGetApiV1FormAssigneesBmrByBmrIdQuery(task.batchManufacturingRecordId && record.productionActivityStepId ? {
    ...audit, bmrId: task.batchManufacturingRecordId, productionActivityStepId: record.productionActivityStepId,
    ...(record.productStage === 0 || record.productStage === 1 || record.productStage === 2 ? { stage: record.productStage } : {}),
  } : skipToken);
  const assignment = useMemo(() => formAssigneeSchema.safeParse(task.materialBatchId ? materialAssignments.data : productAssignments.data), [task.materialBatchId, materialAssignments.data, productAssignments.data]);
  const mine = useMemo(() => assignedFieldIds(assignment.success ? assignment.data : null, user?.id ?? null), [assignment, user?.id]);
  const stored = useMemo(() => latestAnswers(response.success ? (response.data.formResponses ?? []).map((row) => ({ ...row, responseId: responseId ?? null })) : []), [response, responseId]);
  const context = useMemo(() => ({ ...(task.materialBatchId ? { materialBatchId: task.materialBatchId, materialSamplingId: response.success ? response.data.materialSamplingId ?? null : null } : {
    batchManufacturingRecordId: task.batchManufacturingRecordId ?? "", productionActivityStepId: record.productionActivityStepId ?? "",
  }), responseId: responseId ?? "" }), [task.materialBatchId, task.batchManufacturingRecordId, record.productionActivityStepId, responseId, response]);
  const kind = materialInfo.data?.kind;
  const require = task.materialBatchId ? kind === 1 ? "CanStartPackagingMaterialTest" : "CanStartRawMaterialTest" : "CanStartProductTest";
  const failure = responseQuery.error || formQuery.error || batch.error || materialInfo.error || materialAssignments.error || productAssignments.error;
  const loading = responseQuery.isLoading || formQuery.isLoading || batch.isLoading || materialInfo.isLoading || materialAssignments.isLoading || productAssignments.isLoading;
  if (!responseId) return <p role="status">Start the new cycle from the rework detail first.</p>;
  if (task.status !== 1) return <><ReworkResponsePreview id={responseId} title="New test results" />
    {task.status === 2 && formQuery.data && responseQuery.data && (!task.materialBatchId || kind === 0 || kind === 1) ? <ReworkCheckResults record={record} response={responseQuery.data} form={formQuery.data} kind={kind ?? 0} onDone={() => void navigate(reworkPath(task.id))} /> : null}</>;
  const ready = !loading && (!task.materialBatchId || kind === 0 || kind === 1) && response.success && response.data.id === responseId && !response.data.checkedAt && !response.data.approved && !response.data.rejected && form.success && assignment.success;
  return <RecordState loading={loading} data={ready && form.success ? form.data : null} error={failure ? apiErrorMessage(failure) : null} retry={() => { void responseQuery.refetch(); if (formId) void formQuery.refetch(); }}>
    {(definition) => mine.size ? <PermissionGuard require={require}><TestEntry form={definition} mine={mine} stored={stored} context={context} audit={audit} require={require}
      summary={<p className="text-sm text-muted-foreground">These answers belong only to new response {responseId}. Earlier rejected answers are preserved.</p>}
      onReload={() => void responseQuery.refetch()} onDone={() => void navigate(reworkPath(task.id))} /></PermissionGuard>
      : <p role="status">No fields of this test are assigned to you. Ask the QC supervisor to assign or reassign the batch test.</p>}
  </RecordState>;
}
export function ReworkTestPage() {
  const { id = "" } = useParams();
  const query = qcApi.useGetApiV1QcReworkTasksByIdQuery({ ...audit, id });
  const parsed = reworkDetailSchema.safeParse(query.data);
  return <article className="min-w-0 space-y-4"><PageHeader title="Rework test" crumbs={[{ label: "QC rework", to: "/qc/rework-tasks" }, { label: "Task", to: reworkPath(id) }, { label: "Test" }]} />
    <RecordState loading={query.isLoading} data={parsed.success ? parsed.data : null} error={query.error ? apiErrorMessage(query.error) : null} retry={() => void query.refetch()}>{(record) => <ReworkTest record={record} />}</RecordState>
  </article>;
}
