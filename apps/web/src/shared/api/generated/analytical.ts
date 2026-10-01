import { api } from "../base-api";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    postApiV1QaAnalyticalTests: build.mutation<
      PostApiV1QaAnalyticalTestsApiResponse,
      PostApiV1QaAnalyticalTestsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/analytical-tests`,
        method: "POST",
        body: queryArg.domainEntitiesAnalyticalTestRequestsCreateAnalyticalTestRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QaAnalyticalTests: build.query<
      GetApiV1QaAnalyticalTestsApiResponse,
      GetApiV1QaAnalyticalTestsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/analytical-tests`,
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
    getApiV1QaAnalyticalTestsById: build.query<
      GetApiV1QaAnalyticalTestsByIdApiResponse,
      GetApiV1QaAnalyticalTestsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/analytical-tests/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1QaAnalyticalTestsById: build.mutation<
      PutApiV1QaAnalyticalTestsByIdApiResponse,
      PutApiV1QaAnalyticalTestsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/analytical-tests/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesAnalyticalTestRequestsCreateAnalyticalTestRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1QaAnalyticalTestsById: build.mutation<
      DeleteApiV1QaAnalyticalTestsByIdApiResponse,
      DeleteApiV1QaAnalyticalTestsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/analytical-tests/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1QaAnalyticalTestsStatusById: build.mutation<
      PutApiV1QaAnalyticalTestsStatusByIdApiResponse,
      PutApiV1QaAnalyticalTestsStatusByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/analytical-tests/status/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesAnalyticalTestRequestsUpdateAnalyticalTestRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1QaAnalyticalTestsAssignById: build.mutation<
      PutApiV1QaAnalyticalTestsAssignByIdApiResponse,
      PutApiV1QaAnalyticalTestsAssignByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/analytical-tests/assign/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesAnalyticalTestRequestsAssignAnalyticalTestRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1QaAnalyticalTestsReassignById: build.mutation<
      PutApiV1QaAnalyticalTestsReassignByIdApiResponse,
      PutApiV1QaAnalyticalTestsReassignByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/analytical-tests/reassign/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesAnalyticalTestRequestsAssignAnalyticalTestRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QaAnalyticalTestsRequestRetestById: build.mutation<
      PostApiV1QaAnalyticalTestsRequestRetestByIdApiResponse,
      PostApiV1QaAnalyticalTestsRequestRetestByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/analytical-tests/request-retest/${queryArg.id}`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QaAnalyticalTestsCompleteRetestById: build.mutation<
      PostApiV1QaAnalyticalTestsCompleteRetestByIdApiResponse,
      PostApiV1QaAnalyticalTestsCompleteRetestByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/analytical-tests/complete-retest/${queryArg.id}`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          extendedExpiryDate: queryArg.extendedExpiryDate,
        },
      }),
    }),
    getApiV1QaAnalyticalTestsActivityStepByActivityStepId: build.query<
      GetApiV1QaAnalyticalTestsActivityStepByActivityStepIdApiResponse,
      GetApiV1QaAnalyticalTestsActivityStepByActivityStepIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/analytical-tests/activity-step/${queryArg.activityStepId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1MaterialArd: build.mutation<
      PostApiV1MaterialArdApiResponse,
      PostApiV1MaterialArdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-ard`,
        method: "POST",
        body: queryArg.domainEntitiesMaterialArdCreateMaterialAnalyticalRawDataRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialArd: build.query<
      GetApiV1MaterialArdApiResponse,
      GetApiV1MaterialArdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-ard`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          materialKind: queryArg.materialKind,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          isVerified: queryArg.isVerified,
        },
      }),
    }),
    getApiV1MaterialArdById: build.query<
      GetApiV1MaterialArdByIdApiResponse,
      GetApiV1MaterialArdByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-ard/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1MaterialArdById: build.mutation<
      PutApiV1MaterialArdByIdApiResponse,
      PutApiV1MaterialArdByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-ard/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesMaterialArdCreateMaterialAnalyticalRawDataRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1MaterialArdById: build.mutation<
      DeleteApiV1MaterialArdByIdApiResponse,
      DeleteApiV1MaterialArdByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-ard/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialArdMaterialByMaterialId: build.query<
      GetApiV1MaterialArdMaterialByMaterialIdApiResponse,
      GetApiV1MaterialArdMaterialByMaterialIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-ard/material/${queryArg.materialId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialArdMaterialBatchByMaterialBatchId: build.query<
      GetApiV1MaterialArdMaterialBatchByMaterialBatchIdApiResponse,
      GetApiV1MaterialArdMaterialBatchByMaterialBatchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-ard/material/batch/${queryArg.materialBatchId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialArdMaterialBatchDetailsByMaterialBatchId: build.query<
      GetApiV1MaterialArdMaterialBatchDetailsByMaterialBatchIdApiResponse,
      GetApiV1MaterialArdMaterialBatchDetailsByMaterialBatchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-ard/material/batch-details/${queryArg.materialBatchId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1MaterialArdStartTestByMaterialBatchId: build.mutation<
      PutApiV1MaterialArdStartTestByMaterialBatchIdApiResponse,
      PutApiV1MaterialArdStartTestByMaterialBatchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-ard/start-test/${queryArg.materialBatchId}`,
        method: "PUT",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1MaterialArdUniformityOfWeight: build.mutation<
      PostApiV1MaterialArdUniformityOfWeightApiResponse,
      PostApiV1MaterialArdUniformityOfWeightApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-ard/uniformity-of-weight`,
        method: "POST",
        body: queryArg.domainEntitiesUniformityOfWeightsCreateUniformityOfWeight,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialArdUniformityOfWeight: build.query<
      GetApiV1MaterialArdUniformityOfWeightApiResponse,
      GetApiV1MaterialArdUniformityOfWeightApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-ard/uniformity-of-weight`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
        },
      }),
    }),
    getApiV1MaterialArdUniformityOfWeightById: build.query<
      GetApiV1MaterialArdUniformityOfWeightByIdApiResponse,
      GetApiV1MaterialArdUniformityOfWeightByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-ard/uniformity-of-weight/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1MaterialArdUniformityOfWeightById: build.mutation<
      PutApiV1MaterialArdUniformityOfWeightByIdApiResponse,
      PutApiV1MaterialArdUniformityOfWeightByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-ard/uniformity-of-weight/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesUniformityOfWeightsCreateUniformityOfWeight,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1MaterialArdUniformityOfWeightById: build.mutation<
      DeleteApiV1MaterialArdUniformityOfWeightByIdApiResponse,
      DeleteApiV1MaterialArdUniformityOfWeightByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-ard/uniformity-of-weight/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1MaterialArdUniformityOfWeightResponse: build.mutation<
      PostApiV1MaterialArdUniformityOfWeightResponseApiResponse,
      PostApiV1MaterialArdUniformityOfWeightResponseApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-ard/uniformity-of-weight/response`,
        method: "POST",
        body: queryArg.domainEntitiesUniformityOfWeightsCreateUniformityOfWeightResponse,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialArdUniformityOfWeightByUniformityOfWeightIdAndMaterialBatchIdResponse:
      build.query<
        GetApiV1MaterialArdUniformityOfWeightByUniformityOfWeightIdAndMaterialBatchIdResponseApiResponse,
        GetApiV1MaterialArdUniformityOfWeightByUniformityOfWeightIdAndMaterialBatchIdResponseApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/material-ard/uniformity-of-weight/${queryArg.uniformityOfWeightId}/${queryArg.materialBatchId}/response`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    postApiV1MaterialSamplings: build.mutation<
      PostApiV1MaterialSamplingsApiResponse,
      PostApiV1MaterialSamplingsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-samplings`,
        method: "POST",
        body: queryArg.domainEntitiesMaterialSamplingCreateMaterialSamplingRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1MaterialSamplingsByMaterialSamplingId: build.mutation<
      PutApiV1MaterialSamplingsByMaterialSamplingIdApiResponse,
      PutApiV1MaterialSamplingsByMaterialSamplingIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-samplings/${queryArg.materialSamplingId}`,
        method: "PUT",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          issueNumber: queryArg.issueNumber,
        },
      }),
    }),
    getApiV1MaterialSamplingsByGrnIdAndBatchId: build.query<
      GetApiV1MaterialSamplingsByGrnIdAndBatchIdApiResponse,
      GetApiV1MaterialSamplingsByGrnIdAndBatchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-samplings/${queryArg.grnId}/${queryArg.batchId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1MaterialSamplingsPreSample: build.mutation<
      PostApiV1MaterialSamplingsPreSampleApiResponse,
      PostApiV1MaterialSamplingsPreSampleApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-samplings/pre-sample`,
        method: "POST",
        body: queryArg.domainEntitiesChecklistsCreatePreSampleChecklistRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialSamplingsPreSampleByGrnIdAndBatchId: build.query<
      GetApiV1MaterialSamplingsPreSampleByGrnIdAndBatchIdApiResponse,
      GetApiV1MaterialSamplingsPreSampleByGrnIdAndBatchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-samplings/pre-sample/${queryArg.grnId}/${queryArg.batchId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1MaterialSpecifications: build.mutation<
      PostApiV1MaterialSpecificationsApiResponse,
      PostApiV1MaterialSpecificationsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-specifications`,
        method: "POST",
        body: queryArg.domainEntitiesMaterialSpecificationsCreateMaterialSpecificationRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialSpecifications: build.query<
      GetApiV1MaterialSpecificationsApiResponse,
      GetApiV1MaterialSpecificationsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-specifications`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          materialKind: queryArg.materialKind,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          isVerified: queryArg.isVerified,
        },
      }),
    }),
    getApiV1MaterialSpecificationsById: build.query<
      GetApiV1MaterialSpecificationsByIdApiResponse,
      GetApiV1MaterialSpecificationsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-specifications/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1MaterialSpecificationsById: build.mutation<
      PutApiV1MaterialSpecificationsByIdApiResponse,
      PutApiV1MaterialSpecificationsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-specifications/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesMaterialSpecificationsUpdateMaterialSpecificationRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1MaterialSpecificationsById: build.mutation<
      DeleteApiV1MaterialSpecificationsByIdApiResponse,
      DeleteApiV1MaterialSpecificationsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-specifications/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialSpecificationsMaterialsNotLinked: build.query<
      GetApiV1MaterialSpecificationsMaterialsNotLinkedApiResponse,
      GetApiV1MaterialSpecificationsMaterialsNotLinkedApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-specifications/materials/not-linked`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          materialKind: queryArg.materialKind,
        },
      }),
    }),
    getApiV1MaterialSpecificationsMaterialByMaterialId: build.query<
      GetApiV1MaterialSpecificationsMaterialByMaterialIdApiResponse,
      GetApiV1MaterialSpecificationsMaterialByMaterialIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-specifications/material/${queryArg.materialId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialSpecificationsMaterials: build.query<
      GetApiV1MaterialSpecificationsMaterialsApiResponse,
      GetApiV1MaterialSpecificationsMaterialsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-specifications/materials`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          specificationNumber: queryArg.specificationNumber,
        },
      }),
    }),
    postApiV1MaterialSpecificationsAddRemoveMaterials: build.mutation<
      PostApiV1MaterialSpecificationsAddRemoveMaterialsApiResponse,
      PostApiV1MaterialSpecificationsAddRemoveMaterialsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-specifications/add-remove-materials`,
        method: "POST",
        body: queryArg.domainEntitiesMaterialSpecificationsAddRemoveMaterialToSpecificationRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1MaterialSpecificationsImport: build.mutation<
      PostApiV1MaterialSpecificationsImportApiResponse,
      PostApiV1MaterialSpecificationsImportApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-specifications/import`,
        method: "POST",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          materialKind: queryArg.materialKind,
        },
      }),
    }),
    postApiV1MaterialStps: build.mutation<
      PostApiV1MaterialStpsApiResponse,
      PostApiV1MaterialStpsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-stps`,
        method: "POST",
        body: queryArg.domainEntitiesMaterialStandardTestProceduresCreateMaterialStandardTestProcedureRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialStps: build.query<
      GetApiV1MaterialStpsApiResponse,
      GetApiV1MaterialStpsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-stps`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          materialKind: queryArg.materialKind,
          unused: queryArg.unused,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          analysisType: queryArg.analysisType,
        },
      }),
    }),
    getApiV1MaterialStpsById: build.query<
      GetApiV1MaterialStpsByIdApiResponse,
      GetApiV1MaterialStpsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-stps/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1MaterialStpsById: build.mutation<
      PutApiV1MaterialStpsByIdApiResponse,
      PutApiV1MaterialStpsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-stps/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesMaterialStandardTestProceduresCreateMaterialStandardTestProcedureRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1MaterialStpsById: build.mutation<
      DeleteApiV1MaterialStpsByIdApiResponse,
      DeleteApiV1MaterialStpsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-stps/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialStpsByMaterialIdMaterial: build.query<
      GetApiV1MaterialStpsByMaterialIdMaterialApiResponse,
      GetApiV1MaterialStpsByMaterialIdMaterialApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-stps/${queryArg.materialId}/material`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialStpsByStpNumberMaterials: build.query<
      GetApiV1MaterialStpsByStpNumberMaterialsApiResponse,
      GetApiV1MaterialStpsByStpNumberMaterialsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-stps/${queryArg.stpNumber}/materials`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1MaterialStpsAddRemoveMaterials: build.mutation<
      PostApiV1MaterialStpsAddRemoveMaterialsApiResponse,
      PostApiV1MaterialStpsAddRemoveMaterialsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-stps/add-remove-materials`,
        method: "POST",
        body: queryArg.domainEntitiesMaterialStandardTestProceduresAddRemoveMaterialToStpRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialStpsUnusedMaterials: build.query<
      GetApiV1MaterialStpsUnusedMaterialsApiResponse,
      GetApiV1MaterialStpsUnusedMaterialsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material-stps/unused-materials`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          kind: queryArg.kind,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
        },
      }),
    }),
    postApiV1QaOosInvestigationsInitiate: build.mutation<
      PostApiV1QaOosInvestigationsInitiateApiResponse,
      PostApiV1QaOosInvestigationsInitiateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/oos-investigations/initiate`,
        method: "POST",
        body: queryArg.domainEntitiesOosInvestigationsInitiateOosInvestigationRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1QaOosInvestigationsById: build.mutation<
      PutApiV1QaOosInvestigationsByIdApiResponse,
      PutApiV1QaOosInvestigationsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/oos-investigations/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesOosInvestigationsUpdateOosInvestigationRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QaOosInvestigationsById: build.query<
      GetApiV1QaOosInvestigationsByIdApiResponse,
      GetApiV1QaOosInvestigationsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/oos-investigations/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1QaOosInvestigationsByIdSubmit: build.mutation<
      PutApiV1QaOosInvestigationsByIdSubmitApiResponse,
      PutApiV1QaOosInvestigationsByIdSubmitApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/oos-investigations/${queryArg.id}/submit`,
        method: "PUT",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1QaOosInvestigationsByIdQaReview: build.mutation<
      PutApiV1QaOosInvestigationsByIdQaReviewApiResponse,
      PutApiV1QaOosInvestigationsByIdQaReviewApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/oos-investigations/${queryArg.id}/qa-review`,
        method: "PUT",
        body: queryArg.domainEntitiesOosInvestigationsReviewOosInvestigationRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QaOosInvestigations: build.query<
      GetApiV1QaOosInvestigationsApiResponse,
      GetApiV1QaOosInvestigationsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/oos-investigations`,
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
    postApiV1ProductArd: build.mutation<
      PostApiV1ProductArdApiResponse,
      PostApiV1ProductArdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-ard`,
        method: "POST",
        body: queryArg.domainEntitiesProductAnalyticalRawDataCreateProductAnalyticalRawDataRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductArd: build.query<
      GetApiV1ProductArdApiResponse,
      GetApiV1ProductArdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-ard`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          isVerified: queryArg.isVerified,
        },
      }),
    }),
    getApiV1ProductArdById: build.query<
      GetApiV1ProductArdByIdApiResponse,
      GetApiV1ProductArdByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-ard/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProductArdById: build.mutation<
      PutApiV1ProductArdByIdApiResponse,
      PutApiV1ProductArdByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-ard/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesProductAnalyticalRawDataCreateProductAnalyticalRawDataRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ProductArdById: build.mutation<
      DeleteApiV1ProductArdByIdApiResponse,
      DeleteApiV1ProductArdByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-ard/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductArdProductByProductId: build.query<
      GetApiV1ProductArdProductByProductIdApiResponse,
      GetApiV1ProductArdProductByProductIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-ard/product/${queryArg.productId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductArdProductBatchDetailsByBatchManufacturingRecordId:
      build.query<
        GetApiV1ProductArdProductBatchDetailsByBatchManufacturingRecordIdApiResponse,
        GetApiV1ProductArdProductBatchDetailsByBatchManufacturingRecordIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/product-ard/product/batch-details/${queryArg.batchManufacturingRecordId}`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    putApiV1ProductArdStartTestByBatchManufacturingRecordId: build.mutation<
      PutApiV1ProductArdStartTestByBatchManufacturingRecordIdApiResponse,
      PutApiV1ProductArdStartTestByBatchManufacturingRecordIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-ard/start-test/${queryArg.batchManufacturingRecordId}`,
        method: "PUT",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProductSamplings: build.mutation<
      PostApiV1ProductSamplingsApiResponse,
      PostApiV1ProductSamplingsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-samplings`,
        method: "POST",
        body: queryArg.domainEntitiesProductsSamplingCreateProductSamplingRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductSamplingsByBmrId: build.query<
      GetApiV1ProductSamplingsByBmrIdApiResponse,
      GetApiV1ProductSamplingsByBmrIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-samplings/${queryArg.bmrId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProductSamplingsByProductSamplingId: build.mutation<
      PutApiV1ProductSamplingsByProductSamplingIdApiResponse,
      PutApiV1ProductSamplingsByProductSamplingIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-samplings/${queryArg.productSamplingId}`,
        method: "PUT",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          issueNumber: queryArg.issueNumber,
        },
      }),
    }),
    postApiV1ProductSpecifications: build.mutation<
      PostApiV1ProductSpecificationsApiResponse,
      PostApiV1ProductSpecificationsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-specifications`,
        method: "POST",
        body: queryArg.domainEntitiesProductSpecificationsCreateProductSpecificationRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductSpecifications: build.query<
      GetApiV1ProductSpecificationsApiResponse,
      GetApiV1ProductSpecificationsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-specifications`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          isVerified: queryArg.isVerified,
        },
      }),
    }),
    getApiV1ProductSpecificationsById: build.query<
      GetApiV1ProductSpecificationsByIdApiResponse,
      GetApiV1ProductSpecificationsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-specifications/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProductSpecificationsById: build.mutation<
      PutApiV1ProductSpecificationsByIdApiResponse,
      PutApiV1ProductSpecificationsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-specifications/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesProductSpecificationsUpdateProductSpecificationRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ProductSpecificationsById: build.mutation<
      DeleteApiV1ProductSpecificationsByIdApiResponse,
      DeleteApiV1ProductSpecificationsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-specifications/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductSpecificationsProductsNotLinked: build.query<
      GetApiV1ProductSpecificationsProductsNotLinkedApiResponse,
      GetApiV1ProductSpecificationsProductsNotLinkedApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-specifications/products/not-linked`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
        },
      }),
    }),
    getApiV1ProductSpecificationsProductById: build.query<
      GetApiV1ProductSpecificationsProductByIdApiResponse,
      GetApiV1ProductSpecificationsProductByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-specifications/product/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductSpecificationsProducts: build.query<
      GetApiV1ProductSpecificationsProductsApiResponse,
      GetApiV1ProductSpecificationsProductsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-specifications/products`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          specificationNumber: queryArg.specificationNumber,
        },
      }),
    }),
    postApiV1ProductSpecificationsAddRemoveProducts: build.mutation<
      PostApiV1ProductSpecificationsAddRemoveProductsApiResponse,
      PostApiV1ProductSpecificationsAddRemoveProductsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-specifications/add-remove-products`,
        method: "POST",
        body: queryArg.domainEntitiesProductSpecificationsAddRemoveProductToSpecificationRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProductStps: build.mutation<
      PostApiV1ProductStpsApiResponse,
      PostApiV1ProductStpsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-stps`,
        method: "POST",
        body: queryArg.domainEntitiesProductStandardTestProceduresCreateProductStandardTestProcedureRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductStps: build.query<
      GetApiV1ProductStpsApiResponse,
      GetApiV1ProductStpsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-stps`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
        },
      }),
    }),
    getApiV1ProductStpsByStpNumberProducts: build.query<
      GetApiV1ProductStpsByStpNumberProductsApiResponse,
      GetApiV1ProductStpsByStpNumberProductsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-stps/${queryArg.stpNumber}/products`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductStpsById: build.query<
      GetApiV1ProductStpsByIdApiResponse,
      GetApiV1ProductStpsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-stps/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProductStpsById: build.mutation<
      PutApiV1ProductStpsByIdApiResponse,
      PutApiV1ProductStpsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-stps/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesProductStandardTestProceduresUpdateProductStandardTestProcedureRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ProductStpsById: build.mutation<
      DeleteApiV1ProductStpsByIdApiResponse,
      DeleteApiV1ProductStpsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-stps/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductStpsByProductIdProduct: build.query<
      GetApiV1ProductStpsByProductIdProductApiResponse,
      GetApiV1ProductStpsByProductIdProductApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-stps/${queryArg.productId}/product`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProductStpsAddRemoveProducts: build.mutation<
      PostApiV1ProductStpsAddRemoveProductsApiResponse,
      PostApiV1ProductStpsAddRemoveProductsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-stps/add-remove-products`,
        method: "POST",
        body: queryArg.domainEntitiesProductStandardTestProceduresAddRemoveProductToStpRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductStpsUnusedProducts: build.query<
      GetApiV1ProductStpsUnusedProductsApiResponse,
      GetApiV1ProductStpsUnusedProductsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-stps/unused-products`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
        },
      }),
    }),
    getApiV1ProductStpsUnlinkedToArd: build.query<
      GetApiV1ProductStpsUnlinkedToArdApiResponse,
      GetApiV1ProductStpsUnlinkedToArdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/product-stps/unlinked-to-ard`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          stage: queryArg.stage,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          analysisType: queryArg.analysisType,
        },
      }),
    }),
    getApiV1StpDocumentsByOwnerTypeAndOwnerId: build.query<
      GetApiV1StpDocumentsByOwnerTypeAndOwnerIdApiResponse,
      GetApiV1StpDocumentsByOwnerTypeAndOwnerIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/stp-documents/${queryArg.ownerType}/${queryArg.ownerId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1StpDocumentsByOwnerTypeAndOwnerIdVersions: build.mutation<
      PostApiV1StpDocumentsByOwnerTypeAndOwnerIdVersionsApiResponse,
      PostApiV1StpDocumentsByOwnerTypeAndOwnerIdVersionsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/stp-documents/${queryArg.ownerType}/${queryArg.ownerId}/versions`,
        method: "POST",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1StpDocumentsByOwnerTypeAndOwnerIdNew: build.mutation<
      PostApiV1StpDocumentsByOwnerTypeAndOwnerIdNewApiResponse,
      PostApiV1StpDocumentsByOwnerTypeAndOwnerIdNewApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/stp-documents/${queryArg.ownerType}/${queryArg.ownerId}/new`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1StpDocumentsDocumentsByDocumentIdVersionsAndVersionIdFile:
      build.query<
        GetApiV1StpDocumentsDocumentsByDocumentIdVersionsAndVersionIdFileApiResponse,
        GetApiV1StpDocumentsDocumentsByDocumentIdVersionsAndVersionIdFileApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/stp-documents/documents/${queryArg.documentId}/versions/${queryArg.versionId}/file`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    postApiV1StpDocumentsDocumentsByDocumentIdSubmitReview: build.mutation<
      PostApiV1StpDocumentsDocumentsByDocumentIdSubmitReviewApiResponse,
      PostApiV1StpDocumentsDocumentsByDocumentIdSubmitReviewApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/stp-documents/documents/${queryArg.documentId}/submit-review`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1StpDocumentsDocumentsByDocumentIdApprove: build.mutation<
      PostApiV1StpDocumentsDocumentsByDocumentIdApproveApiResponse,
      PostApiV1StpDocumentsDocumentsByDocumentIdApproveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/stp-documents/documents/${queryArg.documentId}/approve`,
        method: "POST",
        body: queryArg.domainEntitiesStpDocumentsSubmitStpDocumentVersionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1StpDocumentsDocumentsByDocumentIdReject: build.mutation<
      PostApiV1StpDocumentsDocumentsByDocumentIdRejectApiResponse,
      PostApiV1StpDocumentsDocumentsByDocumentIdRejectApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/stp-documents/documents/${queryArg.documentId}/reject`,
        method: "POST",
        body: queryArg.domainEntitiesStpDocumentsSubmitStpDocumentVersionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as analyticalApi };
