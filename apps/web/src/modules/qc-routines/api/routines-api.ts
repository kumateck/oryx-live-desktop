import { z } from "zod";
import { api } from "@/shared/api/base-api";
import {
  audit, certificateSchema, definitionSchema, executionSchema, microbialAudit, periodSchema, requirementSchema, routineArdSchema, setupAudit, trackContextSchema, waterAudit,
} from "../lib/routines";

// The routine endpoints are not in the server's API description, so they are declared here and their answers checked.
const root = "/api/v1/qc/routines";
const heads = (scope: { module: string; subModule: string }) => ({ Module: scope.module, SubModule: scope.subModule });
const id = z.string().min(1);
const nullableId = z.string().nullish().transform((value) => value || null);
const all = { type: "RoutineQc" as const, id: "all" };
const water = { type: "WaterQuality" as const, id: "all" };
const done = <T>(tags: T[]) => (_result: unknown, error: unknown) => error ? [] : tags;

export const routinesApi = api.enhanceEndpoints({ addTagTypes: ["RoutineQc", "WaterQuality"] }).injectEndpoints({ endpoints: (build) => ({
  listRoutines: build.query({ query: () => ({ url: root, headers: heads(audit) }), transformResponse: (raw: unknown) => z.array(executionSchema).parse(raw ?? []), providesTags: [all] }),
  getRoutine: build.query({ query: (routineId: string) => ({ url: `${root}/${routineId}`, headers: heads(audit) }), transformResponse: (raw: unknown) => executionSchema.parse(raw), providesTags: [all] }),
  getTrack: build.query({ query: (trackId: string) => ({ url: `${root}/tracks/${trackId}`, headers: heads(audit) }), transformResponse: (raw: unknown) => trackContextSchema.parse(raw), providesTags: [all] }),
  getRoutineCertificate: build.query({ query: (certificateId: string) => ({ url: `${root}/certificates/${certificateId}`, headers: heads(audit) }), transformResponse: (raw: unknown) => certificateSchema.parse(raw) }),
  createRoutine: build.mutation({
    query: (body: { origin: number; type: number; routineDefinitionId: string | null; routineDate: string; doneById: string; periodStart?: string; periodEnd?: string;
      emergencyTrigger: string | null; emergencyReason: string | null; rndTrialBatchId: string | null }) => ({ url: root, method: "POST", body, headers: heads(audit) }),
    transformResponse: (raw: unknown) => id.parse(raw), invalidatesTags: done([all]),
  }),
  addSample: build.mutation({
    query: ({ routineId, ...body }: { routineId: string; samplingPoint?: string; areaName?: string; collectedAt: string }) => ({ url: `${root}/${routineId}/samples`, method: "POST", body, headers: heads(audit) }),
    invalidatesTags: done([all]),
  }),
  /** The assignment of a track's worksheet, or nothing before it is assigned. */
  getTrackAssignment: build.query({ query: (trackId: string) => ({ url: "/api/v1/form/form-assignee", params: { routineTrackId: trackId }, headers: heads(audit) }),
    transformResponse: (raw: unknown) => nullableId.parse(raw), providesTags: [all] }),
  getTrackResponse: build.query({ query: (trackId: string) => ({ url: "/api/v1/form/response", params: { routineTrackId: trackId }, headers: heads(audit) }),
    transformResponse: (raw: unknown) => nullableId.parse(raw), providesTags: [all] }),
  assignTrack: build.mutation({
    query: ({ trackId, formId, fieldIds, assigneeId }: { trackId: string; formId: string; fieldIds: readonly string[]; assigneeId: string }) => ({ url: "/api/v1/form/assignees", method: "POST", headers: heads(audit),
      body: { routineTrackId: trackId, formId, formFieldAssignees: fieldIds.map((formFieldId) => ({ formFieldId, assigneeId })) } }),
    invalidatesTags: done([all]),
  }),
  submitTrack: build.mutation({ query: (trackId: string) => ({ url: `${root}/tracks/${trackId}/submit-approval`, method: "POST", headers: heads(audit) }), invalidatesTags: done([all]) }),
  generateCertificate: build.mutation({ query: (sampleId: string) => ({ url: `${root}/samples/${sampleId}/certificate`, method: "POST", headers: heads(audit) }),
    transformResponse: (raw: unknown) => id.parse(raw), invalidatesTags: done([all, water]) }),

  listDefinitions: build.query({ query: () => ({ url: `${root}/definitions`, headers: heads(setupAudit) }), transformResponse: (raw: unknown) => z.array(definitionSchema).parse(raw ?? []), providesTags: [all] }),
  createDefinition: build.mutation({ query: (body: { name: string; type: number; cadence: number }) => ({ url: `${root}/definitions`, method: "POST", body, headers: heads(setupAudit) }), invalidatesTags: done([all]) }),
  listRoutineArds: build.query({ query: () => ({ url: `${root}/ards`, headers: heads(setupAudit) }), transformResponse: (raw: unknown) => z.array(routineArdSchema).parse(raw ?? []), providesTags: [all] }),
  createRoutineArd: build.mutation({
    query: (body: { type: number; analysisType: number; formId: string; specNumber: string; description: string; coaItems: CoaItemBody[] }) => ({ url: `${root}/ards`, method: "POST", body, headers: heads(setupAudit) }),
    invalidatesTags: done([all]),
  }),
  listRequirements: build.query({ query: () => ({ url: "/api/v1/qc/microbial-requirements", headers: heads(microbialAudit) }), transformResponse: (raw: unknown) => z.array(requirementSchema).parse(raw ?? []), providesTags: [all] }),
  createRequirement: build.mutation({
    query: (body: { subject: number; materialId?: string; productId?: string; stage?: number; required: boolean; reason: string }) => ({ url: "/api/v1/qc/microbial-requirements", method: "POST", body, headers: heads(microbialAudit) }),
    invalidatesTags: done([all]),
  }),
  /** A microbial ARD for a material or finished product, on the ARD endpoints with the microbial analysis type. */
  createMicrobialArd: build.mutation({
    query: ({ product, ...body }: { product: boolean; stpId: string; formId: string; specNumber: string; description: string; materialId?: string; coaItems: Omit<CoaItemBody, "includeOnCoa">[] }) => ({
      url: product ? "/api/v1/product-ard" : "/api/v1/material-ard", method: "POST", headers: heads(microbialAudit), body: { ...body, analysisType: 1, ...(product ? { stage: 2 } : {}) } }),
    invalidatesTags: done([all]),
  }),

  listPeriods: build.query({ query: () => ({ url: "/api/v1/qc/water-quality/periods", headers: heads(waterAudit) }), transformResponse: (raw: unknown) => z.array(periodSchema).parse(raw ?? []), providesTags: [water] }),
  activatePeriod: build.mutation({
    query: (body: { routineCertificateId: string; validFrom: string; validUntil: string; retrospectiveReason?: string }) => ({ url: "/api/v1/qc/water-quality/periods", method: "POST", body, headers: heads(waterAudit) }),
    invalidatesTags: done([water]),
  }),
  recordWaterUse: build.mutation({
    query: (body: { waterQualityPeriodId: string; usedAt: string; batchManufacturingRecordId?: string; productionActivityStepId?: string; rndTrialBatchId?: string }) => ({
      url: "/api/v1/qc/water-quality/uses", method: "POST", body, headers: heads(waterAudit) }),
    invalidatesTags: done([water]),
  }),
  holdPeriod: build.mutation({
    query: ({ periodId, reason }: { periodId: string; reason: string }) => ({ url: `/api/v1/qc/water-quality/periods/${periodId}/hold`, method: "POST", body: { reason }, headers: heads(waterAudit) }),
    transformResponse: (raw: unknown) => z.number().nullish().transform((value) => value ?? 0).parse(raw), invalidatesTags: done([water]),
  }),
  generateMaterialCoa: build.mutation({ query: (batchId: string) => ({ url: `/api/v1/qc/commercial-certificates/material-batches/${batchId}`, method: "POST", headers: { Module: "Quality Control", SubModule: "Certificates of Analysis" } }),
    transformResponse: (raw: unknown) => id.parse(raw) }),
  generateProductCoa: build.mutation({ query: (requestId: string) => ({ url: `/api/v1/qc/commercial-certificates/products/${requestId}`, method: "POST", headers: { Module: "Quality Control", SubModule: "Certificates of Analysis" } }),
    transformResponse: (raw: unknown) => id.parse(raw) }),
  getCommercialCertificate: build.query({ query: (certificateId: string) => ({ url: `/api/v1/qc/commercial-certificates/${certificateId}`, headers: { Module: "Quality Control", SubModule: "Certificates of Analysis" } }),
    transformResponse: (raw: unknown) => certificateSchema.parse(raw) }),
}) });
export type CoaItemBody = { formFieldId: string; includeOnCoa: boolean; displayLabel: string; groupName: string; specificationText: string; unit: string; reference: string; displayOrder: number };
/** After a verification, which is a shared endpoint without these tags. */
export const routinesChanged = () => routinesApi.util.invalidateTags([all]);
