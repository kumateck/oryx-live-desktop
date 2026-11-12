import { skipToken } from "@reduxjs/toolkit/query";
import { useMemo, useState } from "react";
import { z } from "zod";
import { apiErrorMessage } from "@/shared/errors/api-error-message";
import { formSchema } from "@/shared/form-response/form-model";
import { storedAnswerRowsSchema } from "@/shared/form-response/stored-answer-schema";
import { latestAnswers } from "@/shared/form-response/use-answer-form";
import { formAssigneeSchema } from "@/shared/qc/assignments";
import { atrApi, atrFormsApi } from "../api/atr-api";
import { atrAudit } from "../lib/atr";
import { ardForStage, atrSchema, productArdsSchema } from "../schemas/atr-schema";

const responseSchema = z.object({ checkedAt: z.string().nullish(), approved: z.boolean().nullish(), rejected: z.boolean().nullish(), hasPendingApproval: z.boolean().nullish(),
  formResponses: storedAnswerRowsSchema.nullish() });

/** Where the certificate of a product test stands, from its response. Only an unchecked response can have its certificate generated. */
export function certificateState(response: z.infer<typeof responseSchema> | null): { canGenerate: boolean; label: string } {
  if (!response) return { canGenerate: false, label: "No test response" };
  if (response.approved) return { canGenerate: false, label: "Certificate approved" };
  if (response.rejected) return { canGenerate: false, label: "Revision required" };
  if (response.hasPendingApproval) return { canGenerate: false, label: "Pending approval" };
  if (response.checkedAt) return { canGenerate: false, label: "Certificate submitted" };
  return { canGenerate: true, label: "Generate certificate" };
}

/** One request's test: the request, the stage's test form, the response so far and who was given which fields. */
export function useAtrWorksheet(id: string, options: { fresh?: boolean; assignees?: boolean } = {}) {
  const refresh = { refetchOnMountOrArgChange: options.fresh ?? false };
  const atrQuery = atrApi.useGetApiV1QaAnalyticalTestsByIdQuery({ ...atrAudit, id }, refresh);
  const atr = useMemo(() => { const parsed = atrSchema.safeParse(atrQuery.data ?? null); return parsed.success ? parsed.data : null; }, [atrQuery.data]);
  const ards = atrApi.useGetApiV1ProductArdProductByProductIdQuery(atr?.productId ? { ...atrAudit, productId: atr.productId } : skipToken);
  const ard = useMemo(() => { const parsed = productArdsSchema.safeParse(ards.data ?? null); return parsed.success && atr ? ardForStage(parsed.data, atr.stage) : null; }, [ards.data, atr]);
  const formId = ard?.form?.id ?? null;
  const formQuery = atrFormsApi.useGetApiV1FormByFormIdQuery(formId ? { ...atrAudit, formId } : skipToken);
  const context = atr?.bmrId && atr.stepId ? { batchManufacturingRecordId: atr.bmrId, productionActivityStepId: atr.stepId } : null;
  const responseId = atrFormsApi.useGetApiV1FormResponseQuery(context ? { ...atrAudit, ...context } : skipToken, refresh);
  const id404 = Boolean(responseId.error && "status" in responseId.error && responseId.error.status === 404);
  const currentResponseId = typeof responseId.currentData === "string" && responseId.currentData ? responseId.currentData : null;
  const response = atrFormsApi.useGetApiV1FormResponsesByFormResponseIdQuery(currentResponseId ? { ...atrAudit, formResponseId: currentResponseId } : skipToken, refresh);
  const rawForm = response.data?.effectiveForm ?? formQuery.data ?? null;
  const form = useMemo(() => { const parsed = formSchema.safeParse(rawForm); return parsed.success ? parsed.data : null; }, [rawForm]);
  const parsedResponse = useMemo(() => { const parsed = responseSchema.safeParse(response.data ?? null); return parsed.success ? parsed.data : null; }, [response.data]);
  const assignees = atrFormsApi.useGetApiV1FormAssigneesBmrByBmrIdQuery(options.assignees !== false && atr?.bmrId ? { ...atrAudit, bmrId: atr.bmrId, ...(atr.stage === 0 || atr.stage === 1 || atr.stage === 2 ? { stage: atr.stage } : {}), ...(atr.stepId ? { productionActivityStepId: atr.stepId } : {}) } : skipToken, refresh);
  const assigned = useMemo(() => { const parsed = formAssigneeSchema.safeParse(assignees.currentData ?? null); return parsed.success ? parsed.data : null; }, [assignees.currentData]);
  const stored = useMemo(() => latestAnswers((parsedResponse?.formResponses ?? []).map((row) => ({ ...row, value: row.value ?? null, responseId: row.responseId ?? currentResponseId, createdAt: row.createdAt ?? null }))),
    [currentResponseId, parsedResponse]);
  const firstLoad = atrQuery.isLoading || ards.isLoading || (Boolean(formId) && formQuery.isLoading) || responseId.isLoading || response.isLoading;
  // The skeleton is for a request's first load only. A draft save refetches the response lookup, which has no data
  // until the first draft creates the response, so its isLoading turns true again; showing the skeleton then would
  // unmount the answer form and drop every unsaved answer.
  const [shown, setShown] = useState<string | null>(null);
  if (!firstLoad && shown !== id) setShown(id);
  const refreshing = options.fresh && (atrQuery.isFetching || responseId.isFetching || response.isFetching || assignees.isFetching);
  const loading = Boolean(refreshing || firstLoad && shown !== id);
  const error = atrQuery.error ? apiErrorMessage(atrQuery.error) : !atrQuery.isLoading && !atr ? "The server returned a test request the app could not read." : ards.error ? apiErrorMessage(ards.error)
    : responseId.error && !id404 ? apiErrorMessage(responseId.error) : response.error ? apiErrorMessage(response.error)
      : options.fresh && assignees.error && (!("status" in assignees.error) || assignees.error.status !== 404) ? apiErrorMessage(assignees.error)
        : formQuery.error && !response.data?.effectiveForm ? apiErrorMessage(formQuery.error) : null;
  return {
    atr, rawAtr: atrQuery.data ?? null, ard, form, rawForm, loading, error, formMissing: !loading && !form, stored, responses: response.data?.formResponses ?? [], assignees: assigned,
    certificate: response.data?.formResponses?.some(row => row.formulaRepairPending) ? { canGenerate: false, label: "Repaired formulas need recalculation" } : certificateState(parsedResponse), context,
    reload: () => { if (context) void responseId.refetch(); if (currentResponseId) void response.refetch(); if (options.assignees !== false && atr?.bmrId) void assignees.refetch(); },
    retry: () => { void atrQuery.refetch(); if (atr?.productId) void ards.refetch(); if (context) void responseId.refetch(); if (currentResponseId) void response.refetch(); if (options.assignees !== false && atr?.bmrId) void assignees.refetch(); if (formId) void formQuery.refetch(); },
  };
}