export type PostApiV1QaAnalyticalTestsApiResponse = /** status 200 OK */ string;
export type PostApiV1QaAnalyticalTestsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesAnalyticalTestRequestsCreateAnalyticalTestRequest: DomainEntitiesAnalyticalTestRequestsCreateAnalyticalTestRequest;
};
export type GetApiV1QaAnalyticalTestsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesAnalyticalTestRequestsAnalyticalTestRequestDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1QaAnalyticalTestsApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  status?: DomainEntitiesAnalyticalTestRequestsAnalyticalTestStatus;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1QaAnalyticalTestsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesAnalyticalTestRequestsAnalyticalTestRequestDto;
export type GetApiV1QaAnalyticalTestsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1QaAnalyticalTestsByIdApiResponse =
  /** status 204 No Content */ DomainEntitiesAnalyticalTestRequestsAnalyticalTestRequestDto;
export type PutApiV1QaAnalyticalTestsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesAnalyticalTestRequestsCreateAnalyticalTestRequest: DomainEntitiesAnalyticalTestRequestsCreateAnalyticalTestRequest;
};
export type DeleteApiV1QaAnalyticalTestsByIdApiResponse = void;
export type DeleteApiV1QaAnalyticalTestsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1QaAnalyticalTestsStatusByIdApiResponse =
  /** status 204 No Content */ DomainEntitiesAnalyticalTestRequestsAnalyticalTestRequestDto;
