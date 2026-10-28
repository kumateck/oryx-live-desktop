import { skipToken } from "@reduxjs/toolkit/query";
import { useMemo } from "react";
import { z } from "zod";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
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
export function useBatchWorksheet(batchId: string, options: { assignees?: boolean } = {}) {
  const arg = { ...qcGrnAudit, materialBatchId: batchId };
  const ard = qcGrnAnalyticalApi.useGetApiV1MaterialArdMaterialBatchByMaterialBatchIdQuery(arg);
  const details = qcGrnAnalyticalApi.useGetApiV1MaterialArdMaterialBatchDetailsByMaterialBatchIdQuery(arg);
  const responses = qcGrnFormsApi.useGetApiV1FormResponsesMaterialBatchByMaterialBatchIdQuery(arg);
  const assignees = qcGrnFormsApi.useGetApiV1FormAssigneesMaterialBatchByMaterialBatchIdQuery(options.assignees === false ? skipToken : arg);
  const formId = useMemo(() => { const parsed = ardSchema.safeParse(ard.data ?? null); return parsed.success ? parsed.data.form?.id ?? null : null; }, [ard.data]);
  const formQuery = qcGrnFormsApi.useGetApiV1FormByFormIdQuery(formId ? { ...qcGrnAudit, formId } : skipToken);
  const form = useMemo(() => { const parsed = formSchema.safeParse(formQuery.data ?? null); return parsed.success ? parsed.data : null; }, [formQuery.data]);
  const stored = useMemo(() => { const parsed = answerRows.safeParse(responses.data ?? []); return latestAnswers(parsed.success ? parsed.data : []); }, [responses.data]);
  const assigned = useMemo(() => { const parsed = formAssigneeSchema.safeParse(assignees.data ?? null); return parsed.success ? parsed.data : null; }, [assignees.data]);
  const loading = ard.isLoading || details.isLoading || responses.isLoading || (options.assignees !== false && assignees.isLoading) || (Boolean(formId) && formQuery.isLoading);
  const error = ard.error && !notFound(ard.error) ? apiErrorMessage(ard.error) : details.error ? apiErrorMessage(details.error) : formQuery.error && !notFound(formQuery.error) ? apiErrorMessage(formQuery.error) : null;
  return {
    loading, error, form, formMissing: !loading && !form && (notFound(ard.error) || notFound(formQuery.error) || !formId), details: details.data ?? null,
    stored, responses: responses.data ?? [], rawForm: formQuery.data ?? null, assignees: assigned,
    reload: () => { void responses.refetch(); if (options.assignees !== false) void assignees.refetch(); },
    retry: () => { void ard.refetch(); void details.refetch(); void responses.refetch(); if (formId) void formQuery.refetch(); },
  };
}
