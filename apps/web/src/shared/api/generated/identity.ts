import { api } from "../base-api";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    postApiV1Department: build.mutation<
      PostApiV1DepartmentApiResponse,
      PostApiV1DepartmentApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/department`,
        method: "POST",
        body: queryArg.domainEntitiesDepartmentsRequestCreateDepartmentRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1Department: build.query<
      GetApiV1DepartmentApiResponse,
      GetApiV1DepartmentApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/department`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          type: queryArg["type"],
        },
      }),
    }),
    getApiV1DepartmentByDepartmentId: build.query<
      GetApiV1DepartmentByDepartmentIdApiResponse,
      GetApiV1DepartmentByDepartmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/department/${queryArg.departmentId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1DepartmentByDepartmentId: build.mutation<
      PutApiV1DepartmentByDepartmentIdApiResponse,
      PutApiV1DepartmentByDepartmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/department/${queryArg.departmentId}`,
        method: "PUT",
        body: queryArg.domainEntitiesDepartmentsRequestCreateDepartmentRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1DepartmentByDepartmentId: build.mutation<
      DeleteApiV1DepartmentByDepartmentIdApiResponse,
      DeleteApiV1DepartmentByDepartmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/department/${queryArg.departmentId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1PermissionModules: build.query<
      GetApiV1PermissionModulesApiResponse,
      GetApiV1PermissionModulesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/permission/modules`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1Permission: build.query<
      GetApiV1PermissionApiResponse,
      GetApiV1PermissionApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/permission`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1PermissionUserByUserId: build.query<
      GetApiV1PermissionUserByUserIdApiResponse,
      GetApiV1PermissionUserByUserIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/permission/user/${queryArg.userId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1PermissionRoleByRoleId: build.query<
      GetApiV1PermissionRoleByRoleIdApiResponse,
      GetApiV1PermissionRoleByRoleIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/permission/role/${queryArg.roleId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1PermissionRoleByRoleId: build.mutation<
      PutApiV1PermissionRoleByRoleIdApiResponse,
      PutApiV1PermissionRoleByRoleIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/permission/role/${queryArg.roleId}`,
        method: "PUT",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1PermissionMenu: build.query<
      GetApiV1PermissionMenuApiResponse,
      GetApiV1PermissionMenuApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/permission/menu`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1Role: build.query<GetApiV1RoleApiResponse, GetApiV1RoleApiArg>({
      query: (queryArg) => ({
        url: `/api/v1/role`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1Role: build.mutation<
      PostApiV1RoleApiResponse,
      PostApiV1RoleApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/role`,
        method: "POST",
        body: queryArg.domainEntitiesRolesCreateRoleRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1RoleWithPermissions: build.query<
      GetApiV1RoleWithPermissionsApiResponse,
      GetApiV1RoleWithPermissionsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/role/with-permissions`,
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
    getApiV1RoleById: build.query<
      GetApiV1RoleByIdApiResponse,
      GetApiV1RoleByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/role/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1RoleById: build.mutation<
      PutApiV1RoleByIdApiResponse,
      PutApiV1RoleByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/role/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesRolesUpdateRoleRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1RoleById: build.mutation<
      DeleteApiV1RoleByIdApiResponse,
      DeleteApiV1RoleByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/role/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1RoleCheckById: build.query<
      GetApiV1RoleCheckByIdApiResponse,
      GetApiV1RoleCheckByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/role/check/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1User: build.query<GetApiV1UserApiResponse, GetApiV1UserApiArg>({
      query: (queryArg) => ({
        url: `/api/v1/user`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          isActive: queryArg.isActive,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
        },
      }),
    }),
    getApiV1UserByPermission: build.query<
      GetApiV1UserByPermissionApiResponse,
      GetApiV1UserByPermissionApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/user/by-permission`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          permissionKey: queryArg.permissionKey,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
        },
      }),
    }),
    getApiV1UserAuthenticated: build.query<
      GetApiV1UserAuthenticatedApiResponse,
      GetApiV1UserAuthenticatedApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/user/authenticated`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1UserRoleByRoleId: build.query<
      GetApiV1UserRoleByRoleIdApiResponse,
      GetApiV1UserRoleByRoleIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/user/role/${queryArg.roleId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    putApiV1UserById: build.mutation<
      PutApiV1UserByIdApiResponse,
      PutApiV1UserByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/user/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesUsersRequestUpdateUserRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1UserById: build.mutation<
      DeleteApiV1UserByIdApiResponse,
      DeleteApiV1UserByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/user/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1UserRoleById: build.mutation<
      PutApiV1UserRoleByIdApiResponse,
      PutApiV1UserRoleByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/user/role/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesRolesUpdateUserRoleRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1UserAvatarById: build.mutation<
      PostApiV1UserAvatarByIdApiResponse,
      PostApiV1UserAvatarByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/user/avatar/${queryArg.id}`,
        method: "POST",
        body: queryArg.sharedRequestsUploadFileRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1UserSignatureById: build.mutation<
      PostApiV1UserSignatureByIdApiResponse,
      PostApiV1UserSignatureByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/user/signature/${queryArg.id}`,
        method: "POST",
        body: queryArg.sharedRequestsUploadFileRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1UserToggleDisableById: build.mutation<
      PutApiV1UserToggleDisableByIdApiResponse,
      PutApiV1UserToggleDisableByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/user/toggle-disable/${queryArg.id}`,
        method: "PUT",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as identityApi };