export type PutApiV1QaAnalyticalTestsStatusByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesAnalyticalTestRequestsUpdateAnalyticalTestRequest: DomainEntitiesAnalyticalTestRequestsUpdateAnalyticalTestRequest;
};
export type PutApiV1QaAnalyticalTestsAssignByIdApiResponse = void;
export type PutApiV1QaAnalyticalTestsAssignByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesAnalyticalTestRequestsAssignAnalyticalTestRequest: DomainEntitiesAnalyticalTestRequestsAssignAnalyticalTestRequest;
};
export type PutApiV1QaAnalyticalTestsReassignByIdApiResponse = void;
export type PutApiV1QaAnalyticalTestsReassignByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesAnalyticalTestRequestsAssignAnalyticalTestRequest: DomainEntitiesAnalyticalTestRequestsAssignAnalyticalTestRequest;
};
export type PostApiV1QaAnalyticalTestsRequestRetestByIdApiResponse = void;
export type PostApiV1QaAnalyticalTestsRequestRetestByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QaAnalyticalTestsCompleteRetestByIdApiResponse = void;
export type PostApiV1QaAnalyticalTestsCompleteRetestByIdApiArg = {
  id: string;
  extendedExpiryDate?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1QaAnalyticalTestsActivityStepByActivityStepIdApiResponse =
  /** status 200 OK */ DomainEntitiesAnalyticalTestRequestsAnalyticalTestRequestDto;
export type GetApiV1QaAnalyticalTestsActivityStepByActivityStepIdApiArg = {
  activityStepId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1MaterialArdApiResponse = /** status 200 OK */ string;
export type PostApiV1MaterialArdApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesMaterialArdCreateMaterialAnalyticalRawDataRequest: DomainEntitiesMaterialArdCreateMaterialAnalyticalRawDataRequest;
};
export type GetApiV1MaterialArdApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialArdMaterialAnalyticalRawDataDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1MaterialArdApiArg = {
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  isVerified?: boolean;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialArdByIdApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialArdMaterialAnalyticalRawDataDto;
export type GetApiV1MaterialArdByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1MaterialArdByIdApiResponse =
  /** status 204 No Content */ DomainEntitiesMaterialArdMaterialAnalyticalRawDataDto;
export type PutApiV1MaterialArdByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesMaterialArdCreateMaterialAnalyticalRawDataRequest: DomainEntitiesMaterialArdCreateMaterialAnalyticalRawDataRequest;
};
export type DeleteApiV1MaterialArdByIdApiResponse = void;
export type DeleteApiV1MaterialArdByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialArdMaterialByMaterialIdApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialArdMaterialAnalyticalRawDataDto;
export type GetApiV1MaterialArdMaterialByMaterialIdApiArg = {
  materialId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialArdMaterialBatchByMaterialBatchIdApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialArdMaterialAnalyticalRawDataDto;
export type GetApiV1MaterialArdMaterialBatchByMaterialBatchIdApiArg = {
  materialBatchId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialArdMaterialBatchDetailsByMaterialBatchIdApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialArdMaterialBatchArdRead;
export type GetApiV1MaterialArdMaterialBatchDetailsByMaterialBatchIdApiArg = {
  materialBatchId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1MaterialArdStartTestByMaterialBatchIdApiResponse = void;
export type PutApiV1MaterialArdStartTestByMaterialBatchIdApiArg = {
  materialBatchId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1MaterialArdUniformityOfWeightApiResponse =
  /** status 200 OK */ string;
export type PostApiV1MaterialArdUniformityOfWeightApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesUniformityOfWeightsCreateUniformityOfWeight: DomainEntitiesUniformityOfWeightsCreateUniformityOfWeight;
};
export type GetApiV1MaterialArdUniformityOfWeightApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesUniformityOfWeightsUniformityOfWeightDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1MaterialArdUniformityOfWeightApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialArdUniformityOfWeightByIdApiResponse =
  /** status 200 OK */ DomainEntitiesUniformityOfWeightsUniformityOfWeightDto;
export type GetApiV1MaterialArdUniformityOfWeightByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1MaterialArdUniformityOfWeightByIdApiResponse = void;
export type PutApiV1MaterialArdUniformityOfWeightByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesUniformityOfWeightsCreateUniformityOfWeight: DomainEntitiesUniformityOfWeightsCreateUniformityOfWeight;
};
export type DeleteApiV1MaterialArdUniformityOfWeightByIdApiResponse = void;
export type DeleteApiV1MaterialArdUniformityOfWeightByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1MaterialArdUniformityOfWeightResponseApiResponse =
  /** status 200 OK */ string;
export type PostApiV1MaterialArdUniformityOfWeightResponseApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesUniformityOfWeightsCreateUniformityOfWeightResponse: DomainEntitiesUniformityOfWeightsCreateUniformityOfWeightResponse;
};
export type GetApiV1MaterialArdUniformityOfWeightByUniformityOfWeightIdAndMaterialBatchIdResponseApiResponse =
  /** status 200 OK */ DomainEntitiesUniformityOfWeightsUniformityOfWeightResponseDto[];
export type GetApiV1MaterialArdUniformityOfWeightByUniformityOfWeightIdAndMaterialBatchIdResponseApiArg =
  {
    uniformityOfWeightId: string;
    materialBatchId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PostApiV1MaterialSamplingsApiResponse = /** status 200 OK */ string;
export type PostApiV1MaterialSamplingsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesMaterialSamplingCreateMaterialSamplingRequest: DomainEntitiesMaterialSamplingCreateMaterialSamplingRequest;
};
export type PutApiV1MaterialSamplingsByMaterialSamplingIdApiResponse = void;
export type PutApiV1MaterialSamplingsByMaterialSamplingIdApiArg = {
  materialSamplingId: string;
  issueNumber?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialSamplingsByGrnIdAndBatchIdApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialSamplingMaterialSamplingDtoRead;
export type GetApiV1MaterialSamplingsByGrnIdAndBatchIdApiArg = {
  grnId: string;
  batchId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1MaterialSamplingsPreSampleApiResponse =
  /** status 200 OK */ string;
export type PostApiV1MaterialSamplingsPreSampleApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesChecklistsCreatePreSampleChecklistRequest: DomainEntitiesChecklistsCreatePreSampleChecklistRequest;
};
export type GetApiV1MaterialSamplingsPreSampleByGrnIdAndBatchIdApiResponse =
  /** status 200 OK */ DomainEntitiesChecklistsPreSampleChecklistDtoRead;
export type GetApiV1MaterialSamplingsPreSampleByGrnIdAndBatchIdApiArg = {
  grnId: string;
  batchId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1MaterialSpecificationsApiResponse =
  /** status 200 OK */ string;
export type PostApiV1MaterialSpecificationsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesMaterialSpecificationsCreateMaterialSpecificationRequest: DomainEntitiesMaterialSpecificationsCreateMaterialSpecificationRequest;
};
export type GetApiV1MaterialSpecificationsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialSpecificationsMaterialSpecificationDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1MaterialSpecificationsApiArg = {
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  isVerified?: boolean;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialSpecificationsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialSpecificationsMaterialSpecificationDto;
export type GetApiV1MaterialSpecificationsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1MaterialSpecificationsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialSpecificationsMaterialSpecificationMappingDto[];
export type PutApiV1MaterialSpecificationsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesMaterialSpecificationsUpdateMaterialSpecificationRequest: DomainEntitiesMaterialSpecificationsUpdateMaterialSpecificationRequest;
};
export type DeleteApiV1MaterialSpecificationsByIdApiResponse = void;
export type DeleteApiV1MaterialSpecificationsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialSpecificationsMaterialsNotLinkedApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericList601DomainEntitiesMaterialsMaterialDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1MaterialSpecificationsMaterialsNotLinkedApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialSpecificationsMaterialByMaterialIdApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialSpecificationsMaterialSpecificationDto;
export type GetApiV1MaterialSpecificationsMaterialByMaterialIdApiArg = {
  materialId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialSpecificationsMaterialsApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialSpecificationsMaterialSpecificationDto[];
export type GetApiV1MaterialSpecificationsMaterialsApiArg = {
  specificationNumber?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1MaterialSpecificationsAddRemoveMaterialsApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialSpecificationsMaterialSpecificationMappingDto[];
export type PostApiV1MaterialSpecificationsAddRemoveMaterialsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesMaterialSpecificationsAddRemoveMaterialToSpecificationRequest: DomainEntitiesMaterialSpecificationsAddRemoveMaterialToSpecificationRequest;
};
export type PostApiV1MaterialSpecificationsImportApiResponse = void;
export type PostApiV1MaterialSpecificationsImportApiArg = {
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  body: {
    file?: Blob;
  };
};
export type PostApiV1MaterialStpsApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialStandardTestProceduresMaterialStpMappingDto[];
export type PostApiV1MaterialStpsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesMaterialStandardTestProceduresCreateMaterialStandardTestProcedureRequest: DomainEntitiesMaterialStandardTestProceduresCreateMaterialStandardTestProcedureRequest;
};
export type GetApiV1MaterialStpsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialStandardTestProceduresMaterialStandardTestProcedureDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1MaterialStpsApiArg = {
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  unused?: boolean;
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialStpsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialStandardTestProceduresMaterialStandardTestProcedureDto;
export type GetApiV1MaterialStpsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1MaterialStpsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialStandardTestProceduresMaterialStpMappingDto[];
export type PutApiV1MaterialStpsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesMaterialStandardTestProceduresCreateMaterialStandardTestProcedureRequest: DomainEntitiesMaterialStandardTestProceduresCreateMaterialStandardTestProcedureRequest;
};
export type DeleteApiV1MaterialStpsByIdApiResponse = void;
export type DeleteApiV1MaterialStpsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialStpsByMaterialIdMaterialApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialStandardTestProceduresMaterialStandardTestProcedureDto;
export type GetApiV1MaterialStpsByMaterialIdMaterialApiArg = {
  materialId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialStpsByStpNumberMaterialsApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialStandardTestProceduresMaterialStandardTestProcedureDto[];
export type GetApiV1MaterialStpsByStpNumberMaterialsApiArg = {
  stpNumber: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1MaterialStpsAddRemoveMaterialsApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialStandardTestProceduresMaterialStpMappingDto[];
export type PostApiV1MaterialStpsAddRemoveMaterialsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesMaterialStandardTestProceduresAddRemoveMaterialToStpRequest: DomainEntitiesMaterialStandardTestProceduresAddRemoveMaterialToStpRequest;
};
export type GetApiV1MaterialStpsUnusedMaterialsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsMaterialDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1MaterialStpsUnusedMaterialsApiArg = {
  kind?: DomainEntitiesMaterialsMaterialKind;
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QaOosInvestigationsInitiateApiResponse =
  /** status 200 OK */ string;
export type PostApiV1QaOosInvestigationsInitiateApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesOosInvestigationsInitiateOosInvestigationRequest: DomainEntitiesOosInvestigationsInitiateOosInvestigationRequest;
};
export type PutApiV1QaOosInvestigationsByIdApiResponse = void;
export type PutApiV1QaOosInvestigationsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesOosInvestigationsUpdateOosInvestigationRequest: DomainEntitiesOosInvestigationsUpdateOosInvestigationRequest;
};
export type GetApiV1QaOosInvestigationsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesOosInvestigationsOosInvestigationDto;
export type GetApiV1QaOosInvestigationsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1QaOosInvestigationsByIdSubmitApiResponse = void;
export type PutApiV1QaOosInvestigationsByIdSubmitApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1QaOosInvestigationsByIdQaReviewApiResponse = void;
export type PutApiV1QaOosInvestigationsByIdQaReviewApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesOosInvestigationsReviewOosInvestigationRequest: DomainEntitiesOosInvestigationsReviewOosInvestigationRequest;
};
export type GetApiV1QaOosInvestigationsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesOosInvestigationsOosInvestigationDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1QaOosInvestigationsApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  status?: DomainEntitiesOosInvestigationsOosInvestigationStatus;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProductArdApiResponse = /** status 200 OK */ string;
export type PostApiV1ProductArdApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesProductAnalyticalRawDataCreateProductAnalyticalRawDataRequest: DomainEntitiesProductAnalyticalRawDataCreateProductAnalyticalRawDataRequest;
};
export type GetApiV1ProductArdApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawDataDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProductArdApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  isVerified?: boolean;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductArdByIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawDataDto;
export type GetApiV1ProductArdByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProductArdByIdApiResponse =
  /** status 204 No Content */ DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawDataDto;
export type PutApiV1ProductArdByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesProductAnalyticalRawDataCreateProductAnalyticalRawDataRequest: DomainEntitiesProductAnalyticalRawDataCreateProductAnalyticalRawDataRequest;
};
export type DeleteApiV1ProductArdByIdApiResponse = void;
export type DeleteApiV1ProductArdByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductArdProductByProductIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawDataDto[];
export type GetApiV1ProductArdProductByProductIdApiArg = {
  productId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductArdProductBatchDetailsByBatchManufacturingRecordIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductAnalyticalRawDataProductBatchArd;
export type GetApiV1ProductArdProductBatchDetailsByBatchManufacturingRecordIdApiArg =
  {
    batchManufacturingRecordId: string;
    testStage: DomainEntitiesAnalyticalTestRequestsTestStage;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PutApiV1ProductArdStartTestByBatchManufacturingRecordIdApiResponse = void;
export type PutApiV1ProductArdStartTestByBatchManufacturingRecordIdApiArg = {
  batchManufacturingRecordId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProductSamplingsApiResponse = /** status 200 OK */ string;
export type PostApiV1ProductSamplingsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesProductsSamplingCreateProductSamplingRequest: DomainEntitiesProductsSamplingCreateProductSamplingRequest;
};
export type GetApiV1ProductSamplingsByBmrIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductsSamplingProductSamplingDto;
export type GetApiV1ProductSamplingsByBmrIdApiArg = {
  bmrId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProductSamplingsByProductSamplingIdApiResponse = void;
export type PutApiV1ProductSamplingsByProductSamplingIdApiArg = {
  productSamplingId: string;
  issueNumber?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProductSpecificationsApiResponse =
  /** status 200 OK */ string;
export type PostApiV1ProductSpecificationsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesProductSpecificationsCreateProductSpecificationRequest: DomainEntitiesProductSpecificationsCreateProductSpecificationRequest;
};
export type GetApiV1ProductSpecificationsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductSpecificationsProductSpecificationDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1ProductSpecificationsApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  isVerified?: boolean;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductSpecificationsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductSpecificationsProductSpecificationDtoRead;
export type GetApiV1ProductSpecificationsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProductSpecificationsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductSpecificationsProductSpecificationMappingDto[];
export type PutApiV1ProductSpecificationsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesProductSpecificationsUpdateProductSpecificationRequest: DomainEntitiesProductSpecificationsUpdateProductSpecificationRequest;
};
export type DeleteApiV1ProductSpecificationsByIdApiResponse = void;
export type DeleteApiV1ProductSpecificationsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductSpecificationsProductsNotLinkedApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericList601DomainEntitiesProductsProductListDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProductSpecificationsProductsNotLinkedApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductSpecificationsProductByIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductSpecificationsProductSpecificationDtoRead[];
export type GetApiV1ProductSpecificationsProductByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductSpecificationsProductsApiResponse =
  /** status 200 OK */ DomainEntitiesProductSpecificationsProductSpecificationDtoRead[];
export type GetApiV1ProductSpecificationsProductsApiArg = {
  specificationNumber?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProductSpecificationsAddRemoveProductsApiResponse =
  /** status 200 OK */ DomainEntitiesProductSpecificationsProductSpecificationMappingDto[];
export type PostApiV1ProductSpecificationsAddRemoveProductsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesProductSpecificationsAddRemoveProductToSpecificationRequest: DomainEntitiesProductSpecificationsAddRemoveProductToSpecificationRequest;
};
export type PostApiV1ProductStpsApiResponse = /** status 200 OK */ string;
export type PostApiV1ProductStpsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesProductStandardTestProceduresCreateProductStandardTestProcedureRequest: DomainEntitiesProductStandardTestProceduresCreateProductStandardTestProcedureRequest;
};
export type GetApiV1ProductStpsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductStandardTestProceduresProductStandardTestProcedureDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProductStpsApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductStpsByStpNumberProductsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductStandardTestProceduresProductStandardTestProcedureDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProductStpsByStpNumberProductsApiArg = {
  stpNumber: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductStpsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductStandardTestProceduresProductStandardTestProcedureDto;
export type GetApiV1ProductStpsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProductStpsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductStandardTestProceduresProductStpMappingDto[];
export type PutApiV1ProductStpsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesProductStandardTestProceduresUpdateProductStandardTestProcedureRequest: DomainEntitiesProductStandardTestProceduresUpdateProductStandardTestProcedureRequest;
};
export type DeleteApiV1ProductStpsByIdApiResponse = void;
export type DeleteApiV1ProductStpsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductStpsByProductIdProductApiResponse =
  /** status 200 OK */ DomainEntitiesProductStandardTestProceduresProductStandardTestProcedureDto;
export type GetApiV1ProductStpsByProductIdProductApiArg = {
  productId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProductStpsAddRemoveProductsApiResponse =
  /** status 200 OK */ DomainEntitiesProductStandardTestProceduresProductStpMappingDto[];
export type PostApiV1ProductStpsAddRemoveProductsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesProductStandardTestProceduresAddRemoveProductToStpRequest: DomainEntitiesProductStandardTestProceduresAddRemoveProductToStpRequest;
};
export type GetApiV1ProductStpsUnusedProductsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductsProductListDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProductStpsUnusedProductsApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductStpsUnlinkedToArdApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductStandardTestProceduresProductStandardTestProcedureDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProductStpsUnlinkedToArdApiArg = {
  stage?: DomainEntitiesAnalyticalTestRequestsTestStage;
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1StpDocumentsByOwnerTypeAndOwnerIdApiResponse =
  /** status 200 OK */ DomainEntitiesStpDocumentsStpDocumentDto;
export type GetApiV1StpDocumentsByOwnerTypeAndOwnerIdApiArg = {
  ownerType: string;
  ownerId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1StpDocumentsByOwnerTypeAndOwnerIdVersionsApiResponse =
  /** status 200 OK */ DomainEntitiesStpDocumentsStpDocumentDto;
export type PostApiV1StpDocumentsByOwnerTypeAndOwnerIdVersionsApiArg = {
  ownerType: string;
  ownerId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  body: {
    file?: Blob;
    reasonForChange?: string;
  };
};
export type PostApiV1StpDocumentsByOwnerTypeAndOwnerIdNewApiResponse =
  /** status 200 OK */ DomainEntitiesStpDocumentsStpDocumentDto;
export type PostApiV1StpDocumentsByOwnerTypeAndOwnerIdNewApiArg = {
  ownerType: string;
  ownerId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1StpDocumentsDocumentsByDocumentIdVersionsAndVersionIdFileApiResponse =
  /** status 200 OK */ Blob;
export type GetApiV1StpDocumentsDocumentsByDocumentIdVersionsAndVersionIdFileApiArg =
  {
    documentId: string;
    versionId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PostApiV1StpDocumentsDocumentsByDocumentIdSubmitReviewApiResponse =
  /** status 200 OK */ DomainEntitiesStpDocumentsStpDocumentDto;
export type PostApiV1StpDocumentsDocumentsByDocumentIdSubmitReviewApiArg = {
  documentId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1StpDocumentsDocumentsByDocumentIdApproveApiResponse =
  /** status 200 OK */ DomainEntitiesStpDocumentsStpDocumentDto;
export type PostApiV1StpDocumentsDocumentsByDocumentIdApproveApiArg = {
  documentId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesStpDocumentsSubmitStpDocumentVersionRequest: DomainEntitiesStpDocumentsSubmitStpDocumentVersionRequest;
};
export type PostApiV1StpDocumentsDocumentsByDocumentIdRejectApiResponse =
  /** status 200 OK */ DomainEntitiesStpDocumentsStpDocumentDto;
export type PostApiV1StpDocumentsDocumentsByDocumentIdRejectApiArg = {
  documentId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesStpDocumentsSubmitStpDocumentVersionRequest: DomainEntitiesStpDocumentsSubmitStpDocumentVersionRequest;
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
export type DomainEntitiesAnalyticalTestRequestsTestStage = 0 | 1 | 2;
export type DomainEntitiesAnalyticalTestRequestsAnalyticalTestStatus =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type DomainEntitiesAnalyticalTestRequestsCreateAnalyticalTestRequest = {
  batchManufacturingRecordId?: string;
  productionScheduleProductId?: string;
  sampledQuantity?: string | null;
  manufacturingDate?: string;
  expiryDate?: string;
  releasedAt?: string | null;
  releaseDate?: string | null;
  stage?: DomainEntitiesAnalyticalTestRequestsTestStage;
  status?: DomainEntitiesAnalyticalTestRequestsAnalyticalTestStatus;
  filled?: string | null;
  stateId?: string;
  productionActivityStepId?: string | null;
  numberOfContainers?: number;
  sampledAt?: string | null;
  issueNumber?: string | null;
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
export type DomainEntitiesBaseUnitOfMeasureType = 0 | 1 | 2 | 3;
export type DomainEntitiesBaseUnitOfMeasureCategory = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesBaseUnitOfMeasureDto = {
  id?: string;
  name?: string | null;
  symbol?: string | null;
  description?: string | null;
  isScalable?: boolean;
  isRawMaterial?: boolean;
  type?: DomainEntitiesBaseUnitOfMeasureType;
  category?: DomainEntitiesBaseUnitOfMeasureCategory;
  createdAt?: string;
};
export type DomainEntitiesProductsEquipmentsEquipmentDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  equipmentNumber?: string | null;
  isStorage?: boolean;
  capacityQuantity?: number;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  relevanceCheck?: boolean;
  department?: SharedCollectionItemDto;
  location?: string | null;
  model?: string | null;
  serialNumber?: string | null;
};
export type DomainEntitiesProductsProductListDto = {
  id?: string;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  genericName?: string | null;
  storageCondition?: string | null;
  packageStyle?: string | null;
  filledWeight?: string | null;
  shelfLife?: string | null;
  actionUse?: string | null;
  fdaRegistrationNumber?: string | null;
  masterFormulaNumber?: string | null;
  primaryPackDescription?: string | null;
  secondaryPackDescription?: string | null;
  tertiaryPackDescription?: string | null;
  category?: SharedCollectionItemDto;
  baseQuantity?: number;
  fullBatchSize?: number;
  baseUoM?: DomainEntitiesBaseUnitOfMeasureDto;
  equipment?: DomainEntitiesProductsEquipmentsEquipmentDto;
  department?: SharedCollectionItemDto;
  createdAt?: string;
  price?: number;
  priceUoM?: string | null;
  division?: DomainEntitiesProductsDivision;
  labelClaim?: string | null;
  isVerified?: boolean;
  documentNumber?: string | null;
  revisionNumber?: number;
};
export type DomainEntitiesProductionSchedulesBatchSize = 0 | 1;
export type DomainEntitiesBaseTermsOfPaymentDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  description?: string | null;
  dueDays?: number | null;
};
export type DomainEntitiesCustomersCustomerType = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesCurrenciesCurrencyDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  symbol?: string | null;
  description?: string | null;
  isBaseCurrency?: boolean;
};
export type DomainEntitiesCustomersCustomerDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  creditLimit?: number | null;
  termsOfPayment?: DomainEntitiesBaseTermsOfPaymentDto;
  type?: DomainEntitiesCustomersCustomerType;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  billingAddress?: string | null;
  shippingAddress?: string | null;
};
export type DomainEntitiesProductsProductPackingListDto = {
  uom?: DomainEntitiesBaseUnitOfMeasureDto;
  quantity?: number;
  order?: number;
};
export type DomainEntitiesProductsProductPackingDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  description?: string | null;
  packPerShipper?: number;
  basePackingUoM?: DomainEntitiesBaseUnitOfMeasureDto;
  basePackingQuantity?: number;
  expectedYield?: number;
  isDefault?: boolean;
  packingLists?: DomainEntitiesProductsProductPackingListDto[] | null;
};
export type DomainEntitiesProductionSchedulesProductionScheduleProductDto = {
  id?: string;
  productionSchedule?: SharedCollectionItemDto;
  product?: DomainEntitiesProductsProductListDto;
  quantity?: number;
  batchNumber?: string | null;
  batchSize?: DomainEntitiesProductionSchedulesBatchSize;
  marketType?: DomainEntitiesCustomersCustomerDto;
  cancelled?: boolean;
  reasonForCancellation?: string | null;
  productPacking?: DomainEntitiesProductsProductPackingDto;
  hasStarted?: boolean;
  productionActivityId?: string | null;
};
export type DomainEntitiesProductsProductionBatchManufacturingStatus =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type DomainEntitiesProductsProductionBatchManufacturingRecordDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProductDto;
  batchNumber?: string | null;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
  batchQuantity?: number;
  status?: DomainEntitiesProductsProductionBatchManufacturingStatus;
  sampledQuantity?: number;
  issuedDate?: string | null;
};
export type DomainEntitiesBaseOperationDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  description?: string | null;
  order?: number;
};
export type DomainEntitiesBaseResourceDto = {
  id?: string | null;
  name?: string | null;
  type?: string | null;
  isAvailable?: boolean;
};
export type DomainEntitiesProductsProductionProductionActivityStepResourceDto =
  {
    id?: string;
    createdBy?: DomainEntitiesUsersUserDto;
    createdAt?: string;
    resource?: DomainEntitiesBaseResourceDto;
  };
export type DomainEntitiesProductsProductionProductionActivityStepWorkCenterDto =
  {
    id?: string;
    createdBy?: DomainEntitiesUsersUserDto;
    createdAt?: string;
    workCenter?: SharedCollectionItemDto;
  };
export type DomainEntitiesAttachmentsAttachmentDto = {
  link?: string | null;
  name?: string | null;
  id?: string;
  reference?: string | null;
};
export type DomainEntitiesQualityRoutinesAnalysisType = 0 | 1;
export type DomainEntitiesFormsFormType = 0 | 1;
export type DomainEntitiesProductsEquipmentsQcEquipmentCategoryDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
};
export type DomainEntitiesProductsEquipmentsQcEquipmentQualificationStatus =
  0 | 1 | 2 | 3;
