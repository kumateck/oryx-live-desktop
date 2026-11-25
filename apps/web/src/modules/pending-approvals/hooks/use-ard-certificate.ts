import { useMemo } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { z } from "zod";
import { analyticalApi } from "@/shared/api/generated/analytical";
import { coaResponseApi as formsApi } from "@/shared/ard-view/coa-response-api";
import { productionApi } from "@/shared/api/generated/production";
import type { CertificateFacts } from "../components/details/ard-document";
import { queryState } from "../components/details/detail-state";
import { ardAnswersSchema as answers, ardFormSchema as formSchema, ardPersonSchema as person } from "../schemas/ard-result-schema";
import { ardSignatories } from "../lib/ard-signatories";
import { answerFails, answersByField } from "../lib/ard-results";
import { audit } from "../lib/approval-documents";

const { useGetApiV1FormResponsesByFormResponseIdQuery, useGetApiV1FormByFormIdQuery, useGetApiV1FormResponsesMaterialBatchByMaterialBatchIdQuery, useGetApiV1FormResponsesBmrByBatchManufacturingRecordIdQuery } = formsApi;
const { useGetApiV1MaterialArdMaterialBatchDetailsByMaterialBatchIdQuery, useGetApiV1ProductArdProductByProductIdQuery, useGetApiV1ProductArdProductBatchDetailsByBatchManufacturingRecordIdQuery,
  useGetApiV1QaAnalyticalTestsActivityStepByActivityStepIdQuery } = analyticalApi;
const { useGetApiV1ProductionScheduleManufacturingByBatchManufacturingRecordIdQuery } = productionApi;

const text = z.string().nullish().transform((value) => value?.trim() || null);
const item = z.object({ id: z.string().nullish(), name: text, code: text }).nullish();
const responseSchema = z.object({ form: item, materialBatch: item, batchManufacturingRecord: item, formResponses: answers, checkedBy: person, approvedBy: person, checkedAt: z.string().nullish(), productionActivityStepId: z.string().nullish(), approved: z.boolean().nullish() });
const materialSchema = z.object({ arNumber: text, grnNumber: text, specNumber: text, stpNumber: text, supplier: item, manufacturer: item, sampledDate: z.string().nullish(), sampledBy: person, quantityReceived: z.number().nullish(), quantitySampled: z.number().nullish(),
  materialBatch: z.object({ batchNumber: text, material: item, uoM: z.object({ symbol: text }).nullish(), manufacturingDate: z.string().nullish(), expiryDate: z.string().nullish(), analysedDate: z.string().nullish() }).nullish() });
const batchSchema = z.object({ batchNumber: text, manufacturingDate: z.string().nullish(), expiryDate: z.string().nullish(), productionScheduleProduct: z.object({ product: item }).nullish() });
const productArds = z.array(z.object({ form: item, stage: z.number().nullish(), specNumber: text, productStandardTestProcedure: z.object({ stpNumber: text }).nullish() })).nullish().transform((value) => value ?? []);
const productSchema = z.object({ arNumber: text, specNumber: text, sampledDate: z.string().nullish(), issueNumber: text, issueDate: z.string().nullish(), issuedBy: person, analysedDate: z.string().nullish() });
function useParsed<T>(schema: z.ZodType<T>, data: unknown): T | null {
  return useMemo(() => { const parsed = schema.safeParse(data ?? null); return parsed.success ? parsed.data : null; }, [schema, data]);
}
const atrSchema = z.object({ id: z.string().nullish() }).nullish();

/**
 * Everything one analytical result's certificate is made from, keyed by its test response: the response, the batch's
 * recorded answers, the data sheet's sections, the signatories and the certificate's facts. Shared by the approval page
 * and by printing a generated certificate from the test request list.
 */
