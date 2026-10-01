import { api } from "../base-api";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    postApiV1Form: build.mutation<
      PostApiV1FormApiResponse,
      PostApiV1FormApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form`,
        method: "POST",
        body: queryArg.domainEntitiesFormsRequestCreateFormRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1Form: build.query<GetApiV1FormApiResponse, GetApiV1FormApiArg>({
      query: (queryArg) => ({
        url: `/api/v1/form`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          searchQuery: queryArg.searchQuery,
          type: queryArg["type"],
          materialId: queryArg.materialId,
          productId: queryArg.productId,
          materialSpecificationNumber: queryArg.materialSpecificationNumber,
          productSpecificationNumber: queryArg.productSpecificationNumber,
          pageSize: queryArg.pageSize,
          page: queryArg.page,
          sortLabel: queryArg.sortLabel,
          sortDirection: queryArg.sortDirection,
        },
      }),
    }),
    getApiV1FormByFormId: build.query<
      GetApiV1FormByFormIdApiResponse,
      GetApiV1FormByFormIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/${queryArg.formId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1FormByFormId: build.mutation<
      PutApiV1FormByFormIdApiResponse,
      PutApiV1FormByFormIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/${queryArg.formId}`,
        method: "PUT",
        body: queryArg.domainEntitiesFormsRequestCreateFormRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1FormByFormId: build.mutation<
      DeleteApiV1FormByFormIdApiResponse,
      DeleteApiV1FormByFormIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/${queryArg.formId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1FormSection: build.query<
      GetApiV1FormSectionApiResponse,
      GetApiV1FormSectionApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/section`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          searchQuery: queryArg.searchQuery,
          type: queryArg["type"],
          materialId: queryArg.materialId,
          productId: queryArg.productId,
          materialSpecificationNumber: queryArg.materialSpecificationNumber,
          productSpecificationNumber: queryArg.productSpecificationNumber,
          pageSize: queryArg.pageSize,
          page: queryArg.page,
          sortLabel: queryArg.sortLabel,
          sortDirection: queryArg.sortDirection,
        },
      }),
    }),
    putApiV1FormByFormIdMetadata: build.mutation<
      PutApiV1FormByFormIdMetadataApiResponse,
      PutApiV1FormByFormIdMetadataApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/${queryArg.formId}/metadata`,
        method: "PUT",
        body: queryArg.domainEntitiesFormsRequestUpdateFormMetadataRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1FormByFormIdSection: build.mutation<
      PostApiV1FormByFormIdSectionApiResponse,
      PostApiV1FormByFormIdSectionApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/${queryArg.formId}/section`,
        method: "POST",
        body: queryArg.domainEntitiesFormsRequestCreateFormSectionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1FormSectionBySectionId: build.mutation<
      PutApiV1FormSectionBySectionIdApiResponse,
      PutApiV1FormSectionBySectionIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/section/${queryArg.sectionId}`,
        method: "PUT",
        body: queryArg.domainEntitiesFormsRequestUpdateFormSectionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1FormSectionBySectionId: build.mutation<
      DeleteApiV1FormSectionBySectionIdApiResponse,
      DeleteApiV1FormSectionBySectionIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/section/${queryArg.sectionId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1FormSectionBySectionIdField: build.mutation<
      PostApiV1FormSectionBySectionIdFieldApiResponse,
      PostApiV1FormSectionBySectionIdFieldApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/section/${queryArg.sectionId}/field`,
        method: "POST",
        body: queryArg.domainEntitiesFormsRequestCreateFormFieldRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1FormFieldByFieldId: build.mutation<
      PutApiV1FormFieldByFieldIdApiResponse,
      PutApiV1FormFieldByFieldIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/field/${queryArg.fieldId}`,
        method: "PUT",
        body: queryArg.domainEntitiesFormsRequestUpdateFormFieldRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1FormFieldByFieldId: build.mutation<
      DeleteApiV1FormFieldByFieldIdApiResponse,
      DeleteApiV1FormFieldByFieldIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/field/${queryArg.fieldId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1FormByFormIdReviewer: build.mutation<
      PostApiV1FormByFormIdReviewerApiResponse,
      PostApiV1FormByFormIdReviewerApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/${queryArg.formId}/reviewer`,
        method: "POST",
        body: queryArg.domainEntitiesFormsRequestCreateFormReviewerRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1FormByFormIdReviewerAndReviewerUserId: build.mutation<
      DeleteApiV1FormByFormIdReviewerAndReviewerUserIdApiResponse,
      DeleteApiV1FormByFormIdReviewerAndReviewerUserIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/${queryArg.formId}/reviewer/${queryArg.reviewerUserId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1FormResponsesDraft: build.mutation<
      PostApiV1FormResponsesDraftApiResponse,
      PostApiV1FormResponsesDraftApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/responses/draft`,
        method: "POST",
        body: queryArg.domainEntitiesFormsRequestSaveResponseDraftRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1FormResponsesFinalizeByResponseId: build.mutation<
      PostApiV1FormResponsesFinalizeByResponseIdApiResponse,
      PostApiV1FormResponsesFinalizeByResponseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/responses/finalize/${queryArg.responseId}`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1FormResponses: build.mutation<
      PostApiV1FormResponsesApiResponse,
      PostApiV1FormResponsesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/responses`,
        method: "POST",
        body: queryArg.domainEntitiesFormsRequestCreateResponseRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1FormResponsesSection: build.mutation<
      PostApiV1FormResponsesSectionApiResponse,
      PostApiV1FormResponsesSectionApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/responses/section`,
        method: "POST",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          materialSpecificationId: queryArg.materialSpecificationId,
          productSpecificationId: queryArg.productSpecificationId,
        },
      }),
    }),
    putApiV1FormResponsesSection: build.mutation<
      PutApiV1FormResponsesSectionApiResponse,
      PutApiV1FormResponsesSectionApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/responses/section`,
        method: "PUT",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          materialSpecificationId: queryArg.materialSpecificationId,
          productSpecificationId: queryArg.productSpecificationId,
        },
      }),
    }),
    getApiV1FormResponsesByFormResponseId: build.query<
      GetApiV1FormResponsesByFormResponseIdApiResponse,
      GetApiV1FormResponsesByFormResponseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/responses/${queryArg.formResponseId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1FormQuestion: build.mutation<
      PostApiV1FormQuestionApiResponse,
      PostApiV1FormQuestionApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/question`,
        method: "POST",
        body: queryArg.domainEntitiesFormsRequestCreateQuestionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1FormQuestion: build.query<
      GetApiV1FormQuestionApiResponse,
      GetApiV1FormQuestionApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/question`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          searchQuery: queryArg.searchQuery,
          type: queryArg["type"],
          formType: queryArg.formType,
          pageSize: queryArg.pageSize,
          page: queryArg.page,
          sortLabel: queryArg.sortLabel,
          sortDirection: queryArg.sortDirection,
        },
      }),
    }),
    getApiV1FormQuestionByQuestionId: build.query<
      GetApiV1FormQuestionByQuestionIdApiResponse,
      GetApiV1FormQuestionByQuestionIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/question/${queryArg.questionId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1FormQuestionByQuestionId: build.mutation<
      PutApiV1FormQuestionByQuestionIdApiResponse,
      PutApiV1FormQuestionByQuestionIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/question/${queryArg.questionId}`,
        method: "PUT",
        body: queryArg.domainEntitiesFormsRequestCreateQuestionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1FormQuestionByQuestionId: build.mutation<
      DeleteApiV1FormQuestionByQuestionIdApiResponse,
      DeleteApiV1FormQuestionByQuestionIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/question/${queryArg.questionId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1FormGenerateCertificateByMaterialBatchId: build.mutation<
      PostApiV1FormGenerateCertificateByMaterialBatchIdApiResponse,
      PostApiV1FormGenerateCertificateByMaterialBatchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/generate-certificate/${queryArg.materialBatchId}`,
        method: "POST",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1FormGenerateCertificateProductByBatchManufacturingRecordIdAndProductionActivityStepId:
      build.mutation<
        PostApiV1FormGenerateCertificateProductByBatchManufacturingRecordIdAndProductionActivityStepIdApiResponse,
        PostApiV1FormGenerateCertificateProductByBatchManufacturingRecordIdAndProductionActivityStepIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/form/generate-certificate/product/${queryArg.batchManufacturingRecordId}/${queryArg.productionActivityStepId}`,
          method: "POST",
          body: queryArg.body,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1FormResponsesMaterialBatchByMaterialBatchId: build.query<
      GetApiV1FormResponsesMaterialBatchByMaterialBatchIdApiResponse,
      GetApiV1FormResponsesMaterialBatchByMaterialBatchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/responses/material-batch/${queryArg.materialBatchId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1FormResponsesBmrByBatchManufacturingRecordId: build.query<
      GetApiV1FormResponsesBmrByBatchManufacturingRecordIdApiResponse,
      GetApiV1FormResponsesBmrByBatchManufacturingRecordIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/responses/bmr/${queryArg.batchManufacturingRecordId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          productionActivityStepId: queryArg.productionActivityStepId,
        },
      }),
    }),
    getApiV1FormResponsesMaterialSpecificationByMaterialSpecificationId:
      build.query<
        GetApiV1FormResponsesMaterialSpecificationByMaterialSpecificationIdApiResponse,
        GetApiV1FormResponsesMaterialSpecificationByMaterialSpecificationIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/form/responses/material-specification/${queryArg.materialSpecificationId}`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1FormResponsesProductSpecificationByProductSpecificationId:
      build.query<
        GetApiV1FormResponsesProductSpecificationByProductSpecificationIdApiResponse,
        GetApiV1FormResponsesProductSpecificationByProductSpecificationIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/form/responses/product-specification/${queryArg.productSpecificationId}`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1FormWithResponsesMaterialBatchByMaterialBatchId: build.query<
      GetApiV1FormWithResponsesMaterialBatchByMaterialBatchIdApiResponse,
      GetApiV1FormWithResponsesMaterialBatchByMaterialBatchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/with-responses/material-batch/${queryArg.materialBatchId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1FormWithResponsesBmrByBatchManufacturingRecordId: build.query<
      GetApiV1FormWithResponsesBmrByBatchManufacturingRecordIdApiResponse,
      GetApiV1FormWithResponsesBmrByBatchManufacturingRecordIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/with-responses/bmr/${queryArg.batchManufacturingRecordId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1FormAssigneesDraft: build.mutation<
      PostApiV1FormAssigneesDraftApiResponse,
      PostApiV1FormAssigneesDraftApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/assignees/draft`,
        method: "POST",
        body: queryArg.domainEntitiesFormsRequestSaveFormAssigneeDraftRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1FormAssigneesFinalizeByFormAssigneeId: build.mutation<
      PostApiV1FormAssigneesFinalizeByFormAssigneeIdApiResponse,
      PostApiV1FormAssigneesFinalizeByFormAssigneeIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/assignees/finalize/${queryArg.formAssigneeId}`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1FormAssigneesReassign: build.mutation<
      PostApiV1FormAssigneesReassignApiResponse,
      PostApiV1FormAssigneesReassignApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/assignees/reassign`,
        method: "POST",
        body: queryArg.domainEntitiesFormsRequestReassignFormAssigneeRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1FormAssignees: build.mutation<
      PostApiV1FormAssigneesApiResponse,
      PostApiV1FormAssigneesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/assignees`,
        method: "POST",
        body: queryArg.domainEntitiesFormsRequestCreateFormAssigneeRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1FormAssigneesMaterialBatchByMaterialBatchId: build.query<
      GetApiV1FormAssigneesMaterialBatchByMaterialBatchIdApiResponse,
      GetApiV1FormAssigneesMaterialBatchByMaterialBatchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/assignees/material-batch/${queryArg.materialBatchId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          stage: queryArg.stage,
          productionActivityStepId: queryArg.productionActivityStepId,
        },
      }),
    }),
    getApiV1FormAssigneesBmrByBmrId: build.query<
      GetApiV1FormAssigneesBmrByBmrIdApiResponse,
      GetApiV1FormAssigneesBmrByBmrIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/assignees/bmr/${queryArg.bmrId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          stage: queryArg.stage,
          productionActivityStepId: queryArg.productionActivityStepId,
        },
      }),
    }),
    getApiV1FormResponse: build.query<
      GetApiV1FormResponseApiResponse,
      GetApiV1FormResponseApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/response`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          formId: queryArg.formId,
          materialBatchId: queryArg.materialBatchId,
          materialSamplingId: queryArg.materialSamplingId,
          batchManufacturingRecordId: queryArg.batchManufacturingRecordId,
          productionActivityStepId: queryArg.productionActivityStepId,
          routineTrackId: queryArg.routineTrackId,
        },
      }),
    }),
    getApiV1FormFormAssignee: build.query<
      GetApiV1FormFormAssigneeApiResponse,
      GetApiV1FormFormAssigneeApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/form/form-assignee`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          formId: queryArg.formId,
          materialBatchId: queryArg.materialBatchId,
          materialSamplingId: queryArg.materialSamplingId,
          batchManufacturingRecordId: queryArg.batchManufacturingRecordId,
          productionActivityStepId: queryArg.productionActivityStepId,
          routineTrackId: queryArg.routineTrackId,
        },
      }),
    }),
    postApiV1FormulaRuntimeResponsesByResponseIdPlacementsAndPlacementKeyEvaluate:
      build.mutation<
        PostApiV1FormulaRuntimeResponsesByResponseIdPlacementsAndPlacementKeyEvaluateApiResponse,
        PostApiV1FormulaRuntimeResponsesByResponseIdPlacementsAndPlacementKeyEvaluateApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/formula-runtime/responses/${queryArg.responseId}/placements/${queryArg.placementKey}/evaluate`,
          method: "POST",
          body: queryArg.appServicesFormulasFormulaEvaluationRequest,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as formsApi };