export type DomainEntitiesProductsEquipmentsQcEquipmentDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  equipmentId?: string | null;
  name?: string | null;
  qcEquipmentCategory?: DomainEntitiesProductsEquipmentsQcEquipmentCategoryDto;
  serialNumber?: string | null;
  make?: string | null;
  model?: string | null;
  calibrationDueDate?: string | null;
  lastCalibratedAt?: string | null;
  calibrationCertificateAttachmentId?: string | null;
  qualificationStatus?: DomainEntitiesProductsEquipmentsQcEquipmentQualificationStatus;
};
export type DomainEntitiesFormsQuestionType =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export type DomainEntitiesFormsQuestionValidationType = 0 | 1 | 2 | 3;
export type DomainEntitiesFormsQuestionOptionDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  question?: SharedCollectionItemDto;
  name?: string | null;
};
export type DomainEntitiesFormsQuestionDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  label?: string | null;
  type?: DomainEntitiesFormsQuestionType;
  validation?: DomainEntitiesFormsQuestionValidationType;
  isMultiSelect?: boolean;
  reference?: string | null;
  description?: string | null;
  options?: DomainEntitiesFormsQuestionOptionDto[] | null;
};
export type DomainEntitiesFormsFormFieldDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  formSection?: SharedCollectionItemDto;
  question?: DomainEntitiesFormsQuestionDto;
  required?: boolean;
  description?: string | null;
  rank?: number;
};
export type DomainEntitiesFormsFormSectionDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  form?: SharedCollectionItemDto;
  name?: string | null;
  description?: string | null;
  instrument?: DomainEntitiesProductsEquipmentsQcEquipmentDto;
  order?: number;
  fields?: DomainEntitiesFormsFormFieldDto[] | null;
  value?: string | null;
  groupName?: string | null;
  complies?: boolean;
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
};
export type DomainEntitiesFormsFormResponseDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
  responseId?: string;
  productionActivityStepId?: string | null;
  formField?: DomainEntitiesFormsFormFieldDto;
  sectionName?: string | null;
  complies?: boolean;
  value?: string | null;
  checkedBy?: DomainEntitiesUsersUserDto;
  checkedAt?: string | null;
  formulaGoverned?: boolean;
  formulaResultFinalized?: boolean;
  formulaExecutionId?: string | null;
  formulaDisplayResultsJson?: string | null;
};
export type DomainEntitiesFormsFormDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  type?: DomainEntitiesFormsFormType;
  sections?: DomainEntitiesFormsFormSectionDto[] | null;
  responses?: DomainEntitiesFormsFormResponseDto[] | null;
};
export type DomainEntitiesProductStandardTestProceduresProductStandardTestProcedureDto =
  {
    id?: string;
    createdBy?: DomainEntitiesUsersUserDto;
    createdAt?: string;
    attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
    stpNumber?: string | null;
    product?: SharedCollectionItemDto;
    description?: string | null;
  };
