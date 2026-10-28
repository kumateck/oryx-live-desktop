import { api } from "../base-api";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    postApiV1RndProjectsByRndProjectIdAnalyticalMethods: build.mutation<
      PostApiV1RndProjectsByRndProjectIdAnalyticalMethodsApiResponse,
      PostApiV1RndProjectsByRndProjectIdAnalyticalMethodsApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "rnd/project", id: "LIST" }, { type: "rnd", id: "LIST" }, { type: "rnd/project", id: queryArg.rndProjectId }]),
      query: (queryArg) => ({
        url: `/api/v1/rnd/projects/${queryArg.rndProjectId}/analytical-methods`,
        method: "POST",
        body: queryArg.domainEntitiesRndAnalyticalMethodsCreateRndAnalyticalMethodRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1RndProjectsByRndProjectIdAnalyticalMethods: build.query<
      GetApiV1RndProjectsByRndProjectIdAnalyticalMethodsApiResponse,
      GetApiV1RndProjectsByRndProjectIdAnalyticalMethodsApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "rnd/project", id: queryArg.rndProjectId }],
      query: (queryArg) => ({
        url: `/api/v1/rnd/projects/${queryArg.rndProjectId}/analytical-methods`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    putApiV1RndProjectsByRndProjectIdAnalyticalMethodsAndMethodId:
      build.mutation<
        PutApiV1RndProjectsByRndProjectIdAnalyticalMethodsAndMethodIdApiResponse,
        PutApiV1RndProjectsByRndProjectIdAnalyticalMethodsAndMethodIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/rnd/projects/${queryArg.rndProjectId}/analytical-methods/${queryArg.methodId}`,
          method: "PUT",
          body: queryArg.domainEntitiesRndAnalyticalMethodsCreateRndAnalyticalMethodRequest,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1RndProjectsByRndProjectIdAnalyticalMethodsAndMethodId: build.query<
      GetApiV1RndProjectsByRndProjectIdAnalyticalMethodsAndMethodIdApiResponse,
      GetApiV1RndProjectsByRndProjectIdAnalyticalMethodsAndMethodIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "rnd/project", id: queryArg.rndProjectId }],
      query: (queryArg) => ({
        url: `/api/v1/rnd/projects/${queryArg.rndProjectId}/analytical-methods/${queryArg.methodId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1RndProjectsByRndProjectIdAnalyticalMethodsAndMethodIdStatus:
      build.mutation<
        PutApiV1RndProjectsByRndProjectIdAnalyticalMethodsAndMethodIdStatusApiResponse,
        PutApiV1RndProjectsByRndProjectIdAnalyticalMethodsAndMethodIdStatusApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/rnd/projects/${queryArg.rndProjectId}/analytical-methods/${queryArg.methodId}/status`,
          method: "PUT",
          body: queryArg.domainEntitiesRndAnalyticalMethodsUpdateRndAnalyticalMethodStatusRequest,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    postApiV1RndProjectsByRndProjectIdAnalyticalMethodsAndMethodIdTransfer:
      build.mutation<
        PostApiV1RndProjectsByRndProjectIdAnalyticalMethodsAndMethodIdTransferApiResponse,
        PostApiV1RndProjectsByRndProjectIdAnalyticalMethodsAndMethodIdTransferApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/rnd/projects/${queryArg.rndProjectId}/analytical-methods/${queryArg.methodId}/transfer`,
          method: "POST",
          body: queryArg.domainEntitiesRndAnalyticalMethodsTransferRndAnalyticalMethodRequest,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    postApiV1RndProjectsByRndProjectIdFormulations: build.mutation<
      PostApiV1RndProjectsByRndProjectIdFormulationsApiResponse,
      PostApiV1RndProjectsByRndProjectIdFormulationsApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "rnd/project", id: "LIST" }, { type: "rnd", id: "LIST" }, { type: "rnd/project", id: queryArg.rndProjectId }]),
      query: (queryArg) => ({
        url: `/api/v1/rnd/projects/${queryArg.rndProjectId}/formulations`,
        method: "POST",
        body: queryArg.domainEntitiesRndFormulationsCreateRndFormulationRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1RndProjectsByRndProjectIdFormulations: build.query<
      GetApiV1RndProjectsByRndProjectIdFormulationsApiResponse,
      GetApiV1RndProjectsByRndProjectIdFormulationsApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "rnd/project", id: queryArg.rndProjectId }],
      query: (queryArg) => ({
        url: `/api/v1/rnd/projects/${queryArg.rndProjectId}/formulations`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    postApiV1RndProjectsByRndProjectIdFormulationsAndFormulationIdNewVersion:
      build.mutation<
        PostApiV1RndProjectsByRndProjectIdFormulationsAndFormulationIdNewVersionApiResponse,
        PostApiV1RndProjectsByRndProjectIdFormulationsAndFormulationIdNewVersionApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/rnd/projects/${queryArg.rndProjectId}/formulations/${queryArg.formulationId}/new-version`,
          method: "POST",
          body: queryArg.domainEntitiesRndFormulationsCreateRndFormulationRequest,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    putApiV1RndProjectsByRndProjectIdFormulationsAndFormulationId:
      build.mutation<
        PutApiV1RndProjectsByRndProjectIdFormulationsAndFormulationIdApiResponse,
        PutApiV1RndProjectsByRndProjectIdFormulationsAndFormulationIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/rnd/projects/${queryArg.rndProjectId}/formulations/${queryArg.formulationId}`,
          method: "PUT",
          body: queryArg.domainEntitiesRndFormulationsCreateRndFormulationRequest,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1RndProjectsByRndProjectIdFormulationsAndFormulationId: build.query<
      GetApiV1RndProjectsByRndProjectIdFormulationsAndFormulationIdApiResponse,
      GetApiV1RndProjectsByRndProjectIdFormulationsAndFormulationIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "rnd/project", id: queryArg.rndProjectId }],
      query: (queryArg) => ({
        url: `/api/v1/rnd/projects/${queryArg.rndProjectId}/formulations/${queryArg.formulationId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1RndProjectsByRndProjectIdFormulationsAndFormulationIdStatus:
      build.mutation<
        PutApiV1RndProjectsByRndProjectIdFormulationsAndFormulationIdStatusApiResponse,
        PutApiV1RndProjectsByRndProjectIdFormulationsAndFormulationIdStatusApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/rnd/projects/${queryArg.rndProjectId}/formulations/${queryArg.formulationId}/status`,
          method: "PUT",
          body: queryArg.domainEntitiesRndFormulationsRndFormulationStatus,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1RndFormulationReviewsByFormulationId: build.query<
      GetApiV1RndFormulationReviewsByFormulationIdApiResponse,
      GetApiV1RndFormulationReviewsByFormulationIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "rnd/formulation-review", id: queryArg.formulationId }],
      query: (queryArg) => ({
        url: `/api/v1/rnd/formulation-reviews/${queryArg.formulationId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1RndFormulationReviews: build.query<
      GetApiV1RndFormulationReviewsApiResponse,
      GetApiV1RndFormulationReviewsApiArg
    >({
      providesTags: [{ type: "rnd/formulation-review", id: "LIST" }, { type: "rnd", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/rnd/formulation-reviews`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    postApiV1RndProjects: build.mutation<
      PostApiV1RndProjectsApiResponse,
      PostApiV1RndProjectsApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "rnd/project", id: "LIST" }, { type: "rnd", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/rnd/projects`,
        method: "POST",
        body: queryArg.domainEntitiesRndProjectsCreateRndProjectRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1RndProjects: build.query<
      GetApiV1RndProjectsApiResponse,
      GetApiV1RndProjectsApiArg
    >({
      providesTags: [{ type: "rnd/project", id: "LIST" }, { type: "rnd", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/rnd/projects`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          status: queryArg.status,
        },
      }),
    }),
    putApiV1RndProjectsById: build.mutation<
      PutApiV1RndProjectsByIdApiResponse,
      PutApiV1RndProjectsByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "rnd/project", id: "LIST" }, { type: "rnd", id: "LIST" }, { type: "rnd/project", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/rnd/projects/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesRndProjectsUpdateRndProjectRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1RndProjectsById: build.mutation<
      DeleteApiV1RndProjectsByIdApiResponse,
      DeleteApiV1RndProjectsByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "rnd/project", id: "LIST" }, { type: "rnd", id: "LIST" }, { type: "rnd/project", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/rnd/projects/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1RndProjectsById: build.query<
      GetApiV1RndProjectsByIdApiResponse,
      GetApiV1RndProjectsByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "rnd/project", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/rnd/projects/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1RndProjectsByIdStatus: build.mutation<
      PutApiV1RndProjectsByIdStatusApiResponse,
      PutApiV1RndProjectsByIdStatusApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "rnd/project", id: "LIST" }, { type: "rnd", id: "LIST" }, { type: "rnd/project", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/rnd/projects/${queryArg.id}/status`,
        method: "PUT",
        body: queryArg.domainEntitiesRndProjectsUpdateRndProjectStatusRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1RndStabilityChambers: build.mutation<
      PostApiV1RndStabilityChambersApiResponse,
      PostApiV1RndStabilityChambersApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "rnd/stability-chamber", id: "LIST" }, { type: "rnd", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/rnd/stability-chambers`,
        method: "POST",
        body: queryArg.domainEntitiesRndStabilityStudiesCreateRndStabilityChamberRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1RndStabilityChambers: build.query<
      GetApiV1RndStabilityChambersApiResponse,
      GetApiV1RndStabilityChambersApiArg
    >({
      providesTags: [{ type: "rnd/stability-chamber", id: "LIST" }, { type: "rnd", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/rnd/stability-chambers`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    postApiV1RndProjectsByRndProjectIdStabilityStudies: build.mutation<
      PostApiV1RndProjectsByRndProjectIdStabilityStudiesApiResponse,
      PostApiV1RndProjectsByRndProjectIdStabilityStudiesApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "rnd/project", id: "LIST" }, { type: "rnd", id: "LIST" }, { type: "rnd/project", id: queryArg.rndProjectId }]),
      query: (queryArg) => ({
        url: `/api/v1/rnd/projects/${queryArg.rndProjectId}/stability-studies`,
        method: "POST",
        body: queryArg.domainEntitiesRndStabilityStudiesCreateRndStabilityStudyRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1RndProjectsByRndProjectIdStabilityStudies: build.query<
      GetApiV1RndProjectsByRndProjectIdStabilityStudiesApiResponse,
      GetApiV1RndProjectsByRndProjectIdStabilityStudiesApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "rnd/project", id: queryArg.rndProjectId }],
      query: (queryArg) => ({
        url: `/api/v1/rnd/projects/${queryArg.rndProjectId}/stability-studies`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    putApiV1RndProjectsByRndProjectIdStabilityStudiesAndStudyIdStatus:
      build.mutation<
        PutApiV1RndProjectsByRndProjectIdStabilityStudiesAndStudyIdStatusApiResponse,
        PutApiV1RndProjectsByRndProjectIdStabilityStudiesAndStudyIdStatusApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/rnd/projects/${queryArg.rndProjectId}/stability-studies/${queryArg.studyId}/status`,
          method: "PUT",
          body: queryArg.domainEntitiesRndStabilityStudiesUpdateRndStabilityStudyStatusRequest,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    putApiV1RndProjectsByRndProjectIdStabilityStudiesPullPointsAndPullPointIdResult:
      build.mutation<
        PutApiV1RndProjectsByRndProjectIdStabilityStudiesPullPointsAndPullPointIdResultApiResponse,
        PutApiV1RndProjectsByRndProjectIdStabilityStudiesPullPointsAndPullPointIdResultApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/rnd/projects/${queryArg.rndProjectId}/stability-studies/pull-points/${queryArg.pullPointId}/result`,
          method: "PUT",
          body: queryArg.domainEntitiesRndStabilityStudiesRecordPullPointResultRequest,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1RndProjectsByRndProjectIdStabilityStudiesAndStudyId: build.query<
      GetApiV1RndProjectsByRndProjectIdStabilityStudiesAndStudyIdApiResponse,
      GetApiV1RndProjectsByRndProjectIdStabilityStudiesAndStudyIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "rnd/project", id: queryArg.rndProjectId }],
      query: (queryArg) => ({
        url: `/api/v1/rnd/projects/${queryArg.rndProjectId}/stability-studies/${queryArg.studyId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1RndProjectsByRndProjectIdTechnologyTransfers: build.mutation<
      PostApiV1RndProjectsByRndProjectIdTechnologyTransfersApiResponse,
      PostApiV1RndProjectsByRndProjectIdTechnologyTransfersApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "rnd/project", id: "LIST" }, { type: "rnd", id: "LIST" }, { type: "rnd/project", id: queryArg.rndProjectId }]),
      query: (queryArg) => ({
        url: `/api/v1/rnd/projects/${queryArg.rndProjectId}/technology-transfers`,
        method: "POST",
        body: queryArg.domainEntitiesRndTechnologyTransfersCreateRndTechnologyTransferRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1RndProjectsByRndProjectIdTechnologyTransfers: build.query<
      GetApiV1RndProjectsByRndProjectIdTechnologyTransfersApiResponse,
      GetApiV1RndProjectsByRndProjectIdTechnologyTransfersApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "rnd/project", id: queryArg.rndProjectId }],
      query: (queryArg) => ({
        url: `/api/v1/rnd/projects/${queryArg.rndProjectId}/technology-transfers`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    putApiV1RndProjectsByRndProjectIdTechnologyTransfersAndTransferIdStatus:
      build.mutation<
        PutApiV1RndProjectsByRndProjectIdTechnologyTransfersAndTransferIdStatusApiResponse,
        PutApiV1RndProjectsByRndProjectIdTechnologyTransfersAndTransferIdStatusApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/rnd/projects/${queryArg.rndProjectId}/technology-transfers/${queryArg.transferId}/status`,
          method: "PUT",
          body: queryArg.domainEntitiesRndTechnologyTransfersUpdateRndTechnologyTransferStatusRequest,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    postApiV1RndProjectsByRndProjectIdTechnologyTransfersAndTransferIdPromote:
      build.mutation<
        PostApiV1RndProjectsByRndProjectIdTechnologyTransfersAndTransferIdPromoteApiResponse,
        PostApiV1RndProjectsByRndProjectIdTechnologyTransfersAndTransferIdPromoteApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/rnd/projects/${queryArg.rndProjectId}/technology-transfers/${queryArg.transferId}/promote`,
          method: "POST",
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1RndProjectsByRndProjectIdTechnologyTransfersAndTransferId:
      build.query<
        GetApiV1RndProjectsByRndProjectIdTechnologyTransfersAndTransferIdApiResponse,
        GetApiV1RndProjectsByRndProjectIdTechnologyTransfersAndTransferIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/rnd/projects/${queryArg.rndProjectId}/technology-transfers/${queryArg.transferId}`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1RndTechnologyTransferReviewsByTransferId: build.query<
      GetApiV1RndTechnologyTransferReviewsByTransferIdApiResponse,
      GetApiV1RndTechnologyTransferReviewsByTransferIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "rnd/technology-transfer-review", id: queryArg.transferId }],
      query: (queryArg) => ({
        url: `/api/v1/rnd/technology-transfer-reviews/${queryArg.transferId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1RndProjectsByRndProjectIdTrialBatches: build.mutation<
      PostApiV1RndProjectsByRndProjectIdTrialBatchesApiResponse,
      PostApiV1RndProjectsByRndProjectIdTrialBatchesApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "rnd/project", id: "LIST" }, { type: "rnd", id: "LIST" }, { type: "rnd/project", id: queryArg.rndProjectId }]),
      query: (queryArg) => ({
        url: `/api/v1/rnd/projects/${queryArg.rndProjectId}/trial-batches`,
        method: "POST",
        body: queryArg.domainEntitiesRndTrialBatchesCreateRndTrialBatchRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1RndProjectsByRndProjectIdTrialBatches: build.query<
      GetApiV1RndProjectsByRndProjectIdTrialBatchesApiResponse,
      GetApiV1RndProjectsByRndProjectIdTrialBatchesApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "rnd/project", id: queryArg.rndProjectId }],
      query: (queryArg) => ({
        url: `/api/v1/rnd/projects/${queryArg.rndProjectId}/trial-batches`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    putApiV1RndProjectsByRndProjectIdTrialBatchesAndTrialBatchIdStatus:
      build.mutation<
        PutApiV1RndProjectsByRndProjectIdTrialBatchesAndTrialBatchIdStatusApiResponse,
        PutApiV1RndProjectsByRndProjectIdTrialBatchesAndTrialBatchIdStatusApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/rnd/projects/${queryArg.rndProjectId}/trial-batches/${queryArg.trialBatchId}/status`,
          method: "PUT",
          body: queryArg.domainEntitiesRndTrialBatchesUpdateRndTrialBatchStatusRequest,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1RndProjectsByRndProjectIdTrialBatchesAndTrialBatchId: build.query<
      GetApiV1RndProjectsByRndProjectIdTrialBatchesAndTrialBatchIdApiResponse,
      GetApiV1RndProjectsByRndProjectIdTrialBatchesAndTrialBatchIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "rnd/project", id: queryArg.rndProjectId }],
      query: (queryArg) => ({
        url: `/api/v1/rnd/projects/${queryArg.rndProjectId}/trial-batches/${queryArg.trialBatchId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as rndApi };
export type PostApiV1RndProjectsByRndProjectIdAnalyticalMethodsApiResponse =
  /** status 200 OK */ string;
export type PostApiV1RndProjectsByRndProjectIdAnalyticalMethodsApiArg = {
  rndProjectId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesRndAnalyticalMethodsCreateRndAnalyticalMethodRequest: DomainEntitiesRndAnalyticalMethodsCreateRndAnalyticalMethodRequest;
};
export type GetApiV1RndProjectsByRndProjectIdAnalyticalMethodsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRndAnalyticalMethodsRndAnalyticalMethodDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1RndProjectsByRndProjectIdAnalyticalMethodsApiArg = {
  rndProjectId: string;
  page?: number;
  pageSize?: number;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1RndProjectsByRndProjectIdAnalyticalMethodsAndMethodIdApiResponse = void;
export type PutApiV1RndProjectsByRndProjectIdAnalyticalMethodsAndMethodIdApiArg =
  {
    methodId: string;
    rndProjectId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
    domainEntitiesRndAnalyticalMethodsCreateRndAnalyticalMethodRequest: DomainEntitiesRndAnalyticalMethodsCreateRndAnalyticalMethodRequest;
  };
export type GetApiV1RndProjectsByRndProjectIdAnalyticalMethodsAndMethodIdApiResponse =
  /** status 200 OK */ DomainEntitiesRndAnalyticalMethodsRndAnalyticalMethodDto;
export type GetApiV1RndProjectsByRndProjectIdAnalyticalMethodsAndMethodIdApiArg =
  {
    methodId: string;
    rndProjectId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PutApiV1RndProjectsByRndProjectIdAnalyticalMethodsAndMethodIdStatusApiResponse = void;
export type PutApiV1RndProjectsByRndProjectIdAnalyticalMethodsAndMethodIdStatusApiArg =
  {
    methodId: string;
    rndProjectId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
    domainEntitiesRndAnalyticalMethodsUpdateRndAnalyticalMethodStatusRequest: DomainEntitiesRndAnalyticalMethodsUpdateRndAnalyticalMethodStatusRequest;
  };
export type PostApiV1RndProjectsByRndProjectIdAnalyticalMethodsAndMethodIdTransferApiResponse =
  /** status 200 OK */ string;
export type PostApiV1RndProjectsByRndProjectIdAnalyticalMethodsAndMethodIdTransferApiArg =
  {
    methodId: string;
    rndProjectId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
    domainEntitiesRndAnalyticalMethodsTransferRndAnalyticalMethodRequest: DomainEntitiesRndAnalyticalMethodsTransferRndAnalyticalMethodRequest;
  };
export type PostApiV1RndProjectsByRndProjectIdFormulationsApiResponse =
  /** status 200 OK */ string;
export type PostApiV1RndProjectsByRndProjectIdFormulationsApiArg = {
  rndProjectId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesRndFormulationsCreateRndFormulationRequest: DomainEntitiesRndFormulationsCreateRndFormulationRequest;
};
export type GetApiV1RndProjectsByRndProjectIdFormulationsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRndFormulationsRndFormulationDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1RndProjectsByRndProjectIdFormulationsApiArg = {
  rndProjectId: string;
  page?: number;
  pageSize?: number;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1RndProjectsByRndProjectIdFormulationsAndFormulationIdNewVersionApiResponse =
  /** status 200 OK */ string;
export type PostApiV1RndProjectsByRndProjectIdFormulationsAndFormulationIdNewVersionApiArg =
  {
    formulationId: string;
    rndProjectId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
    domainEntitiesRndFormulationsCreateRndFormulationRequest: DomainEntitiesRndFormulationsCreateRndFormulationRequest;
  };
export type PutApiV1RndProjectsByRndProjectIdFormulationsAndFormulationIdApiResponse = void;
export type PutApiV1RndProjectsByRndProjectIdFormulationsAndFormulationIdApiArg =
  {
    formulationId: string;
    rndProjectId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
    domainEntitiesRndFormulationsCreateRndFormulationRequest: DomainEntitiesRndFormulationsCreateRndFormulationRequest;
  };
export type GetApiV1RndProjectsByRndProjectIdFormulationsAndFormulationIdApiResponse =
  /** status 200 OK */ DomainEntitiesRndFormulationsRndFormulationDto;
export type GetApiV1RndProjectsByRndProjectIdFormulationsAndFormulationIdApiArg =
  {
    formulationId: string;
    rndProjectId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PutApiV1RndProjectsByRndProjectIdFormulationsAndFormulationIdStatusApiResponse = void;
export type PutApiV1RndProjectsByRndProjectIdFormulationsAndFormulationIdStatusApiArg =
  {
    formulationId: string;
    rndProjectId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
    domainEntitiesRndFormulationsRndFormulationStatus: DomainEntitiesRndFormulationsRndFormulationStatus;
  };
export type GetApiV1RndFormulationReviewsByFormulationIdApiResponse =
  /** status 200 OK */ DomainEntitiesRndFormulationsRndFormulationReviewDto;
export type GetApiV1RndFormulationReviewsByFormulationIdApiArg = {
  formulationId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1RndFormulationReviewsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRndFormulationsRndFormulationReviewDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1RndFormulationReviewsApiArg = {
  page?: number;
  pageSize?: number;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1RndProjectsApiResponse = /** status 200 OK */ string;
export type PostApiV1RndProjectsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesRndProjectsCreateRndProjectRequest: DomainEntitiesRndProjectsCreateRndProjectRequest;
};
export type GetApiV1RndProjectsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRndProjectsRndProjectDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1RndProjectsApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  status?: DomainEntitiesRndProjectsRndProjectStatus;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1RndProjectsByIdApiResponse = void;
export type PutApiV1RndProjectsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesRndProjectsUpdateRndProjectRequest: DomainEntitiesRndProjectsUpdateRndProjectRequest;
};
export type DeleteApiV1RndProjectsByIdApiResponse = void;
export type DeleteApiV1RndProjectsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1RndProjectsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesRndProjectsRndProjectDto;
export type GetApiV1RndProjectsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1RndProjectsByIdStatusApiResponse = void;
export type PutApiV1RndProjectsByIdStatusApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesRndProjectsUpdateRndProjectStatusRequest: DomainEntitiesRndProjectsUpdateRndProjectStatusRequest;
};
export type PostApiV1RndStabilityChambersApiResponse =
  /** status 200 OK */ string;
export type PostApiV1RndStabilityChambersApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesRndStabilityStudiesCreateRndStabilityChamberRequest: DomainEntitiesRndStabilityStudiesCreateRndStabilityChamberRequest;
};
export type GetApiV1RndStabilityChambersApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRndStabilityStudiesRndStabilityChamberDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1RndStabilityChambersApiArg = {
  page?: number;
  pageSize?: number;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1RndProjectsByRndProjectIdStabilityStudiesApiResponse =
  /** status 200 OK */ string;
export type PostApiV1RndProjectsByRndProjectIdStabilityStudiesApiArg = {
  rndProjectId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesRndStabilityStudiesCreateRndStabilityStudyRequest: DomainEntitiesRndStabilityStudiesCreateRndStabilityStudyRequest;
};
export type GetApiV1RndProjectsByRndProjectIdStabilityStudiesApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRndStabilityStudiesRndStabilityStudyDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1RndProjectsByRndProjectIdStabilityStudiesApiArg = {
  rndProjectId: string;
  page?: number;
  pageSize?: number;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1RndProjectsByRndProjectIdStabilityStudiesAndStudyIdStatusApiResponse = void;
export type PutApiV1RndProjectsByRndProjectIdStabilityStudiesAndStudyIdStatusApiArg =
  {
    studyId: string;
    rndProjectId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
    domainEntitiesRndStabilityStudiesUpdateRndStabilityStudyStatusRequest: DomainEntitiesRndStabilityStudiesUpdateRndStabilityStudyStatusRequest;
  };
export type PutApiV1RndProjectsByRndProjectIdStabilityStudiesPullPointsAndPullPointIdResultApiResponse = void;
export type PutApiV1RndProjectsByRndProjectIdStabilityStudiesPullPointsAndPullPointIdResultApiArg =
  {
    pullPointId: string;
    rndProjectId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
    domainEntitiesRndStabilityStudiesRecordPullPointResultRequest: DomainEntitiesRndStabilityStudiesRecordPullPointResultRequest;
  };
export type GetApiV1RndProjectsByRndProjectIdStabilityStudiesAndStudyIdApiResponse =
  /** status 200 OK */ DomainEntitiesRndStabilityStudiesRndStabilityStudyDto;
export type GetApiV1RndProjectsByRndProjectIdStabilityStudiesAndStudyIdApiArg =
  {
    studyId: string;
    rndProjectId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PostApiV1RndProjectsByRndProjectIdTechnologyTransfersApiResponse =
  /** status 200 OK */ string;
export type PostApiV1RndProjectsByRndProjectIdTechnologyTransfersApiArg = {
  rndProjectId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesRndTechnologyTransfersCreateRndTechnologyTransferRequest: DomainEntitiesRndTechnologyTransfersCreateRndTechnologyTransferRequest;
};
export type GetApiV1RndProjectsByRndProjectIdTechnologyTransfersApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRndTechnologyTransfersRndTechnologyTransferDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1RndProjectsByRndProjectIdTechnologyTransfersApiArg = {
  rndProjectId: string;
  page?: number;
  pageSize?: number;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1RndProjectsByRndProjectIdTechnologyTransfersAndTransferIdStatusApiResponse = void;
export type PutApiV1RndProjectsByRndProjectIdTechnologyTransfersAndTransferIdStatusApiArg =
  {
    transferId: string;
    rndProjectId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
    domainEntitiesRndTechnologyTransfersUpdateRndTechnologyTransferStatusRequest: DomainEntitiesRndTechnologyTransfersUpdateRndTechnologyTransferStatusRequest;
  };
export type PostApiV1RndProjectsByRndProjectIdTechnologyTransfersAndTransferIdPromoteApiResponse =
  /** status 200 OK */ string;
export type PostApiV1RndProjectsByRndProjectIdTechnologyTransfersAndTransferIdPromoteApiArg =
  {
    transferId: string;
    rndProjectId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1RndProjectsByRndProjectIdTechnologyTransfersAndTransferIdApiResponse =
  /** status 200 OK */ DomainEntitiesRndTechnologyTransfersRndTechnologyTransferDto;
export type GetApiV1RndProjectsByRndProjectIdTechnologyTransfersAndTransferIdApiArg =
  {
    transferId: string;
    rndProjectId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1RndTechnologyTransferReviewsByTransferIdApiResponse =
  /** status 200 OK */ DomainEntitiesRndTechnologyTransfersRndTechnologyTransferDto;
export type GetApiV1RndTechnologyTransferReviewsByTransferIdApiArg = {
  transferId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1RndProjectsByRndProjectIdTrialBatchesApiResponse =
  /** status 200 OK */ string;
export type PostApiV1RndProjectsByRndProjectIdTrialBatchesApiArg = {
  rndProjectId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesRndTrialBatchesCreateRndTrialBatchRequest: DomainEntitiesRndTrialBatchesCreateRndTrialBatchRequest;
};
export type GetApiV1RndProjectsByRndProjectIdTrialBatchesApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRndTrialBatchesRndTrialBatchDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1RndProjectsByRndProjectIdTrialBatchesApiArg = {
  rndProjectId: string;
  page?: number;
  pageSize?: number;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1RndProjectsByRndProjectIdTrialBatchesAndTrialBatchIdStatusApiResponse = void;
export type PutApiV1RndProjectsByRndProjectIdTrialBatchesAndTrialBatchIdStatusApiArg =
  {
    trialBatchId: string;
    rndProjectId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
    domainEntitiesRndTrialBatchesUpdateRndTrialBatchStatusRequest: DomainEntitiesRndTrialBatchesUpdateRndTrialBatchStatusRequest;
  };
export type GetApiV1RndProjectsByRndProjectIdTrialBatchesAndTrialBatchIdApiResponse =
  /** status 200 OK */ DomainEntitiesRndTrialBatchesRndTrialBatchDto;
export type GetApiV1RndProjectsByRndProjectIdTrialBatchesAndTrialBatchIdApiArg =
  {
    trialBatchId: string;
    rndProjectId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue | undefined };
export type MicrosoftAspNetCoreMvcProblemDetails = {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  [key: string]: JsonValue | undefined;
};
export type DomainEntitiesRndAnalyticalMethodsCreateRndAnalyticalMethodRequest =
  {
    materialId?: string | null;
    productId?: string | null;
    methodName?: string | null;
    description?: string | null;
    validationProtocolFormId?: string | null;
  };
export type SharedDepartmentType = 0 | 1 | 2;
export type DomainEntitiesProductsDivision = 0 | 1;
export type SharedCollectionItemDto = {
  id?: string | null;
  name?: string | null;
  code?: string | null;
  description?: string | null;
  symbol?: string | null;
  uom?: string | null;
};
export type DomainEntitiesDepartmentsDepartmentListDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  name?: string | null;
  type?: SharedDepartmentType;
  description?: string | null;
  division?: DomainEntitiesProductsDivision;
  parentDepartment?: SharedCollectionItemDto;
};
export type DomainEntitiesUsersUserDto = {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  isDisabled?: boolean;
  avatar?: string | null;
  createdAt?: string;
  signature?: string | null;
  department?: DomainEntitiesDepartmentsDepartmentListDto;
};
export type DomainEntitiesRndAnalyticalMethodsRndAnalyticalMethodStatus =
  0 | 1 | 2 | 3;
export type DomainEntitiesRndAnalyticalMethodsRndAnalyticalMethodDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  rndProjectId?: string;
  material?: SharedCollectionItemDto;
  product?: SharedCollectionItemDto;
  methodName?: string | null;
  description?: string | null;
  status?: DomainEntitiesRndAnalyticalMethodsRndAnalyticalMethodStatus;
  validationProtocolFormId?: string | null;
  validatedAt?: string | null;
  validatedBy?: DomainEntitiesUsersUserDto;
  transferredStpId?: string | null;
  transferredAt?: string | null;
  transferredBy?: DomainEntitiesUsersUserDto;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRndAnalyticalMethodsRndAnalyticalMethodDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesRndAnalyticalMethodsRndAnalyticalMethodDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesRndAnalyticalMethodsUpdateRndAnalyticalMethodStatusRequest =
  {
    status?: DomainEntitiesRndAnalyticalMethodsRndAnalyticalMethodStatus;
  };
export type DomainEntitiesRndAnalyticalMethodsTransferRndAnalyticalMethodRequest =
  {
    stpNumber: string;
    description?: string | null;
  };
export type DomainEntitiesRndFormulationsCreateRndFormulationItemRequest = {
  materialId?: string;
  materialTypeId?: string | null;
  grade?: string | null;
  casNumber?: string | null;
  order?: number;
  isSubstitutable?: boolean;
  baseQuantity?: number;
  baseUoMId?: string | null;
  prescribedQuantity?: number;
  percentage?: number | null;
  substituteMaterialIds?: string[] | null;
};
export type DomainEntitiesRndFormulationsCreateRndFormulationRequest = {
  items?: DomainEntitiesRndFormulationsCreateRndFormulationItemRequest[] | null;
};
export type DomainEntitiesRndFormulationsRndFormulationStatus = 0 | 1 | 2 | 3;
export type DomainEntitiesRndFormulationsRndFormulationItemDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  material?: SharedCollectionItemDto;
  materialType?: SharedCollectionItemDto;
  grade?: string | null;
  casNumber?: string | null;
  order?: number;
  isSubstitutable?: boolean;
  baseQuantity?: number;
  baseUoM?: SharedCollectionItemDto;
  prescribedQuantity?: number;
  percentage?: number | null;
  substituteMaterialIds?: string[] | null;
};
export type DomainEntitiesRndFormulationsRndFormulationDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  rndProjectId?: string;
  version?: number;
  status?: DomainEntitiesRndFormulationsRndFormulationStatus;
  items?: DomainEntitiesRndFormulationsRndFormulationItemDto[] | null;
  approved?: boolean;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRndFormulationsRndFormulationDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesRndFormulationsRndFormulationDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesRndProjectsRndProjectStatus =
  0 | 1 | 2 | 3 | 4 | 5 | 6;
export type DomainEntitiesRndProjectsRndProjectDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  product?: SharedCollectionItemDto;
  title?: string | null;
  objective?: string | null;
  department?: SharedCollectionItemDto;
  requestedBy?: DomainEntitiesUsersUserDto;
  status?: DomainEntitiesRndProjectsRndProjectStatus;
  targetLaunchDate?: string | null;
  qtppFormId?: string | null;
  attachmentId?: string | null;
  approved?: boolean;
};
export type DomainEntitiesRndFormulationsRndFormulationReviewDto = {
  formulation?: DomainEntitiesRndFormulationsRndFormulationDto;
  project?: DomainEntitiesRndProjectsRndProjectDto;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRndFormulationsRndFormulationReviewDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesRndFormulationsRndFormulationReviewDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesRndProjectsCreateRndProjectRequest = {
  productId?: string | null;
  title?: string | null;
  objective?: string | null;
  targetLaunchDate?: string | null;
  qtppFormId?: string | null;
  attachmentId?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRndProjectsRndProjectDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesRndProjectsRndProjectDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesRndProjectsUpdateRndProjectRequest = {
  productId?: string | null;
  title?: string | null;
  objective?: string | null;
  targetLaunchDate?: string | null;
  qtppFormId?: string | null;
  attachmentId?: string | null;
};
export type DomainEntitiesRndProjectsUpdateRndProjectStatusRequest = {
  status?: DomainEntitiesRndProjectsRndProjectStatus;
  comments?: string | null;
};
export type DomainEntitiesRndStabilityStudiesCreateRndStabilityChamberRequest =
  {
    code?: string | null;
    name?: string | null;
    conditionType?: string | null;
    targetTemperature?: number;
    targetHumidity?: number | null;
    calibrationDueDate?: string | null;
    lastCalibratedAt?: string | null;
  };
export type DomainEntitiesRndStabilityStudiesRndStabilityChamberDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  name?: string | null;
  conditionType?: string | null;
  targetTemperature?: number;
  targetHumidity?: number | null;
  calibrationDueDate?: string | null;
  lastCalibratedAt?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRndStabilityStudiesRndStabilityChamberDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesRndStabilityStudiesRndStabilityChamberDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesRndStabilityStudiesCreateRndStabilityStudyRequest = {
  rndTrialBatchId?: string;
  rndStabilityChamberId?: string;
  protocolFormId?: string | null;
  startDate?: string;
  pullPointTimePointsMonths?: number[] | null;
};
export type DomainEntitiesRndStabilityStudiesRndStabilityStudyStatus =
  0 | 1 | 2;
export type DomainEntitiesRndStabilityStudiesRndStabilityPullPointStatus =
  0 | 1 | 2;
export type DomainEntitiesRndStabilityStudiesRndStabilityPullPointDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  timePointMonths?: number;
  dueDate?: string;
  pulledAt?: string | null;
  pulledBy?: DomainEntitiesUsersUserDto;
  status?: DomainEntitiesRndStabilityStudiesRndStabilityPullPointStatus;
  resultsSummary?: string | null;
};
export type DomainEntitiesRndStabilityStudiesRndStabilityStudyDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  rndProjectId?: string;
  rndTrialBatchId?: string;
  rndStabilityChamber?: SharedCollectionItemDto;
  protocolFormId?: string | null;
  startDate?: string;
  status?: DomainEntitiesRndStabilityStudiesRndStabilityStudyStatus;
  pullPoints?:
    DomainEntitiesRndStabilityStudiesRndStabilityPullPointDto[] | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRndStabilityStudiesRndStabilityStudyDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesRndStabilityStudiesRndStabilityStudyDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesRndStabilityStudiesUpdateRndStabilityStudyStatusRequest =
  {
    status?: DomainEntitiesRndStabilityStudiesRndStabilityStudyStatus;
  };
export type DomainEntitiesRndStabilityStudiesRecordPullPointResultRequest = {
  resultsSummary?: string | null;
};
export type DomainEntitiesRndTechnologyTransfersCreateRndTechnologyTransferRequest =
  {
    rndFormulationId?: string;
    gapAnalysisFormId?: string | null;
  };
export type DomainEntitiesRndTechnologyTransfersRndTechnologyTransferStatus =
  0 | 1 | 2 | 3 | 4 | 5;
export type DomainEntitiesRndTechnologyTransfersRndTechnologyTransferDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  rndProjectId?: string;
  rndFormulationId?: string;
  gapAnalysisFormId?: string | null;
  status?: DomainEntitiesRndTechnologyTransfersRndTechnologyTransferStatus;
  billOfMaterialId?: string | null;
  completedAt?: string | null;
  completedBy?: DomainEntitiesUsersUserDto;
  protocolApprovedAt?: string | null;
  protocolApprovedBy?: DomainEntitiesUsersUserDto;
  protocolApprovalComments?: string | null;
  executionStartedAt?: string | null;
  executionStartedBy?: DomainEntitiesUsersUserDto;
  approved?: boolean;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRndTechnologyTransfersRndTechnologyTransferDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?:
      DomainEntitiesRndTechnologyTransfersRndTechnologyTransferDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesRndTechnologyTransfersUpdateRndTechnologyTransferStatusRequest =
  {
    status?: DomainEntitiesRndTechnologyTransfersRndTechnologyTransferStatus;
  };
export type DomainEntitiesRndTrialBatchesRndTrialBatchScaleType = 0 | 1 | 2;
export type DomainEntitiesRndTrialBatchesCreateRndTrialBatchRequest = {
  rndFormulationId?: string;
  scaleType?: DomainEntitiesRndTrialBatchesRndTrialBatchScaleType;
  batchSize?: number;
  batchSizeUoMId?: string | null;
  manufacturingDate?: string | null;
  performedById?: string | null;
  protocolFormId?: string | null;
  observations?: string | null;
};
export type DomainEntitiesRndTrialBatchesRndTrialBatchStatus = 0 | 1 | 2 | 3;
export type DomainEntitiesRndTrialBatchesRndTrialBatchDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  rndProjectId?: string;
  rndFormulationId?: string;
  batchCode?: string | null;
  scaleType?: DomainEntitiesRndTrialBatchesRndTrialBatchScaleType;
  batchSize?: number;
  batchSizeUoM?: SharedCollectionItemDto;
  manufacturingDate?: string | null;
  performedBy?: DomainEntitiesUsersUserDto;
  protocolFormId?: string | null;
  status?: DomainEntitiesRndTrialBatchesRndTrialBatchStatus;
  observations?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRndTrialBatchesRndTrialBatchDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesRndTrialBatchesRndTrialBatchDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesRndTrialBatchesUpdateRndTrialBatchStatusRequest = {
  status?: DomainEntitiesRndTrialBatchesRndTrialBatchStatus;
  observations?: string | null;
};
export const {
  usePostApiV1RndProjectsByRndProjectIdAnalyticalMethodsMutation,
  useGetApiV1RndProjectsByRndProjectIdAnalyticalMethodsQuery,
  useLazyGetApiV1RndProjectsByRndProjectIdAnalyticalMethodsQuery,
  usePutApiV1RndProjectsByRndProjectIdAnalyticalMethodsAndMethodIdMutation,
  useGetApiV1RndProjectsByRndProjectIdAnalyticalMethodsAndMethodIdQuery,
  useLazyGetApiV1RndProjectsByRndProjectIdAnalyticalMethodsAndMethodIdQuery,
  usePutApiV1RndProjectsByRndProjectIdAnalyticalMethodsAndMethodIdStatusMutation,
  usePostApiV1RndProjectsByRndProjectIdAnalyticalMethodsAndMethodIdTransferMutation,
  usePostApiV1RndProjectsByRndProjectIdFormulationsMutation,
  useGetApiV1RndProjectsByRndProjectIdFormulationsQuery,
  useLazyGetApiV1RndProjectsByRndProjectIdFormulationsQuery,
  usePostApiV1RndProjectsByRndProjectIdFormulationsAndFormulationIdNewVersionMutation,
  usePutApiV1RndProjectsByRndProjectIdFormulationsAndFormulationIdMutation,
  useGetApiV1RndProjectsByRndProjectIdFormulationsAndFormulationIdQuery,
  useLazyGetApiV1RndProjectsByRndProjectIdFormulationsAndFormulationIdQuery,
  usePutApiV1RndProjectsByRndProjectIdFormulationsAndFormulationIdStatusMutation,
  useGetApiV1RndFormulationReviewsByFormulationIdQuery,
  useLazyGetApiV1RndFormulationReviewsByFormulationIdQuery,
  useGetApiV1RndFormulationReviewsQuery,
  useLazyGetApiV1RndFormulationReviewsQuery,
  usePostApiV1RndProjectsMutation,
  useGetApiV1RndProjectsQuery,
  useLazyGetApiV1RndProjectsQuery,
  usePutApiV1RndProjectsByIdMutation,
  useDeleteApiV1RndProjectsByIdMutation,
  useGetApiV1RndProjectsByIdQuery,
  useLazyGetApiV1RndProjectsByIdQuery,
  usePutApiV1RndProjectsByIdStatusMutation,
  usePostApiV1RndStabilityChambersMutation,
  useGetApiV1RndStabilityChambersQuery,
  useLazyGetApiV1RndStabilityChambersQuery,
  usePostApiV1RndProjectsByRndProjectIdStabilityStudiesMutation,
  useGetApiV1RndProjectsByRndProjectIdStabilityStudiesQuery,
  useLazyGetApiV1RndProjectsByRndProjectIdStabilityStudiesQuery,
  usePutApiV1RndProjectsByRndProjectIdStabilityStudiesAndStudyIdStatusMutation,
  usePutApiV1RndProjectsByRndProjectIdStabilityStudiesPullPointsAndPullPointIdResultMutation,
  useGetApiV1RndProjectsByRndProjectIdStabilityStudiesAndStudyIdQuery,
  useLazyGetApiV1RndProjectsByRndProjectIdStabilityStudiesAndStudyIdQuery,
  usePostApiV1RndProjectsByRndProjectIdTechnologyTransfersMutation,
  useGetApiV1RndProjectsByRndProjectIdTechnologyTransfersQuery,
  useLazyGetApiV1RndProjectsByRndProjectIdTechnologyTransfersQuery,
  usePutApiV1RndProjectsByRndProjectIdTechnologyTransfersAndTransferIdStatusMutation,
  usePostApiV1RndProjectsByRndProjectIdTechnologyTransfersAndTransferIdPromoteMutation,
  useGetApiV1RndProjectsByRndProjectIdTechnologyTransfersAndTransferIdQuery,
  useLazyGetApiV1RndProjectsByRndProjectIdTechnologyTransfersAndTransferIdQuery,
  useGetApiV1RndTechnologyTransferReviewsByTransferIdQuery,
  useLazyGetApiV1RndTechnologyTransferReviewsByTransferIdQuery,
  usePostApiV1RndProjectsByRndProjectIdTrialBatchesMutation,
  useGetApiV1RndProjectsByRndProjectIdTrialBatchesQuery,
  useLazyGetApiV1RndProjectsByRndProjectIdTrialBatchesQuery,
  usePutApiV1RndProjectsByRndProjectIdTrialBatchesAndTrialBatchIdStatusMutation,
  useGetApiV1RndProjectsByRndProjectIdTrialBatchesAndTrialBatchIdQuery,
  useLazyGetApiV1RndProjectsByRndProjectIdTrialBatchesAndTrialBatchIdQuery,
} = injectedRtkApi;
