import { skipToken } from "@reduxjs/toolkit/query";
import { useMemo } from "react";
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
export function useAtrWorksheet(id: string) {
  const atrQuery = atrApi.useGetApiV1QaAnalyticalTestsByIdQuery({ ...atrAudit, id });
  const atr = useMemo(() => { const parsed = atrSchema.safeParse(atrQuery.data ?? null); return parsed.success ? parsed.data : null; }, [atrQuery.data]);
  const ards = atrApi.useGetApiV1ProductArdProductByProductIdQuery(atr?.productId ? { ...atrAudit, productId: atr.productId } : skipToken);
  const ard = useMemo(() => { const parsed = productArdsSchema.safeParse(ards.data ?? null); return parsed.success && atr ? ardForStage(parsed.data, atr.stage) : null; }, [ards.data, atr]);
  const formId = ard?.form?.id ?? null;
  const formQuery = atrFormsApi.useGetApiV1FormByFormIdQuery(formId ? { ...atrAudit, formId } : skipToken);
  const form = useMemo(() => { const parsed = formSchema.safeParse(formQuery.data ?? null); return parsed.success ? parsed.data : null; }, [formQuery.data]);
  const context = atr?.bmrId && atr.stepId ? { batchManufacturingRecordId: atr.bmrId, productionActivityStepId: atr.stepId } : null;
  const responseId = atrFormsApi.useGetApiV1FormResponseQuery(context ? { ...atrAudit, ...context } : skipToken);
  const id404 = Boolean(responseId.error && "status" in responseId.error && responseId.error.status === 404);
  const currentResponseId = typeof responseId.data === "string" && responseId.data ? responseId.data : null;
  const response = atrFormsApi.useGetApiV1FormResponsesByFormResponseIdQuery(currentResponseId ? { ...atrAudit, formResponseId: currentResponseId } : skipToken);
  const parsedResponse = useMemo(() => { const parsed = responseSchema.safeParse(response.data ?? null); return parsed.success ? parsed.data : null; }, [response.data]);
  const assignees = atrFormsApi.useGetApiV1FormAssigneesBmrByBmrIdQuery(atr?.bmrId ? { ...atrAudit, bmrId: atr.bmrId, ...(atr.stage === 0 || atr.stage === 1 || atr.stage === 2 ? { stage: atr.stage } : {}), ...(atr.stepId ? { productionActivityStepId: atr.stepId } : {}) } : skipToken);
  const assigned = useMemo(() => { const parsed = formAssigneeSchema.safeParse(assignees.data ?? null); return parsed.success ? parsed.data : null; }, [assignees.data]);
  const stored = useMemo(() => latestAnswers((parsedResponse?.formResponses ?? []).map((row) => ({ ...row, value: row.value ?? null, responseId: row.responseId ?? currentResponseId, createdAt: row.createdAt ?? null }))),
    [currentResponseId, parsedResponse]);
  const loading = atrQuery.isLoading || ards.isLoading || (Boolean(formId) && formQuery.isLoading) || responseId.isLoading || response.isLoading;
  const error = atrQuery.error ? apiErrorMessage(atrQuery.error) : !atrQuery.isLoading && !atr ? "The server returned a test request the app could not read." : ards.error ? apiErrorMessage(ards.error)
    : responseId.error && !id404 ? apiErrorMessage(responseId.error) : null;
  return {
    atr, rawAtr: atrQuery.data ?? null, ard, form, rawForm: formQuery.data ?? null, loading, error, formMissing: !loading && !form, stored, responses: response.data?.formResponses ?? [], assignees: assigned,
    certificate: certificateState(parsedResponse), context,
    reload: () => { if (context) void responseId.refetch(); if (currentResponseId) void response.refetch(); if (atr?.bmrId) void assignees.refetch(); },
    retry: () => { void atrQuery.refetch(); if (atr?.productId) void ards.refetch(); },
  };
}
