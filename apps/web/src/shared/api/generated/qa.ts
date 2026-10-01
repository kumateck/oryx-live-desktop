import { api } from "../base-api";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    postApiV1QaQualityAudits: build.mutation<
      PostApiV1QaQualityAuditsApiResponse,
      PostApiV1QaQualityAuditsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/quality-audits`,
        method: "POST",
        body: queryArg.domainEntitiesQualityAuditsCreateQualityAuditRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QaQualityAudits: build.query<
      GetApiV1QaQualityAuditsApiResponse,
      GetApiV1QaQualityAuditsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/quality-audits`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          status: queryArg.status,
          type: queryArg["type"],
        },
      }),
    }),
    putApiV1QaQualityAuditsById: build.mutation<
      PutApiV1QaQualityAuditsByIdApiResponse,
      PutApiV1QaQualityAuditsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/quality-audits/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesQualityAuditsUpdateQualityAuditRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QaQualityAuditsById: build.query<
      GetApiV1QaQualityAuditsByIdApiResponse,
      GetApiV1QaQualityAuditsByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/quality-audits/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1QaQualityAuditsByIdStart: build.mutation<
      PutApiV1QaQualityAuditsByIdStartApiResponse,
      PutApiV1QaQualityAuditsByIdStartApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/quality-audits/${queryArg.id}/start`,
        method: "PUT",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QaQualityAuditsByIdChecklistResponses: build.mutation<
      PostApiV1QaQualityAuditsByIdChecklistResponsesApiResponse,
      PostApiV1QaQualityAuditsByIdChecklistResponsesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/quality-audits/${queryArg.id}/checklist-responses`,
        method: "POST",
        body: queryArg.domainEntitiesQualityAuditsRecordChecklistResponseRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QaQualityAuditsByIdFindings: build.mutation<
      PostApiV1QaQualityAuditsByIdFindingsApiResponse,
      PostApiV1QaQualityAuditsByIdFindingsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/quality-audits/${queryArg.id}/findings`,
        method: "POST",
        body: queryArg.domainEntitiesQualityAuditsRaiseFindingRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1QaQualityAuditsFindingsByFindingIdCorrectiveAction: build.mutation<
      PostApiV1QaQualityAuditsFindingsByFindingIdCorrectiveActionApiResponse,
      PostApiV1QaQualityAuditsFindingsByFindingIdCorrectiveActionApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/quality-audits/findings/${queryArg.findingId}/corrective-action`,
        method: "POST",
        body: queryArg.domainEntitiesQualityAuditsRaiseCorrectiveActionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1QaQualityAuditsCorrectiveActionsByCapaIdStatus: build.mutation<
      PutApiV1QaQualityAuditsCorrectiveActionsByCapaIdStatusApiResponse,
      PutApiV1QaQualityAuditsCorrectiveActionsByCapaIdStatusApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/quality-audits/corrective-actions/${queryArg.capaId}/status`,
        method: "PUT",
        body: queryArg.domainEntitiesQualityAuditsUpdateCorrectiveActionStatusRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1QaQualityAuditsCorrectiveActionsByCapaIdVerifyEffectiveness:
      build.mutation<
        PutApiV1QaQualityAuditsCorrectiveActionsByCapaIdVerifyEffectivenessApiResponse,
        PutApiV1QaQualityAuditsCorrectiveActionsByCapaIdVerifyEffectivenessApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/qa/quality-audits/corrective-actions/${queryArg.capaId}/verify-effectiveness`,
          method: "PUT",
          body: queryArg.domainEntitiesQualityAuditsVerifyCorrectiveActionEffectivenessRequest,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    putApiV1QaQualityAuditsByIdSubmitForClosure: build.mutation<
      PutApiV1QaQualityAuditsByIdSubmitForClosureApiResponse,
      PutApiV1QaQualityAuditsByIdSubmitForClosureApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/quality-audits/${queryArg.id}/submit-for-closure`,
        method: "PUT",
        body: queryArg.domainEntitiesQualityAuditsSubmitAuditForClosureRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1QaQualityAuditsByIdClose: build.mutation<
      PutApiV1QaQualityAuditsByIdCloseApiResponse,
      PutApiV1QaQualityAuditsByIdCloseApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/quality-audits/${queryArg.id}/close`,
        method: "PUT",
        body: queryArg.domainEntitiesQualityAuditsCloseQualityAuditRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1QaQualityAuditsChecklistTemplates: build.query<
      GetApiV1QaQualityAuditsChecklistTemplatesApiResponse,
      GetApiV1QaQualityAuditsChecklistTemplatesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/qa/quality-audits/checklist-templates`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as qaApi };
export type PostApiV1QaQualityAuditsApiResponse = /** status 200 OK */ string;
export type PostApiV1QaQualityAuditsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQualityAuditsCreateQualityAuditRequest: DomainEntitiesQualityAuditsCreateQualityAuditRequest;
};
export type GetApiV1QaQualityAuditsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesQualityAuditsQualityAuditDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1QaQualityAuditsApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  status?: DomainEntitiesQualityAuditsAuditStatus;
  type?: DomainEntitiesQualityAuditsAuditType;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1QaQualityAuditsByIdApiResponse = void;
export type PutApiV1QaQualityAuditsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQualityAuditsUpdateQualityAuditRequest: DomainEntitiesQualityAuditsUpdateQualityAuditRequest;
};
export type GetApiV1QaQualityAuditsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesQualityAuditsQualityAuditDto;
export type GetApiV1QaQualityAuditsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1QaQualityAuditsByIdStartApiResponse = void;
export type PutApiV1QaQualityAuditsByIdStartApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1QaQualityAuditsByIdChecklistResponsesApiResponse =
  /** status 200 OK */ string;
export type PostApiV1QaQualityAuditsByIdChecklistResponsesApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQualityAuditsRecordChecklistResponseRequest: DomainEntitiesQualityAuditsRecordChecklistResponseRequest;
};
export type PostApiV1QaQualityAuditsByIdFindingsApiResponse =
  /** status 200 OK */ string;
export type PostApiV1QaQualityAuditsByIdFindingsApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQualityAuditsRaiseFindingRequest: DomainEntitiesQualityAuditsRaiseFindingRequest;
};
export type PostApiV1QaQualityAuditsFindingsByFindingIdCorrectiveActionApiResponse =
  /** status 200 OK */ string;
export type PostApiV1QaQualityAuditsFindingsByFindingIdCorrectiveActionApiArg =
  {
    findingId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
    domainEntitiesQualityAuditsRaiseCorrectiveActionRequest: DomainEntitiesQualityAuditsRaiseCorrectiveActionRequest;
  };
export type PutApiV1QaQualityAuditsCorrectiveActionsByCapaIdStatusApiResponse = void;
export type PutApiV1QaQualityAuditsCorrectiveActionsByCapaIdStatusApiArg = {
  capaId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQualityAuditsUpdateCorrectiveActionStatusRequest: DomainEntitiesQualityAuditsUpdateCorrectiveActionStatusRequest;
};
export type PutApiV1QaQualityAuditsCorrectiveActionsByCapaIdVerifyEffectivenessApiResponse = void;
export type PutApiV1QaQualityAuditsCorrectiveActionsByCapaIdVerifyEffectivenessApiArg =
  {
    capaId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
    domainEntitiesQualityAuditsVerifyCorrectiveActionEffectivenessRequest: DomainEntitiesQualityAuditsVerifyCorrectiveActionEffectivenessRequest;
  };
export type PutApiV1QaQualityAuditsByIdSubmitForClosureApiResponse = void;
export type PutApiV1QaQualityAuditsByIdSubmitForClosureApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQualityAuditsSubmitAuditForClosureRequest: DomainEntitiesQualityAuditsSubmitAuditForClosureRequest;
};
export type PutApiV1QaQualityAuditsByIdCloseApiResponse = void;
export type PutApiV1QaQualityAuditsByIdCloseApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesQualityAuditsCloseQualityAuditRequest: DomainEntitiesQualityAuditsCloseQualityAuditRequest;
};
export type GetApiV1QaQualityAuditsChecklistTemplatesApiResponse =
  /** status 200 OK */ DomainEntitiesQualityAuditsAuditChecklistTemplateDto[];
export type GetApiV1QaQualityAuditsChecklistTemplatesApiArg = {
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
export type DomainEntitiesQualityAuditsAuditType = 0 | 1 | 2;
export type DomainEntitiesQualityAuditsAuditFocus = 0 | 1 | 2;
export type DomainEntitiesQualityAuditsCreateQualityAuditRequest = {
  type: DomainEntitiesQualityAuditsAuditType;
  focusArea: DomainEntitiesQualityAuditsAuditFocus;
  title: string;
  scope: string;
  objectiveNotes?: string | null;
  scheduledStartDate: string;
  scheduledEndDate: string;
  leadAuditorId: string;
  teamMemberIds?: string[] | null;
  productionOrderId?: string | null;
  materialId?: string | null;
  productId?: string | null;
  supplierId?: string | null;
  checklistTemplateId?: string | null;
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
export type DomainEntitiesAttachmentsAttachmentDto = {
  link?: string | null;
  name?: string | null;
  id?: string;
  reference?: string | null;
};
export type DomainEntitiesQualityAuditsAuditStatus = 0 | 1 | 2 | 3 | 4 | 5;
export type DomainEntitiesQualityAuditsChecklistResponseStatus = 0 | 1 | 2 | 3;
export type DomainEntitiesQualityAuditsAuditChecklistResponseDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
  qualityAuditId?: string;
  templateItemId?: string | null;
  sectionName?: string | null;
  questionText?: string | null;
  adHocQuestionText?: string | null;
  responseStatus?: DomainEntitiesQualityAuditsChecklistResponseStatus;
  comments?: string | null;
  respondedBy?: DomainEntitiesUsersUserDto;
  respondedAt?: string | null;
};
export type DomainEntitiesQualityAuditsFindingSeverity = 0 | 1 | 2 | 3;
export type DomainEntitiesQualityAuditsFindingStatus = 0 | 1 | 2;
export type DomainEntitiesQualityAuditsCapaStatus = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesQualityAuditsAuditCorrectiveActionDto = {
  id?: string;
  auditFindingId?: string;
  rootCauseAnalysis?: string | null;
  correctiveActions?: string | null;
  preventiveActions?: string | null;
  responsiblePerson?: DomainEntitiesUsersUserDto;
  dueDate?: string;
  status?: DomainEntitiesQualityAuditsCapaStatus;
  effectivenessCheckNotes?: string | null;
  effectivenessVerifiedBy?: DomainEntitiesUsersUserDto;
  effectivenessVerifiedAt?: string | null;
  closedAt?: string | null;
};
export type DomainEntitiesQualityAuditsAuditFindingDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
  qualityAuditId?: string;
  checklistResponseId?: string | null;
  title?: string | null;
  description?: string | null;
  severity?: DomainEntitiesQualityAuditsFindingSeverity;
  areaOrClause?: string | null;
  raisedBy?: DomainEntitiesUsersUserDto;
  raisedAt?: string;
  status?: DomainEntitiesQualityAuditsFindingStatus;
  correctiveAction?: DomainEntitiesQualityAuditsAuditCorrectiveActionDto;
};
export type DomainEntitiesQualityAuditsQualityAuditDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
  auditNumber?: string | null;
  type?: DomainEntitiesQualityAuditsAuditType;
  focusArea?: DomainEntitiesQualityAuditsAuditFocus;
  title?: string | null;
  scope?: string | null;
  objectiveNotes?: string | null;
  status?: DomainEntitiesQualityAuditsAuditStatus;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  leadAuditor?: DomainEntitiesUsersUserDto;
  teamMembers?: DomainEntitiesUsersUserDto[] | null;
  productionOrderId?: string | null;
  materialId?: string | null;
  productId?: string | null;
  supplierId?: string | null;
  checklistTemplateId?: string | null;
  checklistTemplateName?: string | null;
  checklistResponses?:
    DomainEntitiesQualityAuditsAuditChecklistResponseDto[] | null;
  findings?: DomainEntitiesQualityAuditsAuditFindingDto[] | null;
  closingMeetingNotes?: string | null;
  closedAt?: string | null;
  closedBy?: DomainEntitiesUsersUserDto;
  isVerified?: boolean;
  verifiedAt?: string | null;
  verifiedBy?: DomainEntitiesUsersUserDto;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesQualityAuditsQualityAuditDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesQualityAuditsQualityAuditDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesQualityAuditsUpdateQualityAuditRequest = {
  title: string;
  scope: string;
  objectiveNotes?: string | null;
  scheduledStartDate: string;
  scheduledEndDate: string;
  leadAuditorId: string;
  teamMemberIds?: string[] | null;
};
export type DomainEntitiesQualityAuditsRecordChecklistResponseRequest = {
  templateItemId?: string | null;
  adHocQuestionText?: string | null;
  responseStatus: DomainEntitiesQualityAuditsChecklistResponseStatus;
  comments?: string | null;
};
export type DomainEntitiesQualityAuditsRaiseFindingRequest = {
  checklistResponseId?: string | null;
  title: string;
  description: string;
  severity: DomainEntitiesQualityAuditsFindingSeverity;
  areaOrClause?: string | null;
};
export type DomainEntitiesQualityAuditsRaiseCorrectiveActionRequest = {
  rootCauseAnalysis: string;
  correctiveActions: string;
  preventiveActions?: string | null;
  responsiblePersonId: string;
  dueDate: string;
};
export type DomainEntitiesQualityAuditsUpdateCorrectiveActionStatusRequest = {
  status: DomainEntitiesQualityAuditsCapaStatus;
};
export type DomainEntitiesQualityAuditsVerifyCorrectiveActionEffectivenessRequest =
  {
    effective: boolean;
    effectivenessCheckNotes?: string | null;
  };
export type DomainEntitiesQualityAuditsSubmitAuditForClosureRequest = {
  closingMeetingNotes?: string | null;
  acceptOpenCapaDeferral?: boolean;
  deferralJustification?: string | null;
};
export type DomainEntitiesQualityAuditsCloseQualityAuditRequest = {
  approve: boolean;
  comments?: string | null;
};
export type DomainEntitiesQualityAuditsAuditChecklistTemplateItemDto = {
  id?: string;
  sectionName?: string | null;
  questionText?: string | null;
  isRequired?: boolean;
  order?: number;
};
export type DomainEntitiesQualityAuditsAuditChecklistTemplateDto = {
  id?: string;
  name?: string | null;
  description?: string | null;
  items?: DomainEntitiesQualityAuditsAuditChecklistTemplateItemDto[] | null;
};
export const {
  usePostApiV1QaQualityAuditsMutation,
  useGetApiV1QaQualityAuditsQuery,
  useLazyGetApiV1QaQualityAuditsQuery,
  usePutApiV1QaQualityAuditsByIdMutation,
  useGetApiV1QaQualityAuditsByIdQuery,
  useLazyGetApiV1QaQualityAuditsByIdQuery,
  usePutApiV1QaQualityAuditsByIdStartMutation,
  usePostApiV1QaQualityAuditsByIdChecklistResponsesMutation,
  usePostApiV1QaQualityAuditsByIdFindingsMutation,
  usePostApiV1QaQualityAuditsFindingsByFindingIdCorrectiveActionMutation,
  usePutApiV1QaQualityAuditsCorrectiveActionsByCapaIdStatusMutation,
  usePutApiV1QaQualityAuditsCorrectiveActionsByCapaIdVerifyEffectivenessMutation,
  usePutApiV1QaQualityAuditsByIdSubmitForClosureMutation,
  usePutApiV1QaQualityAuditsByIdCloseMutation,
  useGetApiV1QaQualityAuditsChecklistTemplatesQuery,
  useLazyGetApiV1QaQualityAuditsChecklistTemplatesQuery,
} = injectedRtkApi;
