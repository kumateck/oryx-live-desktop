import { api } from "../base-api";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getApiV1TemplateAreasCatalog: build.query<
      GetApiV1TemplateAreasCatalogApiResponse,
      GetApiV1TemplateAreasCatalogApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/template-areas/catalog`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1TemplateAreas: build.query<
      GetApiV1TemplateAreasApiResponse,
      GetApiV1TemplateAreasApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/template-areas`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          includeInactive: queryArg.includeInactive,
        },
      }),
    }),
    postApiV1TemplateAreas: build.mutation<
      PostApiV1TemplateAreasApiResponse,
      PostApiV1TemplateAreasApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/template-areas`,
        method: "POST",
        body: queryArg.domainEntitiesFullProceduresTemplateAreaDraftRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1TemplateAreasById: build.query<
      GetApiV1TemplateAreasByIdApiResponse,
      GetApiV1TemplateAreasByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/template-areas/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1TemplateAreasById: build.mutation<
      PutApiV1TemplateAreasByIdApiResponse,
      PutApiV1TemplateAreasByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/template-areas/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesFullProceduresUpdateTemplateAreaRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1TemplateAreasByIdActive: build.mutation<
      PutApiV1TemplateAreasByIdActiveApiResponse,
      PutApiV1TemplateAreasByIdActiveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/template-areas/${queryArg.id}/active`,
        method: "PUT",
        body: queryArg.domainEntitiesFullProceduresChangeTemplateAreaActiveRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1TemplateQuestionsAreaByAreaId: build.query<
      GetApiV1TemplateQuestionsAreaByAreaIdApiResponse,
      GetApiV1TemplateQuestionsAreaByAreaIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/template-questions/area/${queryArg.areaId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1TemplateQuestionsByQuestionId: build.query<
      GetApiV1TemplateQuestionsByQuestionIdApiResponse,
      GetApiV1TemplateQuestionsByQuestionIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/template-questions/${queryArg.questionId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1TemplateQuestions: build.mutation<
      PostApiV1TemplateQuestionsApiResponse,
      PostApiV1TemplateQuestionsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/template-questions`,
        method: "POST",
        body: queryArg.domainEntitiesFullProceduresCreateTemplateQuestionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as templatesApi };
export type GetApiV1TemplateAreasCatalogApiResponse =
  /** status 200 OK */ DomainEntitiesFullProceduresTemplateAreaCatalogDto;
export type GetApiV1TemplateAreasCatalogApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1TemplateAreasApiResponse =
  /** status 200 OK */ DomainEntitiesFullProceduresTemplateAreaDto[];
export type GetApiV1TemplateAreasApiArg = {
  includeInactive?: boolean;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1TemplateAreasApiResponse =
  /** status 201 Created */ DomainEntitiesFullProceduresTemplateAreaDto;
export type PostApiV1TemplateAreasApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesFullProceduresTemplateAreaDraftRequest: DomainEntitiesFullProceduresTemplateAreaDraftRequest;
};
export type GetApiV1TemplateAreasByIdApiResponse =
  /** status 200 OK */ DomainEntitiesFullProceduresTemplateAreaDto;
export type GetApiV1TemplateAreasByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1TemplateAreasByIdApiResponse =
  /** status 200 OK */ DomainEntitiesFullProceduresTemplateAreaDto;
export type PutApiV1TemplateAreasByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesFullProceduresUpdateTemplateAreaRequest: DomainEntitiesFullProceduresUpdateTemplateAreaRequest;
};
export type PutApiV1TemplateAreasByIdActiveApiResponse =
  /** status 200 OK */ DomainEntitiesFullProceduresTemplateAreaDto;
export type PutApiV1TemplateAreasByIdActiveApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesFullProceduresChangeTemplateAreaActiveRequest: DomainEntitiesFullProceduresChangeTemplateAreaActiveRequest;
};
export type GetApiV1TemplateQuestionsAreaByAreaIdApiResponse =
  /** status 200 OK */ DomainEntitiesFullProceduresTemplateQuestionDto[];
export type GetApiV1TemplateQuestionsAreaByAreaIdApiArg = {
  areaId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1TemplateQuestionsByQuestionIdApiResponse =
  /** status 200 OK */ DomainEntitiesFullProceduresTemplateQuestionDetailDto;
export type GetApiV1TemplateQuestionsByQuestionIdApiArg = {
  questionId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1TemplateQuestionsApiResponse =
  /** status 201 Created */ DomainEntitiesFullProceduresTemplateQuestionRevisionDto;
export type PostApiV1TemplateQuestionsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesFullProceduresCreateTemplateQuestionRequest: DomainEntitiesFullProceduresCreateTemplateQuestionRequest;
};
export type DomainEntitiesFullProceduresTemplatePurposeDto = {
  id?: string | null;
  name?: string | null;
  allowedKinds?: number[] | null;
  subjectTypeIds?: string[] | null;
  capabilityIds?: string[] | null;
};
export type DomainEntitiesFullProceduresTemplateCatalogItemDto = {
  id?: string | null;
  name?: string | null;
};
export type DomainEntitiesFullProceduresTemplateOwnerGroupDto = {
  id?: string;
  name?: string | null;
};
export type DomainEntitiesFullProceduresTemplateAreaCatalogDto = {
  purposes?: DomainEntitiesFullProceduresTemplatePurposeDto[] | null;
  subjectTypes?: DomainEntitiesFullProceduresTemplateCatalogItemDto[] | null;
  capabilities?: DomainEntitiesFullProceduresTemplateCatalogItemDto[] | null;
  reviewPolicies?: DomainEntitiesFullProceduresTemplateCatalogItemDto[] | null;
  ownerGroups?: DomainEntitiesFullProceduresTemplateOwnerGroupDto[] | null;
};
export type DomainEntitiesFullProceduresTemplateAreaAccessLevel =
  0 | 1 | 2 | 3 | 4;
export type DomainEntitiesFullProceduresTemplateAreaRoleGrantDto = {
  roleId?: string;
  roleName?: string | null;
  accessLevel?: DomainEntitiesFullProceduresTemplateAreaAccessLevel;
};
export type DomainEntitiesFullProceduresTemplateAreaDto = {
  id?: string;
  name?: string | null;
  ownerRoleId?: string;
  ownerRoleName?: string | null;
  purposeIds?: string[] | null;
  subjectTypeIds?: string[] | null;
  capabilityIds?: string[] | null;
  reviewPolicyId?: string | null;
  roleGrants?: DomainEntitiesFullProceduresTemplateAreaRoleGrantDto[] | null;
  isActive?: boolean;
  version?: number;
  createdAt?: string;
  updatedAt?: string | null;
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
export type DomainEntitiesFullProceduresTemplateAreaRoleGrantRequest = {
  roleId?: string;
  accessLevel?: DomainEntitiesFullProceduresTemplateAreaAccessLevel;
};
export type DomainEntitiesFullProceduresTemplateAreaDraftRequest = {
  name?: string | null;
  ownerRoleId?: string;
  purposeIds?: string[] | null;
  subjectTypeIds?: string[] | null;
  capabilityIds?: string[] | null;
  reviewPolicyId?: string | null;
  roleGrants?:
    DomainEntitiesFullProceduresTemplateAreaRoleGrantRequest[] | null;
  reason?: string | null;
};
export type DomainEntitiesFullProceduresUpdateTemplateAreaRequest = {
  name?: string | null;
  ownerRoleId?: string;
  purposeIds?: string[] | null;
  subjectTypeIds?: string[] | null;
  capabilityIds?: string[] | null;
  reviewPolicyId?: string | null;
  roleGrants?:
    DomainEntitiesFullProceduresTemplateAreaRoleGrantRequest[] | null;
  reason?: string | null;
  expectedVersion?: number;
};
export type DomainEntitiesFullProceduresChangeTemplateAreaActiveRequest = {
  isActive?: boolean;
  expectedVersion?: number;
  reason?: string | null;
};
export type DomainEntitiesFullProceduresTemplateQuestionRevisionStatus =
  0 | 1 | 2 | 3;
export type DomainEntitiesFullProceduresTemplateQuestionAnswerType =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type DomainEntitiesFullProceduresTemplateQuestionOptionDto = {
  value?: string | null;
  label?: string | null;
  rank?: number;
};
export type DomainEntitiesFullProceduresTemplateQuestionReferenceDto = {
  questionId?: string;
  revisionId?: string;
};
export type DomainEntitiesFullProceduresTemplateQuestionSensitivity = 0 | 1 | 2;
export type DomainEntitiesFullProceduresTemplateQuestionRevisionDto = {
  id?: string;
  templateQuestionId?: string;
  sequence?: number;
  status?: DomainEntitiesFullProceduresTemplateQuestionRevisionStatus;
  wording?: string | null;
  answerType?: DomainEntitiesFullProceduresTemplateQuestionAnswerType;
  inputType?: string | null;
  unitOfMeasureId?: string | null;
  unitOfMeasureName?: string | null;
  options?: DomainEntitiesFullProceduresTemplateQuestionOptionDto[] | null;
  required?: boolean;
  helpText?: string | null;
  minimum?: number | null;
  maximum?: number | null;
  calculationReferences?:
    DomainEntitiesFullProceduresTemplateQuestionReferenceDto[] | null;
  sensitivity?: DomainEntitiesFullProceduresTemplateQuestionSensitivity;
  contentHash?: string | null;
  createdById?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  publishedById?: string | null;
  publishedAt?: string | null;
  retiredAt?: string | null;
};
export type DomainEntitiesFullProceduresTemplateQuestionDto = {
  id?: string;
  templateAreaId?: string;
  areaName?: string | null;
  purposeId?: string | null;
  subjectTypeId?: string | null;
  latestRevision?: DomainEntitiesFullProceduresTemplateQuestionRevisionDto;
};
export type DomainEntitiesFullProceduresTemplateQuestionDetailDto = {
  id?: string;
  templateAreaId?: string;
  areaName?: string | null;
  purposeId?: string | null;
  subjectTypeId?: string | null;
  revisions?: DomainEntitiesFullProceduresTemplateQuestionRevisionDto[] | null;
};
export type DomainEntitiesFullProceduresTemplateQuestionOptionRequest = {
  value?: string | null;
  label?: string | null;
};
export type DomainEntitiesFullProceduresTemplateQuestionReferenceRequest = {
  questionId?: string;
  revisionId?: string;
};
export type DomainEntitiesFullProceduresCreateTemplateQuestionRequest = {
  wording?: string | null;
  answerType?: DomainEntitiesFullProceduresTemplateQuestionAnswerType;
  inputType?: string | null;
  unitOfMeasureId?: string | null;
  options?: DomainEntitiesFullProceduresTemplateQuestionOptionRequest[] | null;
  required?: boolean;
  helpText?: string | null;
  minimum?: number | null;
  maximum?: number | null;
  calculationQuestionIds?: string[] | null;
  calculationReferences?:
    DomainEntitiesFullProceduresTemplateQuestionReferenceRequest[] | null;
  sensitivity?: DomainEntitiesFullProceduresTemplateQuestionSensitivity;
  templateAreaId?: string;
  purposeId?: string | null;
  subjectTypeId?: string | null;
  reason?: string | null;
};
export const {
  useGetApiV1TemplateAreasCatalogQuery,
  useLazyGetApiV1TemplateAreasCatalogQuery,
  useGetApiV1TemplateAreasQuery,
  useLazyGetApiV1TemplateAreasQuery,
  usePostApiV1TemplateAreasMutation,
  useGetApiV1TemplateAreasByIdQuery,
  useLazyGetApiV1TemplateAreasByIdQuery,
  usePutApiV1TemplateAreasByIdMutation,
  usePutApiV1TemplateAreasByIdActiveMutation,
  useGetApiV1TemplateQuestionsAreaByAreaIdQuery,
  useLazyGetApiV1TemplateQuestionsAreaByAreaIdQuery,
  useGetApiV1TemplateQuestionsByQuestionIdQuery,
  useLazyGetApiV1TemplateQuestionsByQuestionIdQuery,
  usePostApiV1TemplateQuestionsMutation,
} = injectedRtkApi;