export function useArdCertificate(id: string, options: { rejection?: boolean } = {}) {
  const query = useGetApiV1FormResponsesByFormResponseIdQuery({ ...audit, formResponseId: id }, { refetchOnMountOrArgChange: true });
  const response = useParsed(responseSchema, query.data);
  const formId = response?.form?.id ?? null;
  const materialBatchId = response?.materialBatch?.id ?? null;
  const recordId = materialBatchId ? null : response?.batchManufacturingRecord?.id ?? null;
  const formQuery = useGetApiV1FormByFormIdQuery(formId ? { ...audit, formId } : skipToken);
  const materialQuery = useGetApiV1MaterialArdMaterialBatchDetailsByMaterialBatchIdQuery(materialBatchId ? { ...audit, materialBatchId } : skipToken);
  const materialAnswers = useGetApiV1FormResponsesMaterialBatchByMaterialBatchIdQuery(materialBatchId ? { ...audit, materialBatchId } : skipToken);
  const batchQuery = useGetApiV1ProductionScheduleManufacturingByBatchManufacturingRecordIdQuery(recordId ? { ...audit, batchManufacturingRecordId: recordId } : skipToken);
  const productAnswers = useGetApiV1FormResponsesBmrByBatchManufacturingRecordIdQuery(recordId ? { ...audit, batchManufacturingRecordId: recordId } : skipToken);
  const form = useParsed(formSchema, query.data?.effectiveForm ?? formQuery.data);
  const material = useParsed(materialSchema, materialQuery.data);
  const batch = useParsed(batchSchema, batchQuery.data);
  const productId = batch?.productionScheduleProduct?.product?.id ?? null;
  const ardsQuery = useGetApiV1ProductArdProductByProductIdQuery(productId ? { ...audit, productId } : skipToken);
  const ards = useParsed(productArds, ardsQuery.data);
  // The product's data sheet for this form says which stage was tested.
  const ard = ards?.find((entry) => entry.form?.id === formId) ?? ards?.[0] ?? null;
  const stage = ard?.stage;
  const productQuery = useGetApiV1ProductArdProductBatchDetailsByBatchManufacturingRecordIdQuery(recordId && (stage === 0 || stage === 1 || stage === 2) ? { ...audit, batchManufacturingRecordId: recordId, testStage: stage } : skipToken);
  const product = useParsed(productSchema, productQuery.data);
  const batchAnswers = useParsed(answers, (materialBatchId ? materialAnswers.data : productAnswers.data) ?? []);
  const recorded = useMemo(() => {
    // The batch may carry answers from other data sheets; only this one's are being approved.
    const own = (batchAnswers ?? []).filter((entry) => !entry.responseId || entry.responseId === id);
    return answersByField(response?.formResponses.length ? response.formResponses : own);
  }, [batchAnswers, response, id]);
  const signatories = useMemo(() => ardSignatories(id, response?.formResponses ?? [], batchAnswers ?? [], response?.checkedBy, response?.approvedBy), [id, response, batchAnswers]);
  const sections = useMemo(() => [...(form?.sections ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [form]);
  const state = queryState(query);
  const loading = state.loading || formQuery.isLoading || materialQuery.isLoading || materialAnswers.isLoading || batchQuery.isLoading || productAnswers.isLoading || ardsQuery.isLoading || productQuery.isLoading;
  const failures = [...recorded.values()].filter(answerFails).length;
  // A product's investigation reopens, and its certificate is made from, the test request of the step that was tested.
  const approved = response?.approved === true;
  // The test request is also shown and printed with a product's certificate.
  const stepId = recordId ? response?.productionActivityStepId ?? null : null;
  const atrQuery = useGetApiV1QaAnalyticalTestsActivityStepByActivityStepIdQuery(stepId ? { ...audit, activityStepId: stepId } : skipToken);
  const parsedAtr = useParsed(atrSchema, atrQuery.data);
  // An investigation or certificate is made only once the results are rejected or approved.
  const atr = options.rejection || approved ? parsedAtr : null;
  const coaTarget = materialBatchId ? { materialBatchId } : atr?.id ? { analyticalTestRequestId: atr.id } : null;
  const certificateSections = sections.map((section) => ({ id: section.id, name: section.name, description: section.description, value: section.value, groupName: section.groupName,
    fields: [...(section.fields ?? [])].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0)) }));

  const isMaterial = Boolean(materialBatchId);
  const facts: CertificateFacts | null = response ? (() => {
    const isMaterial = Boolean(materialBatchId);
    const name = isMaterial ? material?.materialBatch?.material?.name ?? response.materialBatch?.name ?? null : batch?.productionScheduleProduct?.product?.name ?? response.batchManufacturingRecord?.name ?? null;
    const batchNumber = isMaterial ? material?.materialBatch?.batchNumber ?? null : batch?.batchNumber ?? response.batchManufacturingRecord?.code ?? null;
    const facts: CertificateFacts = {
          kind: isMaterial ? "material" : "product", name, code: isMaterial ? material?.materialBatch?.material?.code ?? response.materialBatch?.code ?? null : batch?.productionScheduleProduct?.product?.code ?? null,
          notes: query.data?.certificateNotes, batch: batchNumber, manufactured: isMaterial ? material?.materialBatch?.manufacturingDate : batch?.manufacturingDate, expires: isMaterial ? material?.materialBatch?.expiryDate : batch?.expiryDate,
          arNumber: isMaterial ? material?.arNumber ?? null : product?.arNumber ?? null, specNumber: isMaterial ? material?.specNumber ?? null : product?.specNumber ?? ard?.specNumber ?? null,
          sampled: isMaterial ? material?.sampledDate : product?.sampledDate, analysed: (isMaterial ? material?.materialBatch?.analysedDate : product?.analysedDate) ?? response.checkedAt };
    return facts;
  })() : null;
  return { query, response, state, loading, failures, approved, atr, atrQuery, coaTarget, sections, certificateSections, recorded, signatories, facts, isMaterial,
    material, batch, product, ard, materialBatchId };
}