export type DomainEntitiesQualityRoutinesCommercialCoaItemRequest = {
  formFieldId?: string;
  displayLabel?: string | null;
  groupName?: string | null;
  specificationText?: string | null;
  unit?: string | null;
  reference?: string | null;
  displayOrder?: number;
};
export type DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawDataDto =
  {
    id?: string;
    createdBy?: DomainEntitiesUsersUserDto;
    createdAt?: string;
    attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
    analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
    specNumber?: string | null;
    stage?: DomainEntitiesAnalyticalTestRequestsTestStage;
    description?: string | null;
    form?: DomainEntitiesFormsFormDto;
    productStandardTestProcedure?: DomainEntitiesProductStandardTestProceduresProductStandardTestProcedureDto;
    isVerified?: boolean;
    coaItems?: DomainEntitiesQualityRoutinesCommercialCoaItemRequest[] | null;
  };
export type DomainEntitiesRoutesOperationAction = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type DomainEntitiesProductsProductionProductionActivityStepUserDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  user?: DomainEntitiesUsersUserDto;
  productAnalyticalRawData?: DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawDataDto;
  action?: DomainEntitiesRoutesOperationAction;
};
export type DomainEntitiesBaseProductionStatus = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesProductsProductionProductionActivityStepDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  productionActivity?: SharedCollectionItemDto;
  operation?: DomainEntitiesBaseOperationDto;
  workFlow?: SharedCollectionItemDto;
  resources?:
    DomainEntitiesProductsProductionProductionActivityStepResourceDto[] | null;
  workCenters?:
    | DomainEntitiesProductsProductionProductionActivityStepWorkCenterDto[]
    | null;
  responsibleUsers?:
    DomainEntitiesProductsProductionProductionActivityStepUserDto[] | null;
  status?: DomainEntitiesBaseProductionStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  order?: number;
  isCritical?: boolean;
};
export type DomainEntitiesAnalyticalTestRequestsAnalyticalTestRequestDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  batchManufacturingRecord?: DomainEntitiesProductsProductionBatchManufacturingRecordDto;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProductDto;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStepDto;
  manufacturingDate?: string;
  expiryDate?: string;
  filled?: string | null;
  releasedAt?: string | null;
  sampledQuantity?: string | null;
  stage?: DomainEntitiesAnalyticalTestRequestsTestStage;
  state?: SharedCollectionItemDto;
  status?: DomainEntitiesAnalyticalTestRequestsAnalyticalTestStatus;
  numberOfContainers?: number;
  sampledBy?: DomainEntitiesUsersUserDto;
  releasedBy?: DomainEntitiesUsersUserDto;
  sampledAt?: string | null;
  acknowledgedBy?: DomainEntitiesUsersUserDto;
  acknowledgedAt?: string | null;
  assignedAt?: string | null;
  arNumber?: string | null;
  assignees?: DomainEntitiesUsersUserDto[] | null;
  issueNumber?: string | null;
  issuedAt?: string | null;
  issuedBy?: DomainEntitiesUsersUserDto;
  isRetest?: boolean;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesAnalyticalTestRequestsAnalyticalTestRequestDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?:
      DomainEntitiesAnalyticalTestRequestsAnalyticalTestRequestDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesAnalyticalTestRequestsUpdateAnalyticalTestRequest = {
  arNumber?: string | null;
  status?: DomainEntitiesAnalyticalTestRequestsAnalyticalTestStatus;
  numberOfContainers?: number;
  sampledQuantity?: string | null;
};
export type DomainEntitiesAnalyticalTestRequestsAssignAnalyticalTestRequest = {
  userIds?: string[] | null;
};
export type DomainEntitiesMaterialArdCreateMaterialAnalyticalRawDataRequest = {
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
  specNumber?: string | null;
  description?: string | null;
  stpId: string;
  formId: string;
  materialId: string;
  materialBatchId?: string | null;
  uniformityOfWeightId?: string | null;
  coaItems?: DomainEntitiesQualityRoutinesCommercialCoaItemRequest[] | null;
};
export type DomainEntitiesMaterialStandardTestProceduresMaterialStandardTestProcedureDto =
  {
    id?: string;
    createdBy?: DomainEntitiesUsersUserDto;
    createdAt?: string;
    attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
    stpNumber?: string | null;
    material?: SharedCollectionItemDto;
    description?: string | null;
  };
export type DomainEntitiesUniformityOfWeightsUniformityOfWeightDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  balanceNumber?: string | null;
  numberOfItems?: number;
  nominalWeight?: number;
  itemType?: string | null;
  disintegrationTest?: string | null;
  disintegrationInstrument?: SharedCollectionItemDto;
  disintegrationMean?: number;
  hardnessTest?: string | null;
  hardnessInstrument?: SharedCollectionItemDto;
  hardnessMean?: number;
};
export type DomainEntitiesMaterialArdMaterialAnalyticalRawDataDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
  specNumber?: string | null;
  description?: string | null;
  materialStandardTestProcedure?: DomainEntitiesMaterialStandardTestProceduresMaterialStandardTestProcedureDto;
  form?: SharedCollectionItemDto;
  uniformityOfWeight?: DomainEntitiesUniformityOfWeightsUniformityOfWeightDto;
  isVerified?: boolean;
  coaItems?: DomainEntitiesQualityRoutinesCommercialCoaItemRequest[] | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialArdMaterialAnalyticalRawDataDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesMaterialArdMaterialAnalyticalRawDataDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesMaterialsMaterialKind = 0 | 1;
export type DomainEntitiesMaterialsMaterialCategoryDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  description?: string | null;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
};
export type DomainEntitiesMaterialSpecificationsMaterialSpecificationReducedDto =
  {
    id?: string;
    specificationNumber?: string | null;
  };
