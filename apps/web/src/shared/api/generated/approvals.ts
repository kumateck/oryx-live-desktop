import { api } from "../base-api";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getApiV1ApprovalUsersWithPending: build.query<
      GetApiV1ApprovalUsersWithPendingApiResponse,
      GetApiV1ApprovalUsersWithPendingApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/approval/users-with-pending`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1Approval: build.mutation<
      PostApiV1ApprovalApiResponse,
      PostApiV1ApprovalApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/approval`,
        method: "POST",
        body: queryArg.domainEntitiesApprovalsCreateApprovalRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1Approval: build.query<
      GetApiV1ApprovalApiResponse,
      GetApiV1ApprovalApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/approval`,
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
    postApiV1ApprovalDelegate: build.mutation<
      PostApiV1ApprovalDelegateApiResponse,
      PostApiV1ApprovalDelegateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/approval/delegate`,
        method: "POST",
        body: queryArg.domainEntitiesApprovalsDelegateApproval,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ApprovalTransferRights: build.mutation<
      PostApiV1ApprovalTransferRightsApiResponse,
      PostApiV1ApprovalTransferRightsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/approval/transfer-rights`,
        method: "POST",
        body: queryArg.domainEntitiesApprovalsTransferApprovalRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ApprovalByApprovalId: build.query<
      GetApiV1ApprovalByApprovalIdApiResponse,
      GetApiV1ApprovalByApprovalIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/approval/${queryArg.approvalId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ApprovalByApprovalId: build.mutation<
      PutApiV1ApprovalByApprovalIdApiResponse,
      PutApiV1ApprovalByApprovalIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/approval/${queryArg.approvalId}`,
        method: "PUT",
        body: queryArg.domainEntitiesApprovalsCreateApprovalRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ApprovalByApprovalId: build.mutation<
      DeleteApiV1ApprovalByApprovalIdApiResponse,
      DeleteApiV1ApprovalByApprovalIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/approval/${queryArg.approvalId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ApprovalByModelTypeAndModelId: build.query<
      GetApiV1ApprovalByModelTypeAndModelIdApiResponse,
      GetApiV1ApprovalByModelTypeAndModelIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/approval/${queryArg.modelType}/${queryArg.modelId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ApprovalMyPendingByModelTypeAndModelId: build.query<
      GetApiV1ApprovalMyPendingByModelTypeAndModelIdApiResponse,
      GetApiV1ApprovalMyPendingByModelTypeAndModelIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/approval/my-pending/${queryArg.modelType}/${queryArg.modelId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ApprovalApproveByModelTypeAndModelId: build.mutation<
      PostApiV1ApprovalApproveByModelTypeAndModelIdApiResponse,
      PostApiV1ApprovalApproveByModelTypeAndModelIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/approval/approve/${queryArg.modelType}/${queryArg.modelId}`,
        method: "POST",
        body: queryArg.domainEntitiesApprovalsApprovalRequestBody,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ApprovalRejectByModelTypeAndModelId: build.mutation<
      PostApiV1ApprovalRejectByModelTypeAndModelIdApiResponse,
      PostApiV1ApprovalRejectByModelTypeAndModelIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/approval/reject/${queryArg.modelType}/${queryArg.modelId}`,
        method: "POST",
        body: queryArg.domainEntitiesApprovalsApprovalRequestBody,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ApprovalMyPending: build.query<
      GetApiV1ApprovalMyPendingApiResponse,
      GetApiV1ApprovalMyPendingApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/approval/my-pending`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          modelType: queryArg.modelType,
          userId: queryArg.userId,
        },
      }),
    }),
    getApiV1ApprovalMyPendingStats: build.query<
      GetApiV1ApprovalMyPendingStatsApiResponse,
      GetApiV1ApprovalMyPendingStatsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/approval/my-pending/stats`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ApprovalMyPendingDocumentCounts: build.query<
      GetApiV1ApprovalMyPendingDocumentCountsApiResponse,
      GetApiV1ApprovalMyPendingDocumentCountsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/approval/my-pending/document-counts`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ApprovalMyPendingRevisions: build.query<
      GetApiV1ApprovalMyPendingRevisionsApiResponse,
      GetApiV1ApprovalMyPendingRevisionsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/approval/my-pending/revisions`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          approvalDocument: queryArg.approvalDocument,
        },
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as approvalsApi };
export type GetApiV1ApprovalUsersWithPendingApiResponse =
  /** status 200 OK */ DomainEntitiesUsersUserDto[];
export type GetApiV1ApprovalUsersWithPendingApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ApprovalApiResponse = /** status 201 Created */ string;
export type PostApiV1ApprovalApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesApprovalsCreateApprovalRequest: DomainEntitiesApprovalsCreateApprovalRequest;
};
export type GetApiV1ApprovalApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesApprovalsApprovalDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ApprovalApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ApprovalDelegateApiResponse =
  /** status 204 No Content */ DomainEntitiesApprovalsDelegateApprovalDto;