export type PostApiV1FormApiResponse = /** status 200 OK */ string;
export type PostApiV1FormApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateFormRequest object. */
  domainEntitiesFormsRequestCreateFormRequest: DomainEntitiesFormsRequestCreateFormRequest;
};
export type GetApiV1FormApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesFormsFormDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1FormApiArg = {
  searchQuery?: string;
  type?: DomainEntitiesFormsFormType;
  materialId?: string;
  productId?: string;
  materialSpecificationNumber?: string;
  productSpecificationNumber?: string;
  pageSize?: number;
  page?: number;
  sortLabel?: string;
  sortDirection?: SharedSortDirection;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1FormByFormIdApiResponse =
  /** status 200 OK */ DomainEntitiesFormsFormDto;
export type GetApiV1FormByFormIdApiArg = {
  /** The ID of the form. */
  formId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1FormByFormIdApiResponse = void;
export type PutApiV1FormByFormIdApiArg = {
  /** The ID of the form to be updated. */
  formId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateFormRequest object containing updated form data. */
  domainEntitiesFormsRequestCreateFormRequest: DomainEntitiesFormsRequestCreateFormRequest;
};
export type DeleteApiV1FormByFormIdApiResponse = void;
export type DeleteApiV1FormByFormIdApiArg = {
  /** The ID of the form to be deleted. */
  formId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1FormSectionApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesFormsFormSectionDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1FormSectionApiArg = {
  searchQuery?: string;
  type?: DomainEntitiesFormsFormType;
  materialId?: string;
  productId?: string;
  materialSpecificationNumber?: string;
  productSpecificationNumber?: string;
  pageSize?: number;
  page?: number;
  sortLabel?: string;
  sortDirection?: SharedSortDirection;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1FormByFormIdMetadataApiResponse = void;
export type PutApiV1FormByFormIdMetadataApiArg = {
  formId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesFormsRequestUpdateFormMetadataRequest: DomainEntitiesFormsRequestUpdateFormMetadataRequest;
};
export type PostApiV1FormByFormIdSectionApiResponse =
  /** status 200 OK */ string;
export type PostApiV1FormByFormIdSectionApiArg = {
  formId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesFormsRequestCreateFormSectionRequest: DomainEntitiesFormsRequestCreateFormSectionRequest;
};
export type PutApiV1FormSectionBySectionIdApiResponse = void;
export type PutApiV1FormSectionBySectionIdApiArg = {
  sectionId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesFormsRequestUpdateFormSectionRequest: DomainEntitiesFormsRequestUpdateFormSectionRequest;
};
export type DeleteApiV1FormSectionBySectionIdApiResponse = void;
export type DeleteApiV1FormSectionBySectionIdApiArg = {
  sectionId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1FormSectionBySectionIdFieldApiResponse =
  /** status 200 OK */ string;
export type PostApiV1FormSectionBySectionIdFieldApiArg = {
  sectionId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesFormsRequestCreateFormFieldRequest: DomainEntitiesFormsRequestCreateFormFieldRequest;
};
export type PutApiV1FormFieldByFieldIdApiResponse = void;
export type PutApiV1FormFieldByFieldIdApiArg = {
  fieldId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesFormsRequestUpdateFormFieldRequest: DomainEntitiesFormsRequestUpdateFormFieldRequest;
};
export type DeleteApiV1FormFieldByFieldIdApiResponse = void;
export type DeleteApiV1FormFieldByFieldIdApiArg = {
  fieldId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1FormByFormIdReviewerApiResponse = void;
export type PostApiV1FormByFormIdReviewerApiArg = {
  formId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesFormsRequestCreateFormReviewerRequest: DomainEntitiesFormsRequestCreateFormReviewerRequest;
};
export type DeleteApiV1FormByFormIdReviewerAndReviewerUserIdApiResponse = void;
export type DeleteApiV1FormByFormIdReviewerAndReviewerUserIdApiArg = {
  formId: string;
  reviewerUserId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1FormResponsesDraftApiResponse =
  /** status 200 OK */ string;
export type PostApiV1FormResponsesDraftApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The SaveResponseDraftRequest object containing field response data. */
  domainEntitiesFormsRequestSaveResponseDraftRequest: DomainEntitiesFormsRequestSaveResponseDraftRequest;
};
export type PostApiV1FormResponsesFinalizeByResponseIdApiResponse = void;
export type PostApiV1FormResponsesFinalizeByResponseIdApiArg = {
  /** The unique identifier of the Response being finalized. */
  responseId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1FormResponsesApiResponse = void;
export type PostApiV1FormResponsesApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateResponseRequest object containing response data. */
  domainEntitiesFormsRequestCreateResponseRequest: DomainEntitiesFormsRequestCreateResponseRequest;
};
export type PostApiV1FormResponsesSectionApiResponse = void;
export type PostApiV1FormResponsesSectionApiArg = {
  /** The id of the material spec */
  materialSpecificationId?: string;
  /** The id of the product spec */
  productSpecificationId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateResponseRequest object containing response data. */
  body: DomainEntitiesFormsRequestSubmitFormSectionValue[];
};
export type PutApiV1FormResponsesSectionApiResponse = void;
export type PutApiV1FormResponsesSectionApiArg = {
  /** The id of the material spec */
  materialSpecificationId?: string;
  /** The id of the product spec */
  productSpecificationId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateResponseRequest object containing response data. */
  body: DomainEntitiesFormsRequestSubmitFormSectionValue[];
};
export type GetApiV1FormResponsesByFormResponseIdApiResponse =
  /** status 200 OK */ DomainEntitiesFormsResponseDetailDto;
export type GetApiV1FormResponsesByFormResponseIdApiArg = {
  /** The ID of the form response. */
  formResponseId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1FormQuestionApiResponse = /** status 200 OK */ string;
export type PostApiV1FormQuestionApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateQuestionRequest object containing question data. */
  domainEntitiesFormsRequestCreateQuestionRequest: DomainEntitiesFormsRequestCreateQuestionRequest;
};
export type GetApiV1FormQuestionApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesFormsQuestionDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1FormQuestionApiArg = {
  searchQuery?: string;
  type?: DomainEntitiesFormsQuestionType[];
  formType?: DomainEntitiesFormsFormType;
  pageSize?: number;
  page?: number;
  sortLabel?: string;
  sortDirection?: SharedSortDirection;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1FormQuestionByQuestionIdApiResponse =
  /** status 200 OK */ DomainEntitiesFormsQuestionDto;
export type GetApiV1FormQuestionByQuestionIdApiArg = {
  /** The ID of the question. */
  questionId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1FormQuestionByQuestionIdApiResponse = void;
export type PutApiV1FormQuestionByQuestionIdApiArg = {
  /** The ID of the question to be updated. */
  questionId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateQuestionRequest object containing updated question data. */
  domainEntitiesFormsRequestCreateQuestionRequest: DomainEntitiesFormsRequestCreateQuestionRequest;
};
export type DeleteApiV1FormQuestionByQuestionIdApiResponse = void;
export type DeleteApiV1FormQuestionByQuestionIdApiArg = {
  /** The ID of the question to be deleted. */
  questionId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1FormGenerateCertificateByMaterialBatchIdApiResponse = void;
export type PostApiV1FormGenerateCertificateByMaterialBatchIdApiArg = {
  /** The ID of the material batch. */
  materialBatchId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The list of section ids that comply */
  body: DomainEntitiesFormsCertificateOfAnalysisComplies[];
};
export type PostApiV1FormGenerateCertificateProductByBatchManufacturingRecordIdAndProductionActivityStepIdApiResponse = void;
export type PostApiV1FormGenerateCertificateProductByBatchManufacturingRecordIdAndProductionActivityStepIdApiArg =
  {
    /** The ID of the batch manufacturing. */
    batchManufacturingRecordId: string;
    /** The id of production activity step */
    productionActivityStepId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
    /** The list of section ids that comply */
    body: DomainEntitiesFormsCertificateOfAnalysisComplies[];
  };
export type GetApiV1FormResponsesMaterialBatchByMaterialBatchIdApiResponse =
  /** status 200 OK */ DomainEntitiesFormsFormResponseDto[];
export type GetApiV1FormResponsesMaterialBatchByMaterialBatchIdApiArg = {
  /** The ID of the material batch. */
  materialBatchId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1FormResponsesBmrByBatchManufacturingRecordIdApiResponse =
  /** status 200 OK */ DomainEntitiesFormsFormResponseDto[];
export type GetApiV1FormResponsesBmrByBatchManufacturingRecordIdApiArg = {
  /** The ID of the batch manufacturing record. */
  batchManufacturingRecordId: string;
  /** Optional production stage step filter. */
  productionActivityStepId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1FormResponsesMaterialSpecificationByMaterialSpecificationIdApiResponse =
  /** status 200 OK */ DomainEntitiesFormsFormResponseDto[];
export type GetApiV1FormResponsesMaterialSpecificationByMaterialSpecificationIdApiArg =
  {
    /** The ID of the material spec. */
    materialSpecificationId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1FormResponsesProductSpecificationByProductSpecificationIdApiResponse =
  /** status 200 OK */ DomainEntitiesFormsFormResponseDto[];
export type GetApiV1FormResponsesProductSpecificationByProductSpecificationIdApiArg =
  {
    /** The ID of the product spec */
    productSpecificationId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1FormWithResponsesMaterialBatchByMaterialBatchIdApiResponse =
  /** status 200 OK */ DomainEntitiesFormsFormDto;
export type GetApiV1FormWithResponsesMaterialBatchByMaterialBatchIdApiArg = {
  /** The ID of the material batch. */
  materialBatchId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1FormWithResponsesBmrByBatchManufacturingRecordIdApiResponse =
  /** status 200 OK */ DomainEntitiesFormsFormDto;
export type GetApiV1FormWithResponsesBmrByBatchManufacturingRecordIdApiArg = {
  /** The ID of the batch manufacturing record. */
  batchManufacturingRecordId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1FormAssigneesDraftApiResponse = void;
export type PostApiV1FormAssigneesDraftApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The SaveFormAssigneeDraftRequest object containing field assignment data. */
  domainEntitiesFormsRequestSaveFormAssigneeDraftRequest: DomainEntitiesFormsRequestSaveFormAssigneeDraftRequest;
};
export type PostApiV1FormAssigneesFinalizeByFormAssigneeIdApiResponse = void;
export type PostApiV1FormAssigneesFinalizeByFormAssigneeIdApiArg = {
  /** The unique identifier of the FormAssignee being finalized. */
  formAssigneeId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1FormAssigneesReassignApiResponse = void;
export type PostApiV1FormAssigneesReassignApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The ReassignFormAssigneeRequest object containing reassignment data. */
  domainEntitiesFormsRequestReassignFormAssigneeRequest: DomainEntitiesFormsRequestReassignFormAssigneeRequest;
};
export type PostApiV1FormAssigneesApiResponse = void;
export type PostApiV1FormAssigneesApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateFormAssigneeRequest object containing form and field assignment data. */
  domainEntitiesFormsRequestCreateFormAssigneeRequest: DomainEntitiesFormsRequestCreateFormAssigneeRequest;
};
export type GetApiV1FormAssigneesMaterialBatchByMaterialBatchIdApiResponse =
  /** status 200 OK */ DomainEntitiesFormsFormAssigneeDto;
export type GetApiV1FormAssigneesMaterialBatchByMaterialBatchIdApiArg = {
  /** The unique identifier of the Material Batch. */
  materialBatchId: string;
  /** Optional test stage to disambiguate assignments when a batch has more than one. */
  stage?: DomainEntitiesAnalyticalTestRequestsTestStage;
  /** Optional production activity step to disambiguate assignments. */
  productionActivityStepId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1FormAssigneesBmrByBmrIdApiResponse =
  /** status 200 OK */ DomainEntitiesFormsFormAssigneeDto;
export type GetApiV1FormAssigneesBmrByBmrIdApiArg = {
  /** The unique identifier of the Batch Manufacturing Record. */
  bmrId: string;
  /** Optional test stage to disambiguate assignments when a BMR has more than one. */
  stage?: DomainEntitiesAnalyticalTestRequestsTestStage;
  /** Optional production activity step to disambiguate assignments. */
  productionActivityStepId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1FormResponseApiResponse = /** status 200 OK */ string;
export type GetApiV1FormResponseApiArg = {
  formId?: string;
  materialBatchId?: string;
  materialSamplingId?: string;
  batchManufacturingRecordId?: string;
  productionActivityStepId?: string;
  routineTrackId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1FormFormAssigneeApiResponse = /** status 200 OK */ string;
export type GetApiV1FormFormAssigneeApiArg = {
  formId?: string;
  materialBatchId?: string;
  materialSamplingId?: string;
  batchManufacturingRecordId?: string;
  productionActivityStepId?: string;
  routineTrackId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1FormulaRuntimeResponsesByResponseIdPlacementsAndPlacementKeyEvaluateApiResponse =
  /** status 200 OK */ AppServicesFormulasFormulaExecutionDto;
export type PostApiV1FormulaRuntimeResponsesByResponseIdPlacementsAndPlacementKeyEvaluateApiArg =
  {
    responseId: string;
    placementKey: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
    appServicesFormulasFormulaEvaluationRequest: AppServicesFormulasFormulaEvaluationRequest;
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
export type DomainEntitiesFormsRequestCreateFormFieldRequest = {
  questionId?: string;
  required?: boolean;
  rank?: number;
  description?: string | null;
};
export type DomainEntitiesQualityRoutinesAnalysisType = 0 | 1;
export type DomainEntitiesFormsRequestCreateFormSectionRequest = {
  name?: string | null;
  description?: string | null;
  order?: number;
  instrumentId?: string | null;
  fields?: DomainEntitiesFormsRequestCreateFormFieldRequest[] | null;
  groupName?: string | null;
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
};
export type DomainEntitiesAnalyticalTestRequestsTestStage = 0 | 1 | 2;
export type DomainEntitiesFormsRequestCreateFormFieldAssigneeRequest = {
  formFieldId?: string;
  assigneeId?: string | null;
};
export type DomainEntitiesFormsRequestCreateFormAssigneeRequest = {
  formId?: string;
  batchManufacturingRecordId?: string | null;
  stage?: DomainEntitiesAnalyticalTestRequestsTestStage;
  materialBatchId?: string | null;
  materialSamplingId?: string | null;
  materialSpecificationId?: string | null;
  productSpecificationId?: string | null;
  productionActivityStepId?: string | null;
  routineTrackId?: string | null;
  formFieldAssignees?:
    DomainEntitiesFormsRequestCreateFormFieldAssigneeRequest[] | null;
  issueNumber?: string | null;
};
export type DomainEntitiesFormsRequestCreateFormReviewerRequest = {
  userId?: string;
};
export type DomainEntitiesFormsFormType = 0 | 1;
export type DomainEntitiesFormsRequestCreateFormRequest = {
  name?: string | null;
  sections?: DomainEntitiesFormsRequestCreateFormSectionRequest[] | null;
  assignees?: DomainEntitiesFormsRequestCreateFormAssigneeRequest[] | null;
  reviewers?: DomainEntitiesFormsRequestCreateFormReviewerRequest[] | null;
  type?: DomainEntitiesFormsFormType;
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
export type DomainEntitiesAttachmentsAttachmentDto = {
  link?: string | null;
  name?: string | null;
  id?: string;
  reference?: string | null;
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
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesFormsFormDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesFormsFormDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type SharedSortDirection = 0 | 1 | 2;
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesFormsFormSectionDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesFormsFormSectionDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesFormsRequestUpdateFormMetadataRequest = {
  name: string;
  type?: DomainEntitiesFormsFormType;
};
export type DomainEntitiesFormsRequestUpdateFormSectionRequest = {
  name: string;
  description?: string | null;
  order?: number;
  instrumentId?: string | null;
  groupName?: string | null;
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
};
export type DomainEntitiesFormsRequestUpdateFormFieldRequest = {
  questionId?: string;
  required?: boolean;
  rank?: number;
  description?: string | null;
};
export type DomainEntitiesFormsRequestSaveResponseDraftRequest = {
  responseId?: string | null;
  formId?: string;
  formFieldId?: string;
  value?: string | null;
  materialBatchId?: string | null;
  materialSamplingId?: string | null;
  batchManufacturingRecordId?: string | null;
  materialSpecificationId?: string | null;
  productSpecificationId?: string | null;
  productionActivityStepId?: string | null;
  routineTrackId?: string | null;
};
export type DomainEntitiesFormsRequestCreateFormResponseRequest = {
  formFieldId?: string;
  value?: string | null;
};
export type DomainEntitiesFormsRequestCreateResponseRequest = {
  formId?: string;
  batchManufacturingRecordId?: string | null;
  materialBatchId?: string | null;
  materialSamplingId?: string | null;
  materialSpecificationId?: string | null;
  productSpecificationId?: string | null;
  productionActivityStepId?: string | null;
  routineTrackId?: string | null;
  formResponses?: DomainEntitiesFormsRequestCreateFormResponseRequest[] | null;
};
export type DomainEntitiesFormsRequestSubmitFormSectionValue = {
  formSectionId?: string;
  value?: string | null;
};
export type DomainEntitiesFormsResponseDetailDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  form?: SharedCollectionItemDto;
  formResponses?: DomainEntitiesFormsFormResponseDto[] | null;
  batchManufacturingRecord?: SharedCollectionItemDto;
  materialBatch?: SharedCollectionItemDto;
  productionActivityStepId?: string | null;
  checkedBy?: DomainEntitiesUsersUserDto;
  checkedAt?: string | null;
  approved?: boolean;
  rejected?: boolean;
  hasPendingApproval?: boolean;
};
export type DomainEntitiesFormsRequestCreateQuestionOptionsRequest = {
  name?: string | null;
};
export type DomainEntitiesFormsFormulaDto = {
  expression?: string | null;
  variables?: string | null;
};
export type DomainEntitiesFormsRequestCreateQuestionRequest = {
  label: string;
  type: DomainEntitiesFormsQuestionType;
  isMultiSelect?: boolean;
  validation?: DomainEntitiesFormsQuestionValidationType;
  options?: DomainEntitiesFormsRequestCreateQuestionOptionsRequest[] | null;
  description?: string | null;
  reference?: string | null;
  formula?: DomainEntitiesFormsFormulaDto;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesFormsQuestionDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesFormsQuestionDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesFormsCertificateOfAnalysisComplies = {
  formSectionId?: string;
  complies?: boolean;
};
export type DomainEntitiesFormsRequestSaveFormAssigneeDraftRequest = {
  routineTrackId?: string | null;
  formAssigneeId?: string | null;
  formId?: string;
  formFieldId?: string;
  materialBatchId?: string | null;
  materialSamplingId?: string | null;
  batchManufacturingRecordId?: string | null;
  productionActivityStepId?: string | null;
  stage?: DomainEntitiesAnalyticalTestRequestsTestStage;
  assigneeId?: string | null;
};
export type DomainEntitiesFormsRequestReassignFormAssigneeRequest = {
  formAssigneeId?: string;
  oldAssigneeId?: string;
  newAssigneeId?: string | null;
};
export type DomainEntitiesFormsFormFieldAssigneeDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  formField?: DomainEntitiesFormsFormFieldDto;
  assignee?: DomainEntitiesUsersUserDto;
};
export type DomainEntitiesFormsFormAssigneeDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  form?: DomainEntitiesFormsFormDto;
  fieldAssignees?: DomainEntitiesFormsFormFieldAssigneeDto[] | null;
};
export type AppServicesFormulasFormulaExecutionDto = {
  id?: string;
  responseFormulaSnapshotId?: string;
  placementKey?: string | null;
  status?: number;
  statusName?: string | null;
  authority?: number;
  authorityName?: string | null;
  engineVersion?: string | null;
  engineBuildHash?: string | null;
  inputHash?: string | null;
  resultHash?: string | null;
  rawResultsJson?: string | null;
  roundedResultsJson?: string | null;
  displayResultsJson?: string | null;
  executedAt?: string;
};
export type AppServicesFormulasFormulaEvaluationRequest = {
  idempotencyKey?: string | null;
};
export const {
  usePostApiV1FormMutation,
  useGetApiV1FormQuery,
  useLazyGetApiV1FormQuery,
  useGetApiV1FormByFormIdQuery,
  useLazyGetApiV1FormByFormIdQuery,
  usePutApiV1FormByFormIdMutation,
  useDeleteApiV1FormByFormIdMutation,
  useGetApiV1FormSectionQuery,
  useLazyGetApiV1FormSectionQuery,
  usePutApiV1FormByFormIdMetadataMutation,
  usePostApiV1FormByFormIdSectionMutation,
  usePutApiV1FormSectionBySectionIdMutation,
  useDeleteApiV1FormSectionBySectionIdMutation,
  usePostApiV1FormSectionBySectionIdFieldMutation,
  usePutApiV1FormFieldByFieldIdMutation,
  useDeleteApiV1FormFieldByFieldIdMutation,
  usePostApiV1FormByFormIdReviewerMutation,
  useDeleteApiV1FormByFormIdReviewerAndReviewerUserIdMutation,
  usePostApiV1FormResponsesDraftMutation,
  usePostApiV1FormResponsesFinalizeByResponseIdMutation,
  usePostApiV1FormResponsesMutation,
  usePostApiV1FormResponsesSectionMutation,
  usePutApiV1FormResponsesSectionMutation,
  useGetApiV1FormResponsesByFormResponseIdQuery,
  useLazyGetApiV1FormResponsesByFormResponseIdQuery,
  usePostApiV1FormQuestionMutation,
  useGetApiV1FormQuestionQuery,
  useLazyGetApiV1FormQuestionQuery,
  useGetApiV1FormQuestionByQuestionIdQuery,
  useLazyGetApiV1FormQuestionByQuestionIdQuery,
  usePutApiV1FormQuestionByQuestionIdMutation,
  useDeleteApiV1FormQuestionByQuestionIdMutation,
  usePostApiV1FormGenerateCertificateByMaterialBatchIdMutation,
  usePostApiV1FormGenerateCertificateProductByBatchManufacturingRecordIdAndProductionActivityStepIdMutation,
  useGetApiV1FormResponsesMaterialBatchByMaterialBatchIdQuery,
  useLazyGetApiV1FormResponsesMaterialBatchByMaterialBatchIdQuery,
  useGetApiV1FormResponsesBmrByBatchManufacturingRecordIdQuery,
  useLazyGetApiV1FormResponsesBmrByBatchManufacturingRecordIdQuery,
  useGetApiV1FormResponsesMaterialSpecificationByMaterialSpecificationIdQuery,
  useLazyGetApiV1FormResponsesMaterialSpecificationByMaterialSpecificationIdQuery,
  useGetApiV1FormResponsesProductSpecificationByProductSpecificationIdQuery,
  useLazyGetApiV1FormResponsesProductSpecificationByProductSpecificationIdQuery,
  useGetApiV1FormWithResponsesMaterialBatchByMaterialBatchIdQuery,
  useLazyGetApiV1FormWithResponsesMaterialBatchByMaterialBatchIdQuery,
  useGetApiV1FormWithResponsesBmrByBatchManufacturingRecordIdQuery,
  useLazyGetApiV1FormWithResponsesBmrByBatchManufacturingRecordIdQuery,
  usePostApiV1FormAssigneesDraftMutation,
  usePostApiV1FormAssigneesFinalizeByFormAssigneeIdMutation,
  usePostApiV1FormAssigneesReassignMutation,
  usePostApiV1FormAssigneesMutation,
  useGetApiV1FormAssigneesMaterialBatchByMaterialBatchIdQuery,
  useLazyGetApiV1FormAssigneesMaterialBatchByMaterialBatchIdQuery,
  useGetApiV1FormAssigneesBmrByBmrIdQuery,
  useLazyGetApiV1FormAssigneesBmrByBmrIdQuery,
  useGetApiV1FormResponseQuery,
  useLazyGetApiV1FormResponseQuery,
  useGetApiV1FormFormAssigneeQuery,
  useLazyGetApiV1FormFormAssigneeQuery,
  usePostApiV1FormulaRuntimeResponsesByResponseIdPlacementsAndPlacementKeyEvaluateMutation,
} = injectedRtkApi;