export type PostApiV1DepartmentApiResponse = /** status 200 OK */ string;
export type PostApiV1DepartmentApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateDepartmentRequest object. */
  domainEntitiesDepartmentsRequestCreateDepartmentRequest: DomainEntitiesDepartmentsRequestCreateDepartmentRequest;
};
export type GetApiV1DepartmentApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesDepartmentsDepartmentDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1DepartmentApiArg = {
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** Search query for filtering results. */
  searchQuery?: string;
  /** The type of the department. (Product or Non Product Department) */
  type?: SharedDepartmentType;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1DepartmentByDepartmentIdApiResponse =
  /** status 200 OK */ DomainEntitiesDepartmentsDepartmentDto;
export type GetApiV1DepartmentByDepartmentIdApiArg = {
  /** The ID of the department. */
  departmentId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1DepartmentByDepartmentIdApiResponse = void;
export type PutApiV1DepartmentByDepartmentIdApiArg = {
  /** The ID of the department to update. */
  departmentId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateDepartmentRequest object. */
  domainEntitiesDepartmentsRequestCreateDepartmentRequest: DomainEntitiesDepartmentsRequestCreateDepartmentRequest;
};
export type DeleteApiV1DepartmentByDepartmentIdApiResponse = void;
export type DeleteApiV1DepartmentByDepartmentIdApiArg = {
  /** The ID of the department to delete. */
  departmentId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1PermissionModulesApiResponse =
  /** status 200 OK */ DomainEntitiesPermissionsPermissionModuleDto[];
export type GetApiV1PermissionModulesApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1PermissionApiResponse =
  /** status 200 OK */ DomainEntitiesPermissionsPermissionDto[];
export type GetApiV1PermissionApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1PermissionUserByUserIdApiResponse =
  /** status 200 OK */ DomainEntitiesPermissionsPermissionModuleDto[];
export type GetApiV1PermissionUserByUserIdApiArg = {
  /** The user ID. */
  userId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1PermissionRoleByRoleIdApiResponse =
  /** status 200 OK */ DomainEntitiesPermissionsPermissionModuleDto[];
export type GetApiV1PermissionRoleByRoleIdApiArg = {
  /** The role ID. */
  roleId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1PermissionRoleByRoleIdApiResponse = void;
export type PutApiV1PermissionRoleByRoleIdApiArg = {
  /** The role ID. */
  roleId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** List of permission identifiers. */
  body: DomainEntitiesPermissionsPermissionModuleDto[];
};
export type GetApiV1PermissionMenuApiResponse =
  /** status 200 OK */ AppUtilsMenuItem[];
export type GetApiV1PermissionMenuApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1RoleApiResponse =
  /** status 200 OK */ DomainEntitiesRolesRoleDto[];
export type GetApiV1RoleApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1RoleApiResponse = void;
export type PostApiV1RoleApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesRolesCreateRoleRequest: DomainEntitiesRolesCreateRoleRequest;
};
export type GetApiV1RoleWithPermissionsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRolesRolePermissionDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1RoleWithPermissionsApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1RoleByIdApiResponse =
  /** status 200 OK */ DomainEntitiesRolesRolePermissionDto;
export type GetApiV1RoleByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1RoleByIdApiResponse = void;
export type PutApiV1RoleByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesRolesUpdateRoleRequest: DomainEntitiesRolesUpdateRoleRequest;
};
export type DeleteApiV1RoleByIdApiResponse = void;
export type DeleteApiV1RoleByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1RoleCheckByIdApiResponse =
  /** status 200 OK */ DomainEntitiesRolesRoleUsageDto;
export type GetApiV1RoleCheckByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1UserApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesUsersUserWithRoleDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1UserApiArg = {
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1UserByPermissionApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesUsersUserWithRoleDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1UserByPermissionApiArg = {
  permissionKey?: string[];
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1UserAuthenticatedApiResponse =
  /** status 200 OK */ DomainEntitiesUsersUserWithRoleDto;
export type GetApiV1UserAuthenticatedApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1UserRoleByRoleIdApiResponse =
  /** status 200 OK */ DomainEntitiesUsersUserWithRoleDto[];
export type GetApiV1UserRoleByRoleIdApiArg = {
  roleId: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1UserByIdApiResponse = void;
export type PutApiV1UserByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesUsersRequestUpdateUserRequest: DomainEntitiesUsersRequestUpdateUserRequest;
};
export type DeleteApiV1UserByIdApiResponse = void;
export type DeleteApiV1UserByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1UserRoleByIdApiResponse = void;
export type PutApiV1UserRoleByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesRolesUpdateUserRoleRequest: DomainEntitiesRolesUpdateUserRoleRequest;
};
export type PostApiV1UserAvatarByIdApiResponse = void;
export type PostApiV1UserAvatarByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  sharedRequestsUploadFileRequest: SharedRequestsUploadFileRequest;
};
export type PostApiV1UserSignatureByIdApiResponse = void;
export type PostApiV1UserSignatureByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  sharedRequestsUploadFileRequest: SharedRequestsUploadFileRequest;
};
export type PutApiV1UserToggleDisableByIdApiResponse = void;
export type PutApiV1UserToggleDisableByIdApiArg = {
  id: string;
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
export type SharedDepartmentType = 0 | 1 | 2;
export type DomainEntitiesWarehousesWarehouseType = 0 | 1 | 2 | 3;
export type DomainEntitiesMaterialsMaterialKind = 0 | 1;
export type DomainEntitiesWarehousesRequestCreateWarehouseLocationShelfRequest =
  {
    code?: string | null;
    name?: string | null;
    description?: string | null;
  };
export type DomainEntitiesWarehousesRequestCreateWarehouseLocationRackRequest =
  {
    name?: string | null;
    description?: string | null;
    shelves?:
      | DomainEntitiesWarehousesRequestCreateWarehouseLocationShelfRequest[]
      | null;
  };
export type DomainEntitiesWarehousesRequestCreateWarehouseLocationRequest = {
  name?: string | null;
  floorName?: string | null;
  description?: string | null;
  racks?:
    DomainEntitiesWarehousesRequestCreateWarehouseLocationRackRequest[] | null;
};
export type DomainEntitiesWarehousesRequestCreateWarehouseRequest = {
  name?: string | null;
  description?: string | null;
  type?: DomainEntitiesWarehousesWarehouseType;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  locations?:
    DomainEntitiesWarehousesRequestCreateWarehouseLocationRequest[] | null;
};
export type DomainEntitiesProductsDivision = 0 | 1;
export type DomainEntitiesDepartmentsRequestCreateDepartmentRequest = {
  code?: string | null;
  name?: string | null;
  description?: string | null;
  type?: SharedDepartmentType;
  parentDepartmentId?: string | null;
  warehouses?: DomainEntitiesWarehousesRequestCreateWarehouseRequest[] | null;
  division?: DomainEntitiesProductsDivision;
};
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
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesDepartmentsDepartmentDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesDepartmentsDepartmentDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesPermissionsPermissionDetailDto = {
  key?: string | null;
  name?: string | null;
  description?: string | null;
  subModule?: string | null;
  hasOptions?: boolean;
  types?: string[] | null;
};
export type DomainEntitiesPermissionsPermissionModuleDto = {
  module?: string | null;
  isActive?: boolean;
  children?: DomainEntitiesPermissionsPermissionDetailDto[] | null;
};
export type DomainEntitiesPermissionsPermissionDto = {
  module?: string | null;
  subModule?: string | null;
  key?: string | null;
  name?: string | null;
  description?: string | null;
  hasOptions?: boolean;
  types?: string[] | null;
};
export type AppUtilsMenuItem = {
  name?: string | null;
  module?: string | null;
  requiredPermissionKey?: string[] | null;
  children?: AppUtilsMenuItem[] | null;
  icon?: string | null;
  route?: string | null;
  order?: number;
  isVisible?: boolean;
};
export type DomainEntitiesRolesRoleDto = {
  id?: string;
  name?: string | null;
  type?: SharedDepartmentType;
  displayName?: string | null;
  isManager?: boolean;
};
export type DomainEntitiesRolesCreateRoleRequest = {
  name: string;
  type?: SharedDepartmentType;
  permissions?: DomainEntitiesPermissionsPermissionModuleDto[] | null;
};
export type DomainEntitiesRolesRolePermissionDto = {
  id?: string;
  displayName?: string | null;
  name?: string | null;
  type?: SharedDepartmentType;
  isManager?: boolean;
  permissions?: DomainEntitiesPermissionsPermissionModuleDto[] | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRolesRolePermissionDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesRolesRolePermissionDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesRolesUpdateRoleRequest = {
  name: string;
  displayName: string;
  type?: SharedDepartmentType;
};
export type DomainEntitiesRolesRoleUsageDto = {
  hasUsers?: boolean;
};
export type DomainEntitiesUsersUserWithRoleDto = {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  isDisabled?: boolean;
  avatar?: string | null;
  createdAt?: string;
  signature?: string | null;
  department?: DomainEntitiesDepartmentsDepartmentListDto;
  roles?: DomainEntitiesRolesRoleDto[] | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesUsersUserWithRoleDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesUsersUserWithRoleDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesUsersRequestUpdateUserRequest = {
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  departmentId?: string | null;
  avatar?: string | null;
  roleName?: string | null;
};
export type DomainEntitiesRolesUpdateUserRoleRequest = {
  roleNames?: string[] | null;
};
export type SharedRequestsUploadFileRequest = {
  file?: string | null;
};
export const {
  usePostApiV1DepartmentMutation,
  useGetApiV1DepartmentQuery,
  useLazyGetApiV1DepartmentQuery,
  useGetApiV1DepartmentByDepartmentIdQuery,
  useLazyGetApiV1DepartmentByDepartmentIdQuery,
  usePutApiV1DepartmentByDepartmentIdMutation,
  useDeleteApiV1DepartmentByDepartmentIdMutation,
  useGetApiV1PermissionModulesQuery,
  useLazyGetApiV1PermissionModulesQuery,
  useGetApiV1PermissionQuery,
  useLazyGetApiV1PermissionQuery,
  useGetApiV1PermissionUserByUserIdQuery,
  useLazyGetApiV1PermissionUserByUserIdQuery,
  useGetApiV1PermissionRoleByRoleIdQuery,
  useLazyGetApiV1PermissionRoleByRoleIdQuery,
  usePutApiV1PermissionRoleByRoleIdMutation,
  useGetApiV1PermissionMenuQuery,
  useLazyGetApiV1PermissionMenuQuery,
  useGetApiV1RoleQuery,
  useLazyGetApiV1RoleQuery,
  usePostApiV1RoleMutation,
  useGetApiV1RoleWithPermissionsQuery,
  useLazyGetApiV1RoleWithPermissionsQuery,
  useGetApiV1RoleByIdQuery,
  useLazyGetApiV1RoleByIdQuery,
  usePutApiV1RoleByIdMutation,
  useDeleteApiV1RoleByIdMutation,
  useGetApiV1RoleCheckByIdQuery,
  useLazyGetApiV1RoleCheckByIdQuery,
  useGetApiV1UserQuery,
  useLazyGetApiV1UserQuery,
  useGetApiV1UserByPermissionQuery,
  useLazyGetApiV1UserByPermissionQuery,
  useGetApiV1UserAuthenticatedQuery,
  useLazyGetApiV1UserAuthenticatedQuery,
  useGetApiV1UserRoleByRoleIdQuery,
  useLazyGetApiV1UserRoleByRoleIdQuery,
  usePutApiV1UserByIdMutation,
  useDeleteApiV1UserByIdMutation,
  usePutApiV1UserRoleByIdMutation,
  usePostApiV1UserAvatarByIdMutation,
  usePostApiV1UserSignatureByIdMutation,
  usePutApiV1UserToggleDisableByIdMutation,
} = injectedRtkApi;