export type PostApiV1ApprovalDelegateApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesApprovalsDelegateApproval: DomainEntitiesApprovalsDelegateApproval;
};
export type PostApiV1ApprovalTransferRightsApiResponse = void;
export type PostApiV1ApprovalTransferRightsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesApprovalsTransferApprovalRequest: DomainEntitiesApprovalsTransferApprovalRequest;
};
export type GetApiV1ApprovalByApprovalIdApiResponse =
  /** status 200 OK */ DomainEntitiesApprovalsApprovalDto;
export type GetApiV1ApprovalByApprovalIdApiArg = {
  approvalId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ApprovalByApprovalIdApiResponse = void;
export type PutApiV1ApprovalByApprovalIdApiArg = {
  approvalId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesApprovalsCreateApprovalRequest: DomainEntitiesApprovalsCreateApprovalRequest;
};
export type DeleteApiV1ApprovalByApprovalIdApiResponse = void;
export type DeleteApiV1ApprovalByApprovalIdApiArg = {
  approvalId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ApprovalByModelTypeAndModelIdApiResponse =
  /** status 200 OK */ DomainEntitiesApprovalsApprovalEntity;
export type GetApiV1ApprovalByModelTypeAndModelIdApiArg = {
  modelType: string;
  modelId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ApprovalMyPendingByModelTypeAndModelIdApiResponse =
  /** status 200 OK */ DomainEntitiesApprovalsApprovalEntity;
export type GetApiV1ApprovalMyPendingByModelTypeAndModelIdApiArg = {
  modelType: string;
  modelId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ApprovalApproveByModelTypeAndModelIdApiResponse = void;
export type PostApiV1ApprovalApproveByModelTypeAndModelIdApiArg = {
  modelType: string;
  modelId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesApprovalsApprovalRequestBody: DomainEntitiesApprovalsApprovalRequestBody;
};
export type PostApiV1ApprovalRejectByModelTypeAndModelIdApiResponse = void;
export type PostApiV1ApprovalRejectByModelTypeAndModelIdApiArg = {
  modelType: string;
  modelId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesApprovalsApprovalRequestBody: DomainEntitiesApprovalsApprovalRequestBody;
};
export type GetApiV1ApprovalMyPendingApiResponse =
  /** status 200 OK */ DomainEntitiesApprovalsApprovalEntity[];
export type GetApiV1ApprovalMyPendingApiArg = {
  modelType?: string;
  userId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ApprovalMyPendingStatsApiResponse = /** status 200 OK */ {
  [key: string]: number;
};
export type GetApiV1ApprovalMyPendingStatsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ApprovalMyPendingDocumentCountsApiResponse =
  /** status 200 OK */ {
    [key: string]: number;
  };
export type GetApiV1ApprovalMyPendingDocumentCountsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ApprovalMyPendingRevisionsApiResponse =
  /** status 200 OK */ AppServicesApprovalsPendingRevisionApprovalDto[];
export type GetApiV1ApprovalMyPendingRevisionsApiArg = {
  approvalDocument?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
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
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue | undefined };
export type MicrosoftAspNetCoreMvcProblemDetails = {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  [key: string]: JsonValue | undefined;
};
export type DomainEntitiesApprovalsCreateApprovalStageRequest = {
  userId?: string | null;
  roleId?: string | null;
  required?: boolean;
  order?: number;
};
export type DomainEntitiesApprovalsCreateApprovalRequest = {
  itemType?: string | null;
  escalationDuration?: string;
  approvalStages?: DomainEntitiesApprovalsCreateApprovalStageRequest[] | null;
};
export type DomainEntitiesApprovalsApprovalStageDto = {
  user?: SharedCollectionItemDto;
  role?: SharedCollectionItemDto;
  required?: boolean;
  order?: number;
};
export type DomainEntitiesApprovalsApprovalDto = {
  id?: string;
  itemType?: string | null;
  escalationDuration?: string;
  approvalStages?: DomainEntitiesApprovalsApprovalStageDto[] | null;
  createdBy?: SharedCollectionItemDto;
  createdAt?: string;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesApprovalsApprovalDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesApprovalsApprovalDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesAttachmentsAttachmentDto = {
  link?: string | null;
  name?: string | null;
  id?: string;
  reference?: string | null;
};
export type DomainEntitiesEmployeesGender = 0 | 1;
export type DomainEntitiesEmployeesMaritalStatus = 0 | 1;
export type DomainEntitiesEmployeesReligion = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type DomainEntitiesEmployeesEmployeeType = 0 | 1;
export type DomainEntitiesWarehousesWarehouseType = 0 | 1 | 2 | 3;
export type DomainEntitiesWarehousesWarehouseDto = {
  id?: string;
  name?: string | null;
  description?: string | null;
  type?: DomainEntitiesWarehousesWarehouseType;
  division?: DomainEntitiesProductsDivision;
  locations?: SharedCollectionItemDto[] | null;
};
export type DomainEntitiesDepartmentsDepartmentDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  name?: string | null;
  type?: SharedDepartmentType;
  description?: string | null;
  warehouses?: DomainEntitiesWarehousesWarehouseDto[] | null;
  division?: DomainEntitiesProductsDivision;
  parentDepartment?: SharedCollectionItemDto;
  isSeeded?: boolean;
};
export type DomainEntitiesDesignationsDesignationDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  description?: string | null;
  maximumLeaveDays?: number;
  departments?: DomainEntitiesDepartmentsDepartmentDto[] | null;
  employees?: DomainEntitiesEmployeesEmployeeDto[] | null;
};
export type DomainEntitiesPersonsLifeStatus = 0 | 1;
export type DomainEntitiesPersonsPersonDto = {
  fullName?: string | null;
  phoneNumber?: string | null;
  occupation?: string | null;
  lifeStatus?: DomainEntitiesPersonsLifeStatus;
};
export type DomainEntitiesEmergencyContactsEmergencyContactDto = {
  fullName?: string | null;
  contactNumber?: string | null;
  relationship?: string | null;
  residentialAddress?: string | null;
};
export type DomainEntitiesChildrenChildDto = {
  fullName?: string | null;
  dateOfBirth?: string;
  gender?: DomainEntitiesEmployeesGender;
};
export type DomainEntitiesSiblingsSiblingDto = {
  fullName?: string | null;
  contact?: string | null;
  gender?: DomainEntitiesEmployeesGender;
};
export type DomainEntitiesEducationHistoriesEducationDto = {
  schoolName?: string | null;
  startDate?: string;
  endDate?: string;
  major?: string | null;
  qualificationEarned?: string | null;
};
export type DomainEntitiesEmployeeHistoriesEmploymentHistoryDto = {
  companyName?: string | null;
  startDate?: string;
  endDate?: string;
  position?: string | null;
};
export type DomainEntitiesEmployeesEmployeeLevel = 0 | 1 | 2;
export type DomainEntitiesEmployeesEmployeeStatus = 0 | 1 | 2;
export type DomainEntitiesEmployeesEmployeeActiveStatus = 0 | 1 | 2 | 3;
export type DomainEntitiesEmployeesEmployeeInactiveStatus =
  0 | 1 | 2 | 3 | 4 | 5;
export type DomainEntitiesEmployeesEmployeeDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  dateOfBirth?: string;
  gender?: DomainEntitiesEmployeesGender;
  residentialAddress?: string | null;
  annualLeaveDays?: number;
  nationality?: string | null;
  bankAccountNumber?: string | null;
  ssnitNumber?: string | null;
  ghanaCardNumber?: string | null;
  region?: string | null;
  maritalStatus?: DomainEntitiesEmployeesMaritalStatus;
  religion?: DomainEntitiesEmployeesReligion;
  staffNumber?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  type?: DomainEntitiesEmployeesEmployeeType;
  dateEmployed?: string;
  designation?: DomainEntitiesDesignationsDesignationDto;
  department?: DomainEntitiesDepartmentsDepartmentDto;
  reportingManagerId?: string | null;
  reportingManager?: DomainEntitiesUsersUserDto;
  mother?: DomainEntitiesPersonsPersonDto;
  father?: DomainEntitiesPersonsPersonDto;
  spouse?: DomainEntitiesPersonsPersonDto;
  emergencyContact?: DomainEntitiesEmergencyContactsEmergencyContactDto;
  nextOfKin?: DomainEntitiesEmergencyContactsEmergencyContactDto;
  children?: DomainEntitiesChildrenChildDto[] | null;
  siblings?: DomainEntitiesSiblingsSiblingDto[] | null;
  educationBackground?: DomainEntitiesEducationHistoriesEducationDto[] | null;
  employmentHistory?:
    DomainEntitiesEmployeeHistoriesEmploymentHistoryDto[] | null;
  level?: DomainEntitiesEmployeesEmployeeLevel;
  status?: DomainEntitiesEmployeesEmployeeStatus;
  activeStatus?: DomainEntitiesEmployeesEmployeeActiveStatus;
  inactiveStatus?: DomainEntitiesEmployeesEmployeeInactiveStatus;
  suspensionStartDate?: string | null;
  suspensionEndDate?: string | null;
};
export type DomainEntitiesApprovalsDelegateApprovalDto = {
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  employee?: DomainEntitiesEmployeesEmployeeDto;
};
export type DomainEntitiesApprovalsDelegateApproval = {
  startDate: string;
  endDate: string;
  employeeId: string;
};
export type DomainEntitiesApprovalsTransferApprovalRequest = {
  fromUserId: string;
  toUserId: string;
};
export type DomainEntitiesApprovalsApprovalStatus = 0 | 1 | 2;
export type DomainEntitiesApprovalsApprovalLog = {
  user?: SharedCollectionItemDto;
  approvedAt?: string | null;
  status?: DomainEntitiesApprovalsApprovalStatus;
  comments?: string | null;
};
export type DomainEntitiesApprovalsApprovalEntity = {
  id?: string;
  supplierId?: string | null;
  code?: string | null;
  modelType?: string | null;
  department?: DomainEntitiesDepartmentsDepartmentDto;
  approvalLogs?: DomainEntitiesApprovalsApprovalLog[] | null;
  createdAt?: string;
  materialBatchId?: string | null;
  batchManufacturingRecordId?: string | null;
  productionActivityStepId?: string | null;
  requestedBy?: DomainEntitiesUsersUserDto;
};
export type DomainEntitiesApprovalsApprovalRequestBody = {
  comments?: string | null;
};
export type AppServicesApprovalsPendingRevisionApprovalDto = {
  revisionId?: string;
  resourceId?: string;
  resourceType?: string | null;
  action?: string | null;
  label?: string | null;
  contentHash?: string | null;
  createdAt?: string;
  resourcePath?: string | null;
};
export const {
  useGetApiV1ApprovalUsersWithPendingQuery,
  useLazyGetApiV1ApprovalUsersWithPendingQuery,
  usePostApiV1ApprovalMutation,
  useGetApiV1ApprovalQuery,
  useLazyGetApiV1ApprovalQuery,
  usePostApiV1ApprovalDelegateMutation,
  usePostApiV1ApprovalTransferRightsMutation,
  useGetApiV1ApprovalByApprovalIdQuery,
  useLazyGetApiV1ApprovalByApprovalIdQuery,
  usePutApiV1ApprovalByApprovalIdMutation,
  useDeleteApiV1ApprovalByApprovalIdMutation,
  useGetApiV1ApprovalByModelTypeAndModelIdQuery,
  useLazyGetApiV1ApprovalByModelTypeAndModelIdQuery,
  useGetApiV1ApprovalMyPendingByModelTypeAndModelIdQuery,
  useLazyGetApiV1ApprovalMyPendingByModelTypeAndModelIdQuery,
  usePostApiV1ApprovalApproveByModelTypeAndModelIdMutation,
  usePostApiV1ApprovalRejectByModelTypeAndModelIdMutation,
  useGetApiV1ApprovalMyPendingQuery,
  useLazyGetApiV1ApprovalMyPendingQuery,
  useGetApiV1ApprovalMyPendingStatsQuery,
  useLazyGetApiV1ApprovalMyPendingStatsQuery,
  useGetApiV1ApprovalMyPendingDocumentCountsQuery,
  useLazyGetApiV1ApprovalMyPendingDocumentCountsQuery,
  useGetApiV1ApprovalMyPendingRevisionsQuery,
  useLazyGetApiV1ApprovalMyPendingRevisionsQuery,
} = injectedRtkApi;