export type DomainEntitiesCountriesCountryDto = {
  id?: string;
  name?: string | null;
  nationality?: string | null;
  code?: string | null;
};
export type DomainEntitiesProcurementSuppliersSupplierType = 0 | 1;
export type DomainEntitiesProcurementSuppliersSupplierStatus = 0 | 1 | 2;
export type DomainEntitiesProcurementSuppliersSupplierListDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  email?: string | null;
  address?: string | null;
  contactPerson?: string | null;
  contactNumber?: string | null;
  country?: DomainEntitiesCountriesCountryDto;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  type?: DomainEntitiesProcurementSuppliersSupplierType;
  status?: DomainEntitiesProcurementSuppliersSupplierStatus;
  approvedAt?: string | null;
  requalificationDueDate?: string | null;
};
export type DomainEntitiesProcurementManufacturersManufacturerListDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  address?: string | null;
  email?: string | null;
  approvedAt?: string | null;
  validityDate?: string | null;
  country?: DomainEntitiesCountriesCountryDto;
};
export type DomainEntitiesMaterialsMaterialDto = {
  id?: string;
  code?: string | null;
  pharmacopoeia?: string | null;
  name?: string | null;
  description?: string | null;
  alphabet?: string | null;
  kind?: DomainEntitiesMaterialsMaterialKind;
  isUnlimited?: boolean;
  materialCategory?: DomainEntitiesMaterialsMaterialCategoryDto;
  specification?: DomainEntitiesMaterialSpecificationsMaterialSpecificationReducedDto;
  totalStock?: number;
  reservedStock?: number;
  suppliers?: DomainEntitiesProcurementSuppliersSupplierListDto[] | null;
  manufacturers?:
    DomainEntitiesProcurementManufacturersManufacturerListDto[] | null;
};
export type DomainEntitiesBasePackageStyleDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesMaterialsBatchBatchStatus =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type DomainEntitiesMaterialsBatchMaterialBatchReducedDto = {
  id?: string;
  material?: DomainEntitiesMaterialsMaterialDto;
  batchNumber?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  numberOfContainers?: number;
  containerPackageStyle?: DomainEntitiesBasePackageStyleDto;
  quantityPerContainer?: number;
  status?: DomainEntitiesMaterialsBatchBatchStatus;
  dateReceived?: string;
  dateApproved?: string | null;
  quantityAssigned?: number;
  quantityUnassigned?: number;
  totalQuantity?: number;
  consumedQuantity?: number;
  remainingQuantity?: number;
  sampledQuantity?: number;
  quantityDistributed?: number;
  expiryDate?: string | null;
  manufacturingDate?: string | null;
  retestDate?: string | null;
  issueNumber?: string | null;
  issuedBy?: SharedCollectionItemDto;
  issuedAt?: string | null;
  supplierName?: string | null;
  manufacturerName?: string | null;
  arNumber?: string | null;
  sampledBy?: string | null;
  sampledOn?: string | null;
  sampleQuantity?: number;
  analysedBy?: string | null;
  analysedDate?: string | null;
};
export type DomainEntitiesMaterialsBatchMaterialBatchReducedDtoRead = {
  id?: string;
  material?: DomainEntitiesMaterialsMaterialDto;
  batchNumber?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  numberOfContainers?: number;
  containerPackageStyle?: DomainEntitiesBasePackageStyleDto;
  quantityPerContainer?: number;
  status?: DomainEntitiesMaterialsBatchBatchStatus;
  dateReceived?: string;
  dateApproved?: string | null;
  quantityAssigned?: number;
  quantityUnassigned?: number;
  totalQuantity?: number;
  consumedQuantity?: number;
  remainingQuantity?: number;
  sampledQuantity?: number;
  quantityDistributed?: number;
  expiryDate?: string | null;
  manufacturingDate?: string | null;
  retestDate?: string | null;
  aboutToExpire?: boolean;
  expired?: boolean;
  issueNumber?: string | null;
  issuedBy?: SharedCollectionItemDto;
  issuedAt?: string | null;
  supplierName?: string | null;
  manufacturerName?: string | null;
  arNumber?: string | null;
  sampledBy?: string | null;
  sampledOn?: string | null;
  sampleQuantity?: number;
  analysedBy?: string | null;
  analysedDate?: string | null;
};
export type DomainEntitiesMaterialArdMaterialBatchArd = {
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatchReducedDto;
  arNumber?: string | null;
  grnNumber?: string | null;
  specNumber?: string | null;
  stpNumber?: string | null;
  supplier?: SharedCollectionItemDto;
  manufacturer?: SharedCollectionItemDto;
  sampledDate?: string | null;
  sampledBy?: DomainEntitiesUsersUserDto;
  quantityReceived?: number;
  quantitySampled?: number;
};
export type DomainEntitiesMaterialArdMaterialBatchArdRead = {
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatchReducedDtoRead;
  arNumber?: string | null;
  grnNumber?: string | null;
  specNumber?: string | null;
  stpNumber?: string | null;
  supplier?: SharedCollectionItemDto;
  manufacturer?: SharedCollectionItemDto;
  sampledDate?: string | null;
  sampledBy?: DomainEntitiesUsersUserDto;
  quantityReceived?: number;
  quantitySampled?: number;
};
export type DomainEntitiesUniformityOfWeightsCreateUniformityOfWeight = {
  name?: string | null;
  balanceNumber?: string | null;
  numberOfItems?: number;
  nominalWeight?: number;
  itemType?: string | null;
  disintegrationTest?: string | null;
  disintegrationInstrumentId?: string | null;
  disintegrationMean?: number;
  hardnessTest?: string | null;
  hardnessInstrumentId?: string | null;
  hardnessMean?: number;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesUniformityOfWeightsUniformityOfWeightDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesUniformityOfWeightsUniformityOfWeightDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesUniformityOfWeightsCreateUniformityOfWeightResponse =
  {
    uniformityOfWeightId?: string;
    batchManufacturingRecordId?: string | null;
    materialBatchId?: string | null;
    weights?: number[] | null;
    mean?: number;
    standardDeviation?: number;
    minimumStandardDeviation?: number;
    maximumStandardDeviation?: number;
    maximumWeight?: number;
    minimumWeight?: number;
  };
export type DomainEntitiesUniformityOfWeightsUniformityOfWeightResponseDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  uniformityOfWeight?: SharedCollectionItemDto;
  batchManufacturingRecord?: SharedCollectionItemDto;
  materialBatch?: SharedCollectionItemDto;
  weights?: number[] | null;
  mean?: number;
  standardDeviation?: number;
  minimumStandardDeviation?: number;
  maximumStandardDeviation?: number;
  maximumWeight?: number;
  minimumWeight?: number;
};
export type DomainEntitiesMaterialSamplingCreateMaterialSamplingRequest = {
  grnId: string;
  arNumber: string;
  materialBatchId?: string;
  sampleQuantity: number;
};
export type DomainEntitiesGrnsStatus = 0 | 1 | 2;
export type DomainEntitiesGrnsGrnListDto = {
  id?: string;
  createdAt?: string;
  carrierName?: string | null;
  vehicleNumber?: string | null;
  remarks?: string | null;
  grnNumber?: string | null;
  materialBatches?:
    DomainEntitiesMaterialsBatchMaterialBatchReducedDto[] | null;
  status?: DomainEntitiesGrnsStatus;
  declarationNumber?: string | null;
};
export type DomainEntitiesGrnsGrnListDtoRead = {
  id?: string;
  createdAt?: string;
  carrierName?: string | null;
  vehicleNumber?: string | null;
  remarks?: string | null;
  grnNumber?: string | null;
  materialBatches?:
    DomainEntitiesMaterialsBatchMaterialBatchReducedDtoRead[] | null;
  status?: DomainEntitiesGrnsStatus;
  declarationNumber?: string | null;
};
export type DomainEntitiesMaterialSamplingMaterialSamplingDto = {
  grnDto?: DomainEntitiesGrnsGrnListDto;
  materialBatch?: SharedCollectionItemDto;
  arNumber?: string | null;
  grnId?: string;
  sampleQuantity?: number;
  sampleDate?: string;
  issueNumber?: string | null;
  issuedBy?: DomainEntitiesUsersUserDto;
  issuedAt?: string | null;
};
export type DomainEntitiesMaterialSamplingMaterialSamplingDtoRead = {
  grnDto?: DomainEntitiesGrnsGrnListDtoRead;
  materialBatch?: SharedCollectionItemDto;
  arNumber?: string | null;
  grnId?: string;
  sampleQuantity?: number;
  sampleDate?: string;
  issueNumber?: string | null;
  issuedBy?: DomainEntitiesUsersUserDto;
  issuedAt?: string | null;
};
export type DomainEntitiesChecklistsPackingCleanliness = 0 | 1;
export type DomainEntitiesChecklistsQuarantinedLabel = 0 | 1;
export type DomainEntitiesChecklistsMentionedStatus = 0 | 1;
export type DomainEntitiesChecklistsConformityStatus = 0 | 1;
export type DomainEntitiesChecklistsPresenceStatus = 0 | 1;
export type DomainEntitiesChecklistsCreatePreSampleChecklistRequest = {
  date?: string;
  materialBatchId?: string;
  grnId?: string;
  temperatureCondition?: number;
  environmentalConditionRh?: number;
  packingCleanliness?: DomainEntitiesChecklistsPackingCleanliness;
  packingStyles?: string[] | null;
  quarantinedLabel?: DomainEntitiesChecklistsQuarantinedLabel;
  pharmacopoeiaStatus?: string[] | null;
  manufacturersName?: DomainEntitiesChecklistsMentionedStatus;
  batchNumber?: DomainEntitiesChecklistsMentionedStatus;
  quantity?: DomainEntitiesChecklistsMentionedStatus;
  storageCondition?: DomainEntitiesChecklistsMentionedStatus;
  noOfContainer?: DomainEntitiesChecklistsMentionedStatus;
  anyContainerDamaged?: boolean;
  anyOtherRemarks?: string | null;
  physicalAppearance?: DomainEntitiesChecklistsConformityStatus;
  manufacturerSeal?: DomainEntitiesChecklistsPresenceStatus;
  presenceOfLumps?: DomainEntitiesChecklistsPresenceStatus;
  anyNonCharacteristicOdour?: DomainEntitiesChecklistsPresenceStatus;
  heterogeneityWithinSameContainer?: DomainEntitiesChecklistsPresenceStatus;
  heterogeneityBetweenDifferentContainers?: DomainEntitiesChecklistsPresenceStatus;
};
export type DomainEntitiesChecklistsFormStatus = 0 | 1;
export type DomainEntitiesChecklistsPreSampleChecklistDto = {
  id?: string;
  date?: string;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatchReducedDto;
  grnGraNumber?: string | null;
  anyContainerDamaged?: boolean;
  temperatureCondition?: number;
  environmentalConditionRh?: number;
  packingCleanliness?: string | null;
  packingStyles?: string[] | null;
  quarantinedLabel?: string | null;
  pharmacopoeiaStatus?: string[] | null;
  manufacturersNameMentioned?: boolean;
  quantity?: string | null;
  storageCondition?: string | null;
  anyOtherRemarks?: string | null;
  doneBy?: DomainEntitiesUsersUserDto;
  checkedBy?: DomainEntitiesUsersUserDto;
  formStatus?: DomainEntitiesChecklistsFormStatus;
};
export type DomainEntitiesChecklistsPreSampleChecklistDtoRead = {
  id?: string;
  date?: string;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatchReducedDtoRead;
  grnGraNumber?: string | null;
  anyContainerDamaged?: boolean;
  temperatureCondition?: number;
  environmentalConditionRh?: number;
  packingCleanliness?: string | null;
  packingStyles?: string[] | null;
  quarantinedLabel?: string | null;
  pharmacopoeiaStatus?: string[] | null;
  manufacturersNameMentioned?: boolean;
  quantity?: string | null;
  storageCondition?: string | null;
  anyOtherRemarks?: string | null;
  doneBy?: DomainEntitiesUsersUserDto;
  checkedBy?: DomainEntitiesUsersUserDto;
  formStatus?: DomainEntitiesChecklistsFormStatus;
};
export type DomainEntitiesMaterialSpecificationsCreateMaterialSpecificationRequest =
  {
    specificationNumber: string;
    revisionNumber: string;
    supersedesNumber: string;
    effectiveDate: string;
    reviewDate: string;
    formId: string;
    dueDate?: string;
    description?: string | null;
    reference?: string | null;
    userId: string;
    materialIds: string[];
  };
export type DomainEntitiesMaterialSpecificationsMaterialSpecificationDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  specificationNumber?: string | null;
  revisionNumber?: string | null;
  supersedesNumber?: string | null;
  effectiveDate?: string;
  reviewDate?: string;
  form?: DomainEntitiesFormsFormDto;
  dueDate?: string;
  description?: string | null;
  reference?: string | null;
  userId?: string;
  user?: DomainEntitiesUsersUserDto;
  materialAnalyticalRawData?: DomainEntitiesMaterialArdMaterialAnalyticalRawDataDto;
  material?: DomainEntitiesMaterialsMaterialDto;
  formSections?: DomainEntitiesFormsFormSectionDto[] | null;
  isVerified?: boolean;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialSpecificationsMaterialSpecificationDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?:
      DomainEntitiesMaterialSpecificationsMaterialSpecificationDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesMaterialSpecificationsMaterialSpecificationMappingDto =
  {
    materialId?: string;
    specificationId?: string;
  };
