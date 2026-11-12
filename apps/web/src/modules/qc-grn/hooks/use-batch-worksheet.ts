import { skipToken } from "@reduxjs/toolkit/query";
import { useMemo, useState } from "react";
import { z } from "zod";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import type { DomainEntitiesFormsFormDto } from "@/shared/api/generated/forms";
import { formSchema } from "@/shared/form-response/form-model";
import { storedAnswerRowsSchema } from "@/shared/form-response/stored-answer-schema";
import { latestAnswers } from "@/shared/form-response/use-answer-form";
import { formAssigneeSchema } from "@/shared/qc/assignments";
import { qcGrnAnalyticalApi, qcGrnFormsApi } from "../api/qc-grn-api";
import { qcGrnAudit } from "../lib/qc-grn";

const ardSchema = z.object({ form: z.object({ id: z.string().nullish(), name: z.string().nullish() }).nullish() });
const answerRows = storedAnswerRowsSchema;
const notFound = (error: object | undefined) => Boolean(error && "status" in error && error.status === 404);

/** One batch's analytical raw data: the test form linked to its material, the batch details, the answers so far and who was given which fields. */
export function useBatchWorksheet(batchId: string, options: { assignees?: boolean; fresh?: boolean } = {}) {
  const arg = { ...qcGrnAudit, materialBatchId: batchId };
  const ard = qcGrnAnalyticalApi.useGetApiV1MaterialArdMaterialBatchByMaterialBatchIdQuery(arg);
  const refresh = { refetchOnMountOrArgChange: options.fresh ?? false };
  const details = qcGrnAnalyticalApi.useGetApiV1MaterialArdMaterialBatchDetailsByMaterialBatchIdQuery(arg, refresh);
  const responses = qcGrnFormsApi.useGetApiV1FormResponsesMaterialBatchByMaterialBatchIdQuery(arg, refresh);
  const assignees = qcGrnFormsApi.useGetApiV1FormAssigneesMaterialBatchByMaterialBatchIdQuery(options.assignees === false ? skipToken : arg, refresh);
  const linkedFormId = useMemo(() => { const parsed = ardSchema.safeParse(ard.data ?? null); return parsed.success ? parsed.data.form?.id ?? null : null; }, [ard.data]);
  const formId = details.currentData?.worksheetFormId ?? linkedFormId;
  const scopedResponseId = details.currentData?.worksheetResponseId;
  const latestResponseId = useMemo(() => {
    if (scopedResponseId !== undefined) return scopedResponseId;
    // Compatibility with servers that predate worksheetResponseId.
    return responses.currentData?.filter((row) => row.responseId).sort(
      (a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
    )[0]?.responseId ?? null;
  }, [scopedResponseId, responses.currentData]);
  const rows = useMemo(() => latestResponseId
    ? (responses.currentData ?? []).filter((row) => row.responseId === latestResponseId)
    : [], [latestResponseId, responses.currentData]);
  const formQuery = qcGrnFormsApi.useGetApiV1FormByFormIdQuery(formId ? { ...qcGrnAudit, formId, ...(latestResponseId ? { responseId: latestResponseId } : {}) } : skipToken);
  // On the first save the form query gains a response ID. Keep this batch's editor mounted while the pinned form loads.
  const [loadedForm, setLoadedForm] = useState<{ batchId: string; form: DomainEntitiesFormsFormDto } | null>(null);
  if (formQuery.currentData && (loadedForm?.batchId !== batchId || loadedForm.form !== formQuery.currentData))
    setLoadedForm({ batchId, form: formQuery.currentData });
  const rawForm = formQuery.currentData ??
    (!options.fresh && loadedForm?.batchId === batchId && loadedForm.form.id === formId ? loadedForm.form : null);
  const form = useMemo(() => { const parsed = formSchema.safeParse(rawForm); return parsed.success ? parsed.data : null; }, [rawForm]);
  const stored = useMemo(() => { const parsed = answerRows.safeParse(rows); return latestAnswers(parsed.success ? parsed.data : []); }, [rows]);
  const assigned = useMemo(() => { const parsed = formAssigneeSchema.safeParse(assignees.currentData ?? null); return parsed.success ? parsed.data : null; }, [assignees.currentData]);
  const refreshing = options.fresh && (details.isFetching || responses.isFetching || assignees.isFetching);
  const loading = refreshing || ard.isLoading || details.isLoading || responses.isLoading || assignees.isLoading || (Boolean(formId) && !rawForm && formQuery.isFetching);
  const error = ard.error && !notFound(ard.error) ? apiErrorMessage(ard.error) : details.error ? apiErrorMessage(details.error)
    : responses.error && !notFound(responses.error) ? apiErrorMessage(responses.error)
      : assignees.error && !notFound(assignees.error) ? apiErrorMessage(assignees.error)
        : formQuery.error && !notFound(formQuery.error) ? apiErrorMessage(formQuery.error) : null;
  return {
    loading, error, form, formMissing: !loading && !form && (notFound(ard.error) || notFound(formQuery.error) || !formId), details: details.currentData ?? null,
    stored, responses: rows, rawForm, assignees: assigned,
    reload: () => { void responses.refetch(); if (options.assignees !== false) void assignees.refetch(); },
    retry: () => { void ard.refetch(); void details.refetch(); void responses.refetch(); if (options.assignees !== false) void assignees.refetch(); if (formId) void formQuery.refetch(); },
  };
}