export type DomainEntitiesMaterialSpecificationsUpdateMaterialSpecificationRequest =
  {
    specificationNumber: string;
    revisionNumber: string;
    supersedesNumber: string;
    effectiveDate: string;
    reviewDate: string;
    formId: string;
    dueDate?: string;
    description?: string | null;
    reference?: string | null;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericList601DomainEntitiesMaterialsMaterialDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesMaterialsMaterialDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesMaterialSpecificationsAddRemoveMaterialToSpecificationRequest =
  {
    specificationNumber: string;
    materialIdsToAdd?: string[] | null;
    materialIdsToRemove?: string[] | null;
  };
export type DomainEntitiesMaterialStandardTestProceduresMaterialStpMappingDto =
  {
    materialId?: string;
    stpId?: string;
  };
export type DomainEntitiesMaterialStandardTestProceduresCreateMaterialStandardTestProcedureRequest =
  {
    stpNumber: string;
    materialIds: string[];
    description?: string | null;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialStandardTestProceduresMaterialStandardTestProcedureDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?:
      | DomainEntitiesMaterialStandardTestProceduresMaterialStandardTestProcedureDto[]
      | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesMaterialStandardTestProceduresAddRemoveMaterialToStpRequest =
  {
    stpNumber: string;
    materialIdsToAdd?: string[] | null;
    materialIdsToRemove?: string[] | null;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsMaterialDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesMaterialsMaterialDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesOosInvestigationsInitiateOosInvestigationRequest = {
  analyticalTestRequestId?: string | null;
  materialBatchId?: string | null;
  coaNumber: string;
  productOrMaterialName?: string | null;
  batchNumber?: string | null;
  rejectionReason: string;
  rootCauseAnalysis?: string | null;
  correctiveActions?: string | null;
  preventiveActions?: string | null;
  investigationDetails?: string | null;
};
export type DomainEntitiesOosInvestigationsUpdateOosInvestigationRequest = {
  productOrMaterialName?: string | null;
  batchNumber?: string | null;
  rootCauseAnalysis?: string | null;
  correctiveActions?: string | null;
  preventiveActions?: string | null;
  investigationDetails?: string | null;
};
export type DomainEntitiesOosInvestigationsOosInvestigationStatus =
  0 | 1 | 2 | 3;
export type DomainEntitiesOosInvestigationsOosInvestigationDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  analyticalTestRequestId?: string | null;
  materialBatchId?: string | null;
  coaNumber?: string | null;
  productOrMaterialName?: string | null;
  batchNumber?: string | null;
  rejectionReason?: string | null;
  rootCauseAnalysis?: string | null;
  correctiveActions?: string | null;
  preventiveActions?: string | null;
  investigationDetails?: string | null;
  status?: DomainEntitiesOosInvestigationsOosInvestigationStatus;
  submittedToQaAt?: string | null;
  submittedBy?: DomainEntitiesUsersUserDto;
  qaReviewedAt?: string | null;
  qaReviewer?: DomainEntitiesUsersUserDto;
  qaReviewComments?: string | null;
};
export type DomainEntitiesOosInvestigationsReviewOosInvestigationRequest = {
  approve: boolean;
  comments?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesOosInvestigationsOosInvestigationDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesOosInvestigationsOosInvestigationDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesProductAnalyticalRawDataCreateProductAnalyticalRawDataRequest =
  {
    analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
    specNumber?: string | null;
    stage: DomainEntitiesAnalyticalTestRequestsTestStage;
    description?: string | null;
    stpId: string;
    formId: string;
    coaItems?: DomainEntitiesQualityRoutinesCommercialCoaItemRequest[] | null;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawDataDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?:
      | DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawDataDto[]
      | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesProductAnalyticalRawDataProductBatchArd = {
  batchManufacturingRecord?: DomainEntitiesProductsProductionBatchManufacturingRecordDto;
  arNumber?: string | null;
  specNumber?: string | null;
  productStandardTestProcedures?:
    | DomainEntitiesProductStandardTestProceduresProductStandardTestProcedureDto[]
    | null;
  sampledDate?: string | null;
  sampledBy?: DomainEntitiesUsersUserDto;
  sampledQuantity?: number | null;
  issueDate?: string | null;
  issueNumber?: string | null;
  issuedBy?: DomainEntitiesUsersUserDto;
  analysedDate?: string | null;
  analysedBy?: DomainEntitiesUsersUserDto;
};
export type DomainEntitiesProductsSamplingCreateProductSamplingRequest = {
  analyticalTestRequestId: string;
  arNumber: string;
  sampleQuantity: number;
  containersSampled: number;
};
export type DomainEntitiesProductsSamplingProductSamplingDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  arNumber?: string | null;
  sampleQuantity?: number;
  containersSampled?: number;
  sampleDate?: string;
  analyticalTestRequest?: DomainEntitiesAnalyticalTestRequestsAnalyticalTestRequestDto;
  issueNumber?: string | null;
  issuedBy?: DomainEntitiesUsersUserDto;
  issuedAt?: string | null;
};
export type DomainEntitiesProductSpecificationsCreateProductSpecificationRequest =
  {
    specificationNumber: string;
    revisionNumber: string;
    supersedesNumber: string;
    effectiveDate: string;
    reviewDate: string;
    formId: string;
    userId: string;
    testStage: DomainEntitiesAnalyticalTestRequestsTestStage;
    productIds: string[];
    dueDate?: string;
    description?: string | null;
    reference?: string | null;
  };
export type DomainEntitiesBillOfMaterialsBillOfMaterialItemSubstituteDto = {
  id?: string;
  substituteMaterial?: DomainEntitiesMaterialsMaterialDto;
};
export type DomainEntitiesBillOfMaterialsBillOfMaterialItemDto = {
  id?: string;
  material?: DomainEntitiesMaterialsMaterialDto;
  materialType?: SharedCollectionItemDto;
  isSubstitutable?: boolean;
  grade?: string | null;
  casNumber?: string | null;
  baseQuantity?: number;
  baseUoM?: DomainEntitiesBaseUnitOfMeasureDto;
  order?: number;
  prescribedQuantity?: number;
  substitutes?:
    DomainEntitiesBillOfMaterialsBillOfMaterialItemSubstituteDto[] | null;
};
export type DomainEntitiesBillOfMaterialsBillOfMaterialDto = {
  product?: SharedCollectionItemDto;
  version?: number;
  isActive?: boolean;
  items?: DomainEntitiesBillOfMaterialsBillOfMaterialItemDto[] | null;
};
export type DomainEntitiesProductsProductBillOfMaterialDto = {
  productId?: string;
  billOfMaterial?: DomainEntitiesBillOfMaterialsBillOfMaterialDto;
  version?: number;
  effectiveDate?: string;
  isActive?: boolean;
};
export type DomainEntitiesProductsProductPackageSubstituteDto = {
  id?: string;
  substituteMaterial?: DomainEntitiesMaterialsMaterialDto;
};
export type DomainEntitiesProductsProductPackageDto = {
  id?: string;
  material?: SharedCollectionItemDto;
  materialThickness?: string | null;
  otherStandards?: string | null;
  baseQuantity?: number;
  unitCapacity?: number;
  directLinkMaterial?: SharedCollectionItemDto;
  packingExcessMargin?: number;
  prescribedQuantity?: number;
  loose?: number;
  productPacking?: DomainEntitiesProductsProductPackingDto;
  substitutes?: DomainEntitiesProductsProductPackageSubstituteDto[] | null;
};
export type DomainEntitiesRoutesRouteResponsibleUserDto = {
  user?: SharedCollectionItemDto;
  productAnalyticalRawData?: DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawDataDto;
  action?: DomainEntitiesRoutesOperationAction;
};
export type DomainEntitiesRoutesRouteResponsibleRoleDto = {
  role?: SharedCollectionItemDto;
  productAnalyticalRawData?: DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawDataDto;
  action?: DomainEntitiesRoutesOperationAction;
};
export type DomainEntitiesRoutesRouteWorkCenterDto = {
  workCenter?: SharedCollectionItemDto;
};
export type DomainEntitiesRoutesRouteDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  operation?: SharedCollectionItemDto;
  estimatedTime?: string | null;
  order?: number;
  responsibleUsers?: DomainEntitiesRoutesRouteResponsibleUserDto[] | null;
  responsibleRoles?: DomainEntitiesRoutesRouteResponsibleRoleDto[] | null;
  workCenters?: DomainEntitiesRoutesRouteWorkCenterDto[] | null;
  isCritical?: boolean;
};
export type DomainEntitiesRoutesRouteResourceDto = {
  resource?: SharedCollectionItemDto;
};
export type DomainEntitiesRoutesRouteDtoRead = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  operation?: SharedCollectionItemDto;
  estimatedTime?: string | null;
  resources?: DomainEntitiesRoutesRouteResourceDto[] | null;
  order?: number;
  responsibleUsers?: DomainEntitiesRoutesRouteResponsibleUserDto[] | null;
  responsibleRoles?: DomainEntitiesRoutesRouteResponsibleRoleDto[] | null;
  workCenters?: DomainEntitiesRoutesRouteWorkCenterDto[] | null;
  isCritical?: boolean;
};
export type DomainEntitiesProductsProductDto = {
  id?: string;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  genericName?: string | null;
  storageCondition?: string | null;
  packageStyle?: string | null;
  filledWeight?: string | null;
  shelfLife?: string | null;
  actionUse?: string | null;
  fdaRegistrationNumber?: string | null;
  masterFormulaNumber?: string | null;
  primaryPackDescription?: string | null;
  secondaryPackDescription?: string | null;
  tertiaryPackDescription?: string | null;
  category?: SharedCollectionItemDto;
  baseQuantity?: number;
  fullBatchSize?: number;
  baseUoM?: DomainEntitiesBaseUnitOfMeasureDto;
  equipment?: DomainEntitiesProductsEquipmentsEquipmentDto;
  department?: SharedCollectionItemDto;
  createdAt?: string;
  price?: number;
  priceUoM?: string | null;
  division?: DomainEntitiesProductsDivision;
  labelClaim?: string | null;
  isVerified?: boolean;
  documentNumber?: string | null;
  revisionNumber?: number;
  billOfMaterials?: DomainEntitiesProductsProductBillOfMaterialDto[] | null;
  currentBillOfMaterial?: DomainEntitiesProductsProductBillOfMaterialDto;
  outdatedBillOfMaterials?:
    DomainEntitiesProductsProductBillOfMaterialDto[] | null;
  packages?: DomainEntitiesProductsProductPackageDto[] | null;
  routes?: DomainEntitiesRoutesRouteDto[] | null;
  packings?: DomainEntitiesProductsProductPackingDto[] | null;
  createdBy?: SharedCollectionItemDto;
};
export type DomainEntitiesProductsProductDtoRead = {
  id?: string;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  genericName?: string | null;
  storageCondition?: string | null;
  packageStyle?: string | null;
  filledWeight?: string | null;
  shelfLife?: string | null;
  actionUse?: string | null;
  fdaRegistrationNumber?: string | null;
  masterFormulaNumber?: string | null;
  primaryPackDescription?: string | null;
  secondaryPackDescription?: string | null;
  tertiaryPackDescription?: string | null;
  category?: SharedCollectionItemDto;
  baseQuantity?: number;
  fullBatchSize?: number;
  baseUoM?: DomainEntitiesBaseUnitOfMeasureDto;
  equipment?: DomainEntitiesProductsEquipmentsEquipmentDto;
  department?: SharedCollectionItemDto;
  createdAt?: string;
  price?: number;
  priceUoM?: string | null;
  division?: DomainEntitiesProductsDivision;
  labelClaim?: string | null;
  isVerified?: boolean;
  documentNumber?: string | null;
  revisionNumber?: number;
  billOfMaterials?: DomainEntitiesProductsProductBillOfMaterialDto[] | null;
  currentBillOfMaterial?: DomainEntitiesProductsProductBillOfMaterialDto;
  outdatedBillOfMaterials?:
    DomainEntitiesProductsProductBillOfMaterialDto[] | null;
  packages?: DomainEntitiesProductsProductPackageDto[] | null;
  routes?: DomainEntitiesRoutesRouteDtoRead[] | null;
  packings?: DomainEntitiesProductsProductPackingDto[] | null;
  createdBy?: SharedCollectionItemDto;
};
export type DomainEntitiesFormsResponseDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  form?: SharedCollectionItemDto;
  formResponses?: DomainEntitiesFormsFormResponseDto[] | null;
};
export type DomainEntitiesProductSpecificationsProductSpecificationDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  specificationNumber?: string | null;
  revisionNumber?: string | null;
  supersedesNumber?: string | null;
  labelClaim?: string | null;
  packingStyle?: string | null;
  form?: DomainEntitiesFormsFormDto;
  dueDate?: string;
  description?: string | null;
  reference?: string | null;
  userId?: string;
  user?: DomainEntitiesUsersUserDto;
  shelfLife?: string | null;
  effectiveDate?: string;
  reviewDate?: string;
  testStage?: DomainEntitiesAnalyticalTestRequestsTestStage;
  productId?: string;
  product?: DomainEntitiesProductsProductDto;
  response?: DomainEntitiesFormsResponseDto;
  formSections?: DomainEntitiesFormsFormSectionDto[] | null;
  isVerified?: boolean;
};
export type DomainEntitiesProductSpecificationsProductSpecificationDtoRead = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  specificationNumber?: string | null;
  revisionNumber?: string | null;
  supersedesNumber?: string | null;
  labelClaim?: string | null;
  packingStyle?: string | null;
  form?: DomainEntitiesFormsFormDto;
  dueDate?: string;
  description?: string | null;
  reference?: string | null;
  userId?: string;
  user?: DomainEntitiesUsersUserDto;
  shelfLife?: string | null;
  effectiveDate?: string;
  reviewDate?: string;
  testStage?: DomainEntitiesAnalyticalTestRequestsTestStage;
  productId?: string;
  product?: DomainEntitiesProductsProductDtoRead;
  response?: DomainEntitiesFormsResponseDto;
  formSections?: DomainEntitiesFormsFormSectionDto[] | null;
  isVerified?: boolean;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductSpecificationsProductSpecificationDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesProductSpecificationsProductSpecificationDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductSpecificationsProductSpecificationDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead =
  {
    data?:
      DomainEntitiesProductSpecificationsProductSpecificationDtoRead[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesProductSpecificationsProductSpecificationMappingDto =
  {
    productId?: string;
    specificationId?: string;
  };
export type DomainEntitiesProductSpecificationsUpdateProductSpecificationRequest =
  {
    specificationNumber: string;
    revisionNumber: string;
    supersedesNumber: string;
    effectiveDate: string;
    reviewDate: string;
    formId: string;
    testStage: DomainEntitiesAnalyticalTestRequestsTestStage;
    dueDate?: string;
    description?: string | null;
    reference?: string | null;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericList601DomainEntitiesProductsProductListDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesProductsProductListDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesProductSpecificationsAddRemoveProductToSpecificationRequest =
  {
    specificationNumber: string;
    productIdsToAdd?: string[] | null;
    productIdsToRemove?: string[] | null;
  };
export type DomainEntitiesProductStandardTestProceduresCreateProductStandardTestProcedureRequest =
  {
    stpNumber: string;
    productIds: string[];
    description?: string | null;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductStandardTestProceduresProductStandardTestProcedureDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?:
      | DomainEntitiesProductStandardTestProceduresProductStandardTestProcedureDto[]
      | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesProductStandardTestProceduresProductStpMappingDto = {
  productId?: string;
  stpId?: string;
};
export type DomainEntitiesProductStandardTestProceduresUpdateProductStandardTestProcedureRequest =
  {
    stpNumber: string;
    description?: string | null;
  };
export type DomainEntitiesProductStandardTestProceduresAddRemoveProductToStpRequest =
  {
    stpNumber: string;
    productIdsToAdd?: string[] | null;
    productIdsToRemove?: string[] | null;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductsProductListDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesProductsProductListDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesStpDocumentsStpDocumentStatus = 0 | 1 | 2 | 3;
export type DomainEntitiesStpDocumentsStpDocumentVersionSource = 0 | 1 | 2 | 3;
export type DomainEntitiesStpDocumentsStpDocumentSignatureAction = 0 | 1 | 2;
export type DomainEntitiesStpDocumentsStpDocumentSignatureDto = {
  id?: string;
  stpDocumentVersionId?: string;
  action?: DomainEntitiesStpDocumentsStpDocumentSignatureAction;
  meaning?: string | null;
  createdById?: string | null;
  createdByName?: string | null;
  createdAt?: string;
};
export type DomainEntitiesStpDocumentsStpDocumentVersionDto = {
  id?: string;
  stpDocumentId?: string;
  versionNumber?: number;
  fileName?: string | null;
  sha256?: string | null;
  size?: number;
  source?: DomainEntitiesStpDocumentsStpDocumentVersionSource;
  reasonForChange?: string | null;
  isSuperseded?: boolean;
  isEffective?: boolean;
  createdById?: string | null;
  createdByName?: string | null;
  createdAt?: string;
  signatures?: DomainEntitiesStpDocumentsStpDocumentSignatureDto[] | null;
};
export type DomainEntitiesStpDocumentsStpDocumentDto = {
  id?: string;
  ownerType?: string | null;
  ownerId?: string;
  status?: DomainEntitiesStpDocumentsStpDocumentStatus;
  currentDraftVersionId?: string | null;
  effectiveVersionId?: string | null;
  lockedById?: string | null;
  lockedByName?: string | null;
  lockedAt?: string | null;
  versions?: DomainEntitiesStpDocumentsStpDocumentVersionDto[] | null;
};
export type DomainEntitiesStpDocumentsSubmitStpDocumentVersionRequest = {
  password?: string | null;
  meaning?: string | null;
};
export const {
  usePostApiV1QaAnalyticalTestsMutation,
  useGetApiV1QaAnalyticalTestsQuery,
  useLazyGetApiV1QaAnalyticalTestsQuery,
  useGetApiV1QaAnalyticalTestsByIdQuery,
  useLazyGetApiV1QaAnalyticalTestsByIdQuery,
  usePutApiV1QaAnalyticalTestsByIdMutation,
  useDeleteApiV1QaAnalyticalTestsByIdMutation,
  usePutApiV1QaAnalyticalTestsStatusByIdMutation,
  usePutApiV1QaAnalyticalTestsAssignByIdMutation,
  usePutApiV1QaAnalyticalTestsReassignByIdMutation,
  usePostApiV1QaAnalyticalTestsRequestRetestByIdMutation,
  usePostApiV1QaAnalyticalTestsCompleteRetestByIdMutation,
  useGetApiV1QaAnalyticalTestsActivityStepByActivityStepIdQuery,
  useLazyGetApiV1QaAnalyticalTestsActivityStepByActivityStepIdQuery,
  usePostApiV1MaterialArdMutation,
  useGetApiV1MaterialArdQuery,
  useLazyGetApiV1MaterialArdQuery,
  useGetApiV1MaterialArdByIdQuery,
  useLazyGetApiV1MaterialArdByIdQuery,
  usePutApiV1MaterialArdByIdMutation,
  useDeleteApiV1MaterialArdByIdMutation,
  useGetApiV1MaterialArdMaterialByMaterialIdQuery,
  useLazyGetApiV1MaterialArdMaterialByMaterialIdQuery,
  useGetApiV1MaterialArdMaterialBatchByMaterialBatchIdQuery,
  useLazyGetApiV1MaterialArdMaterialBatchByMaterialBatchIdQuery,
  useGetApiV1MaterialArdMaterialBatchDetailsByMaterialBatchIdQuery,
  useLazyGetApiV1MaterialArdMaterialBatchDetailsByMaterialBatchIdQuery,
  usePutApiV1MaterialArdStartTestByMaterialBatchIdMutation,
  usePostApiV1MaterialArdUniformityOfWeightMutation,
  useGetApiV1MaterialArdUniformityOfWeightQuery,
  useLazyGetApiV1MaterialArdUniformityOfWeightQuery,
  useGetApiV1MaterialArdUniformityOfWeightByIdQuery,
  useLazyGetApiV1MaterialArdUniformityOfWeightByIdQuery,
  usePutApiV1MaterialArdUniformityOfWeightByIdMutation,
  useDeleteApiV1MaterialArdUniformityOfWeightByIdMutation,
  usePostApiV1MaterialArdUniformityOfWeightResponseMutation,
  useGetApiV1MaterialArdUniformityOfWeightByUniformityOfWeightIdAndMaterialBatchIdResponseQuery,
  useLazyGetApiV1MaterialArdUniformityOfWeightByUniformityOfWeightIdAndMaterialBatchIdResponseQuery,
  usePostApiV1MaterialSamplingsMutation,
  usePutApiV1MaterialSamplingsByMaterialSamplingIdMutation,
  useGetApiV1MaterialSamplingsByGrnIdAndBatchIdQuery,
  useLazyGetApiV1MaterialSamplingsByGrnIdAndBatchIdQuery,
  usePostApiV1MaterialSamplingsPreSampleMutation,
  useGetApiV1MaterialSamplingsPreSampleByGrnIdAndBatchIdQuery,
  useLazyGetApiV1MaterialSamplingsPreSampleByGrnIdAndBatchIdQuery,
  usePostApiV1MaterialSpecificationsMutation,
  useGetApiV1MaterialSpecificationsQuery,
  useLazyGetApiV1MaterialSpecificationsQuery,
  useGetApiV1MaterialSpecificationsByIdQuery,
  useLazyGetApiV1MaterialSpecificationsByIdQuery,
  usePutApiV1MaterialSpecificationsByIdMutation,
  useDeleteApiV1MaterialSpecificationsByIdMutation,
  useGetApiV1MaterialSpecificationsMaterialsNotLinkedQuery,
  useLazyGetApiV1MaterialSpecificationsMaterialsNotLinkedQuery,
  useGetApiV1MaterialSpecificationsMaterialByMaterialIdQuery,
  useLazyGetApiV1MaterialSpecificationsMaterialByMaterialIdQuery,
  useGetApiV1MaterialSpecificationsMaterialsQuery,
  useLazyGetApiV1MaterialSpecificationsMaterialsQuery,
  usePostApiV1MaterialSpecificationsAddRemoveMaterialsMutation,
  usePostApiV1MaterialSpecificationsImportMutation,
  usePostApiV1MaterialStpsMutation,
  useGetApiV1MaterialStpsQuery,
  useLazyGetApiV1MaterialStpsQuery,
  useGetApiV1MaterialStpsByIdQuery,
  useLazyGetApiV1MaterialStpsByIdQuery,
  usePutApiV1MaterialStpsByIdMutation,
  useDeleteApiV1MaterialStpsByIdMutation,
  useGetApiV1MaterialStpsByMaterialIdMaterialQuery,
  useLazyGetApiV1MaterialStpsByMaterialIdMaterialQuery,
  useGetApiV1MaterialStpsByStpNumberMaterialsQuery,
  useLazyGetApiV1MaterialStpsByStpNumberMaterialsQuery,
  usePostApiV1MaterialStpsAddRemoveMaterialsMutation,
  useGetApiV1MaterialStpsUnusedMaterialsQuery,
  useLazyGetApiV1MaterialStpsUnusedMaterialsQuery,
  usePostApiV1QaOosInvestigationsInitiateMutation,
  usePutApiV1QaOosInvestigationsByIdMutation,
  useGetApiV1QaOosInvestigationsByIdQuery,
  useLazyGetApiV1QaOosInvestigationsByIdQuery,
  usePutApiV1QaOosInvestigationsByIdSubmitMutation,
  usePutApiV1QaOosInvestigationsByIdQaReviewMutation,
  useGetApiV1QaOosInvestigationsQuery,
  useLazyGetApiV1QaOosInvestigationsQuery,
  usePostApiV1ProductArdMutation,
  useGetApiV1ProductArdQuery,
  useLazyGetApiV1ProductArdQuery,
  useGetApiV1ProductArdByIdQuery,
  useLazyGetApiV1ProductArdByIdQuery,
  usePutApiV1ProductArdByIdMutation,
  useDeleteApiV1ProductArdByIdMutation,
  useGetApiV1ProductArdProductByProductIdQuery,
  useLazyGetApiV1ProductArdProductByProductIdQuery,
  useGetApiV1ProductArdProductBatchDetailsByBatchManufacturingRecordIdQuery,
  useLazyGetApiV1ProductArdProductBatchDetailsByBatchManufacturingRecordIdQuery,
  usePutApiV1ProductArdStartTestByBatchManufacturingRecordIdMutation,
  usePostApiV1ProductSamplingsMutation,
  useGetApiV1ProductSamplingsByBmrIdQuery,
  useLazyGetApiV1ProductSamplingsByBmrIdQuery,
  usePutApiV1ProductSamplingsByProductSamplingIdMutation,
  usePostApiV1ProductSpecificationsMutation,
  useGetApiV1ProductSpecificationsQuery,
  useLazyGetApiV1ProductSpecificationsQuery,
  useGetApiV1ProductSpecificationsByIdQuery,
  useLazyGetApiV1ProductSpecificationsByIdQuery,
  usePutApiV1ProductSpecificationsByIdMutation,
  useDeleteApiV1ProductSpecificationsByIdMutation,
  useGetApiV1ProductSpecificationsProductsNotLinkedQuery,
  useLazyGetApiV1ProductSpecificationsProductsNotLinkedQuery,
  useGetApiV1ProductSpecificationsProductByIdQuery,
  useLazyGetApiV1ProductSpecificationsProductByIdQuery,
  useGetApiV1ProductSpecificationsProductsQuery,
  useLazyGetApiV1ProductSpecificationsProductsQuery,
  usePostApiV1ProductSpecificationsAddRemoveProductsMutation,
  usePostApiV1ProductStpsMutation,
  useGetApiV1ProductStpsQuery,
  useLazyGetApiV1ProductStpsQuery,
  useGetApiV1ProductStpsByStpNumberProductsQuery,
  useLazyGetApiV1ProductStpsByStpNumberProductsQuery,
  useGetApiV1ProductStpsByIdQuery,
  useLazyGetApiV1ProductStpsByIdQuery,
  usePutApiV1ProductStpsByIdMutation,
  useDeleteApiV1ProductStpsByIdMutation,
  useGetApiV1ProductStpsByProductIdProductQuery,
  useLazyGetApiV1ProductStpsByProductIdProductQuery,
  usePostApiV1ProductStpsAddRemoveProductsMutation,
  useGetApiV1ProductStpsUnusedProductsQuery,
  useLazyGetApiV1ProductStpsUnusedProductsQuery,
  useGetApiV1ProductStpsUnlinkedToArdQuery,
  useLazyGetApiV1ProductStpsUnlinkedToArdQuery,
  useGetApiV1StpDocumentsByOwnerTypeAndOwnerIdQuery,
  useLazyGetApiV1StpDocumentsByOwnerTypeAndOwnerIdQuery,
  usePostApiV1StpDocumentsByOwnerTypeAndOwnerIdVersionsMutation,
  usePostApiV1StpDocumentsByOwnerTypeAndOwnerIdNewMutation,
  useGetApiV1StpDocumentsDocumentsByDocumentIdVersionsAndVersionIdFileQuery,
  useLazyGetApiV1StpDocumentsDocumentsByDocumentIdVersionsAndVersionIdFileQuery,
  usePostApiV1StpDocumentsDocumentsByDocumentIdSubmitReviewMutation,
  usePostApiV1StpDocumentsDocumentsByDocumentIdApproveMutation,
  usePostApiV1StpDocumentsDocumentsByDocumentIdRejectMutation,
} = injectedRtkApi;
