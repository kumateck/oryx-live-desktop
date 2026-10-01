import { api } from "../base-api";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getApiV1ActivityLog: build.query<
      GetApiV1ActivityLogApiResponse,
      GetApiV1ActivityLogApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/activity-log`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          searchQuery: queryArg.searchQuery,
          pageSize: queryArg.pageSize,
          page: queryArg.page,
          sortLabel: queryArg.sortLabel,
          sortDirection: queryArg.sortDirection,
        },
      }),
    }),
    postApiV1Alert: build.mutation<
      PostApiV1AlertApiResponse,
      PostApiV1AlertApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/alert`,
        method: "POST",
        body: queryArg.domainEntitiesAlertsCreateAlertRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1Alert: build.query<GetApiV1AlertApiResponse, GetApiV1AlertApiArg>({
      query: (queryArg) => ({
        url: `/api/v1/alert`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          withDisabled: queryArg.withDisabled,
        },
      }),
    }),
    getApiV1AlertByAlertId: build.query<
      GetApiV1AlertByAlertIdApiResponse,
      GetApiV1AlertByAlertIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/alert/${queryArg.alertId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1AlertByAlertId: build.mutation<
      PutApiV1AlertByAlertIdApiResponse,
      PutApiV1AlertByAlertIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/alert/${queryArg.alertId}`,
        method: "PUT",
        body: queryArg.domainEntitiesAlertsCreateAlertRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1AlertByIdToggleDisable: build.mutation<
      PutApiV1AlertByIdToggleDisableApiResponse,
      PutApiV1AlertByIdToggleDisableApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/alert/${queryArg.id}/toggle-disable`,
        method: "PUT",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1AlertById: build.mutation<
      DeleteApiV1AlertByIdApiResponse,
      DeleteApiV1AlertByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/alert/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1AlertByIdMarkAsRead: build.mutation<
      PutApiV1AlertByIdMarkAsReadApiResponse,
      PutApiV1AlertByIdMarkAsReadApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/alert/${queryArg.id}/mark-as-read`,
        method: "PUT",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1AlertNotifications: build.query<
      GetApiV1AlertNotificationsApiResponse,
      GetApiV1AlertNotificationsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/alert/notifications`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          unreadOnly: queryArg.unreadOnly,
        },
      }),
    }),
    postApiV1Collection: build.mutation<
      PostApiV1CollectionApiResponse,
      PostApiV1CollectionApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/collection`,
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
    getApiV1CollectionByItemType: build.query<
      GetApiV1CollectionByItemTypeApiResponse,
      GetApiV1CollectionByItemTypeApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/collection/${queryArg.itemType}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          materialKind: queryArg.materialKind,
        },
      }),
    }),
    postApiV1CollectionByItemType: build.mutation<
      PostApiV1CollectionByItemTypeApiResponse,
      PostApiV1CollectionByItemTypeApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/collection/${queryArg.itemType}`,
        method: "POST",
        body: queryArg.domainEntitiesBaseCreateItemRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1CollectionItemTypes: build.query<
      GetApiV1CollectionItemTypesApiResponse,
      GetApiV1CollectionItemTypesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/collection/item-types`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1CollectionByItemTypeAndItemId: build.mutation<
      PutApiV1CollectionByItemTypeAndItemIdApiResponse,
      PutApiV1CollectionByItemTypeAndItemIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/collection/${queryArg.itemType}/${queryArg.itemId}`,
        method: "PUT",
        body: queryArg.domainEntitiesBaseCreateItemRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1CollectionByItemTypeAndItemId: build.mutation<
      DeleteApiV1CollectionByItemTypeAndItemIdApiResponse,
      DeleteApiV1CollectionByItemTypeAndItemIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/collection/${queryArg.itemType}/${queryArg.itemId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1CollectionPackageStyles: build.query<
      GetApiV1CollectionPackageStylesApiResponse,
      GetApiV1CollectionPackageStylesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/collection/package-styles`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1CollectionUom: build.mutation<
      PostApiV1CollectionUomApiResponse,
      PostApiV1CollectionUomApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/collection/uom`,
        method: "POST",
        body: queryArg.domainEntitiesBaseCreateUnitOfMeasure,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1CollectionUomPaginated: build.mutation<
      PostApiV1CollectionUomPaginatedApiResponse,
      PostApiV1CollectionUomPaginatedApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/collection/uom/paginated`,
        method: "POST",
        body: queryArg.domainEntitiesBaseFilterUnitOfMeasure,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1CollectionOperations: build.query<
      GetApiV1CollectionOperationsApiResponse,
      GetApiV1CollectionOperationsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/collection/operations`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    postApiV1CollectionUomByUomId: build.mutation<
      PostApiV1CollectionUomByUomIdApiResponse,
      PostApiV1CollectionUomByUomIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/collection/uom/${queryArg.uomId}`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1CollectionUomByUomId: build.mutation<
      PutApiV1CollectionUomByUomIdApiResponse,
      PutApiV1CollectionUomByUomIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/collection/uom/${queryArg.uomId}`,
        method: "PUT",
        body: queryArg.domainEntitiesBaseCreateUnitOfMeasure,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1CollectionUomByUomId: build.mutation<
      DeleteApiV1CollectionUomByUomIdApiResponse,
      DeleteApiV1CollectionUomByUomIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/collection/uom/${queryArg.uomId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1WorkingDays: build.query<
      GetApiV1WorkingDaysApiResponse,
      GetApiV1WorkingDaysApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/working-days`,
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
    postApiV1Configuration: build.mutation<
      PostApiV1ConfigurationApiResponse,
      PostApiV1ConfigurationApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/configuration`,
        method: "POST",
        body: queryArg.domainEntitiesConfigurationsCreateConfigurationRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1Configuration: build.query<
      GetApiV1ConfigurationApiResponse,
      GetApiV1ConfigurationApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/configuration`,
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
    getApiV1ConfigurationByConfigurationId: build.query<
      GetApiV1ConfigurationByConfigurationIdApiResponse,
      GetApiV1ConfigurationByConfigurationIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/configuration/${queryArg.configurationId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ConfigurationByConfigurationId: build.mutation<
      PutApiV1ConfigurationByConfigurationIdApiResponse,
      PutApiV1ConfigurationByConfigurationIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/configuration/${queryArg.configurationId}`,
        method: "PUT",
        body: queryArg.domainEntitiesConfigurationsCreateConfigurationRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ConfigurationByConfigurationId: build.mutation<
      DeleteApiV1ConfigurationByConfigurationIdApiResponse,
      DeleteApiV1ConfigurationByConfigurationIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/configuration/${queryArg.configurationId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ConfigurationByModelTypeByModelType: build.query<
      GetApiV1ConfigurationByModelTypeByModelTypeApiResponse,
      GetApiV1ConfigurationByModelTypeByModelTypeApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/configuration/by-model-type/${queryArg.modelType}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ConfigurationNamingTypes: build.query<
      GetApiV1ConfigurationNamingTypesApiResponse,
      GetApiV1ConfigurationNamingTypesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/configuration/naming-types`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ConfigurationByModelTypeCount: build.query<
      GetApiV1ConfigurationByModelTypeCountApiResponse,
      GetApiV1ConfigurationByModelTypeCountApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/configuration/${queryArg.modelType}/count`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          prefix: queryArg.prefix,
        },
      }),
    }),
    postApiV1ConfigurationThreshold: build.mutation<
      PostApiV1ConfigurationThresholdApiResponse,
      PostApiV1ConfigurationThresholdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/configuration/threshold`,
        method: "POST",
        body: queryArg.domainEntitiesThresholdsCreateThreshold,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ConfigurationThreshold: build.query<
      GetApiV1ConfigurationThresholdApiResponse,
      GetApiV1ConfigurationThresholdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/configuration/threshold`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1Countries: build.query<
      GetApiV1CountriesApiResponse,
      GetApiV1CountriesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/countries`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1FileByModelTypeAndModelIdReference: build.mutation<
      PostApiV1FileByModelTypeAndModelIdReferenceApiResponse,
      PostApiV1FileByModelTypeAndModelIdReferenceApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/file/${queryArg.modelType}/${queryArg.modelId}/${queryArg.reference}`,
        method: "POST",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1FileByModelTypeAndModelIdReference: build.query<
      GetApiV1FileByModelTypeAndModelIdReferenceApiResponse,
      GetApiV1FileByModelTypeAndModelIdReferenceApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/file/${queryArg.modelType}/${queryArg.modelId}/${queryArg.reference}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1FileByModelTypeAndModelId: build.mutation<
      PostApiV1FileByModelTypeAndModelIdApiResponse,
      PostApiV1FileByModelTypeAndModelIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/file/${queryArg.modelType}/${queryArg.modelId}`,
        method: "POST",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1FileByModelId: build.mutation<
      DeleteApiV1FileByModelIdApiResponse,
      DeleteApiV1FileByModelIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/file/${queryArg.modelId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1FileByModelIdAndReference: build.mutation<
      DeleteApiV1FileByModelIdAndReferenceApiResponse,
      DeleteApiV1FileByModelIdAndReferenceApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/file/${queryArg.modelId}/${queryArg.reference}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1FileByModelTypeAndReference: build.query<
      GetApiV1FileByModelTypeAndReferenceApiResponse,
      GetApiV1FileByModelTypeAndReferenceApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/file/${queryArg.modelType}/${queryArg.reference}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1Holidays: build.mutation<
      PostApiV1HolidaysApiResponse,
      PostApiV1HolidaysApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/holidays`,
        method: "POST",
        body: queryArg.domainEntitiesHolidaysCreateHolidayRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1Holidays: build.query<
      GetApiV1HolidaysApiResponse,
      GetApiV1HolidaysApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/holidays`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          searchQuery: queryArg.searchQuery,
        },
      }),
    }),
    getApiV1HolidaysById: build.query<
      GetApiV1HolidaysByIdApiResponse,
      GetApiV1HolidaysByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/holidays/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1HolidaysById: build.mutation<
      PutApiV1HolidaysByIdApiResponse,
      PutApiV1HolidaysByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/holidays/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesHolidaysCreateHolidayRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1HolidaysById: build.mutation<
      DeleteApiV1HolidaysByIdApiResponse,
      DeleteApiV1HolidaysByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/holidays/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1WorkingHoursPolicy: build.mutation<
      PostApiV1WorkingHoursPolicyApiResponse,
      PostApiV1WorkingHoursPolicyApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/working-hours-policy`,
        method: "POST",
        body: queryArg.domainEntitiesShiftAssignmentsCreateWorkingHoursPolicyRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1WorkingHoursPolicy: build.query<
      GetApiV1WorkingHoursPolicyApiResponse,
      GetApiV1WorkingHoursPolicyApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/working-hours-policy`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1WorkingHoursPolicyById: build.mutation<
      DeleteApiV1WorkingHoursPolicyByIdApiResponse,
      DeleteApiV1WorkingHoursPolicyByIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/working-hours-policy/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as settingsApi };
export type GetApiV1ActivityLogApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesActivityLogsActivityLogDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ActivityLogApiArg = {
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
  pageSize?: number;
  page?: number;
  sortLabel?: string;
  sortDirection?: SharedSortDirection;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1AlertApiResponse = /** status 200 OK */ string;
export type PostApiV1AlertApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesAlertsCreateAlertRequest: DomainEntitiesAlertsCreateAlertRequest;
};
export type GetApiV1AlertApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesAlertsAlertDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1AlertApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  withDisabled?: boolean;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1AlertByAlertIdApiResponse =
  /** status 200 OK */ DomainEntitiesAlertsAlertDto;
export type GetApiV1AlertByAlertIdApiArg = {
  alertId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1AlertByAlertIdApiResponse = void;
export type PutApiV1AlertByAlertIdApiArg = {
  alertId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesAlertsCreateAlertRequest: DomainEntitiesAlertsCreateAlertRequest;
};
export type PutApiV1AlertByIdToggleDisableApiResponse = void;
export type PutApiV1AlertByIdToggleDisableApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type DeleteApiV1AlertByIdApiResponse = void;
export type DeleteApiV1AlertByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1AlertByIdMarkAsReadApiResponse = void;
export type PutApiV1AlertByIdMarkAsReadApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1AlertNotificationsApiResponse =
  /** status 200 OK */ DomainEntitiesNotificationsNotificationDto[];
export type GetApiV1AlertNotificationsApiArg = {
  unreadOnly?: boolean;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1CollectionApiResponse = /** status 200 OK */ {
  [key: string]: SharedCollectionItemDto[];
};
export type PostApiV1CollectionApiArg = {
  /** The kind of material */
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The types of items to retrieve */
  body: string[];
};
export type GetApiV1CollectionByItemTypeApiResponse =
  /** status 200 OK */ SharedCollectionItemDto[];
export type GetApiV1CollectionByItemTypeApiArg = {
  /** The type of item to retrieve. */
  itemType: string;
  /** The kind of material */
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1CollectionByItemTypeApiResponse =
  /** status 201 Created */ string;
export type PostApiV1CollectionByItemTypeApiArg = {
  /** The type of item to create. */
  itemType: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateItemRequest object containing item details. */
  domainEntitiesBaseCreateItemRequest: DomainEntitiesBaseCreateItemRequest;
};
export type GetApiV1CollectionItemTypesApiResponse =
  /** status 200 OK */ string[];
export type GetApiV1CollectionItemTypesApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1CollectionByItemTypeAndItemIdApiResponse =
  /** status 200 OK */ string;
export type PutApiV1CollectionByItemTypeAndItemIdApiArg = {
  /** The ID of the item to update. */
  itemId: string;
  /** The type of item to update. */
  itemType: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The UpdateItemRequest object containing updated item details. */
  domainEntitiesBaseCreateItemRequest: DomainEntitiesBaseCreateItemRequest;
};
export type DeleteApiV1CollectionByItemTypeAndItemIdApiResponse =
  /** status 200 OK */ string;
export type DeleteApiV1CollectionByItemTypeAndItemIdApiArg = {
  /** The ID of the item to delete. */
  itemId: string;
  /** The type of item to delete. */
  itemType: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1CollectionPackageStylesApiResponse =
  /** status 200 OK */ DomainEntitiesBasePackageStyleDto[];
export type GetApiV1CollectionPackageStylesApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1CollectionUomApiResponse = void;
export type PostApiV1CollectionUomApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesBaseCreateUnitOfMeasure: DomainEntitiesBaseCreateUnitOfMeasure;
};
export type PostApiV1CollectionUomPaginatedApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesBaseUnitOfMeasureDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type PostApiV1CollectionUomPaginatedApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesBaseFilterUnitOfMeasure: DomainEntitiesBaseFilterUnitOfMeasure;
};
export type GetApiV1CollectionOperationsApiResponse =
  /** status 200 OK */ DomainEntitiesBaseOperationDto[];
export type GetApiV1CollectionOperationsApiArg = {
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1CollectionUomByUomIdApiResponse =
  /** status 200 OK */ DomainEntitiesBaseUnitOfMeasureDto;
export type PostApiV1CollectionUomByUomIdApiArg = {
  uomId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1CollectionUomByUomIdApiResponse = void;
export type PutApiV1CollectionUomByUomIdApiArg = {
  uomId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesBaseCreateUnitOfMeasure: DomainEntitiesBaseCreateUnitOfMeasure;
};
export type DeleteApiV1CollectionUomByUomIdApiResponse = void;
export type DeleteApiV1CollectionUomByUomIdApiArg = {
  uomId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1WorkingDaysApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesCompanyWorkingDaysCompanyWorkingDaysDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1WorkingDaysApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ConfigurationApiResponse =
  /** status 201 Created */ string;
export type PostApiV1ConfigurationApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The configuration creation request. */
  domainEntitiesConfigurationsCreateConfigurationRequest: DomainEntitiesConfigurationsCreateConfigurationRequest;
};
export type GetApiV1ConfigurationApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesConfigurationsConfigurationDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ConfigurationApiArg = {
  /** Page number of the pagination. */
  page?: number;
  /** Number of configurations per page. */
  pageSize?: number;
  /** Search query to filter configurations. */
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ConfigurationByConfigurationIdApiResponse =
  /** status 200 OK */ DomainEntitiesConfigurationsConfigurationDto;
export type GetApiV1ConfigurationByConfigurationIdApiArg = {
  /** The ID of the configuration to retrieve. */
  configurationId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ConfigurationByConfigurationIdApiResponse = void;
export type PutApiV1ConfigurationByConfigurationIdApiArg = {
  /** The ID of the configuration to update. */
  configurationId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The update request containing the new configuration data. */
  domainEntitiesConfigurationsCreateConfigurationRequest: DomainEntitiesConfigurationsCreateConfigurationRequest;
};
export type DeleteApiV1ConfigurationByConfigurationIdApiResponse = void;
export type DeleteApiV1ConfigurationByConfigurationIdApiArg = {
  /** The ID of the configuration to delete. */
  configurationId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ConfigurationByModelTypeByModelTypeApiResponse =
  /** status 200 OK */ DomainEntitiesConfigurationsConfigurationDto;
export type GetApiV1ConfigurationByModelTypeByModelTypeApiArg = {
  /** The modeltype of the configuration to retrieve. */
  modelType: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ConfigurationNamingTypesApiResponse =
  /** status 200 Returns the list of namning types */ SharedRequestsTypeResponse[];
export type GetApiV1ConfigurationNamingTypesApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ConfigurationByModelTypeCountApiResponse =
  /** status 200 OK */ number;
export type GetApiV1ConfigurationByModelTypeCountApiArg = {
  /** The model type of which the count is need */
  modelType: string;
  /** The prefix of the particular model */
  prefix?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ConfigurationThresholdApiResponse = void;
export type PostApiV1ConfigurationThresholdApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesThresholdsCreateThreshold: DomainEntitiesThresholdsCreateThreshold;
};
export type GetApiV1ConfigurationThresholdApiResponse =
  /** status 200 OK */ DomainEntitiesThresholdsThresholdDto;
export type GetApiV1ConfigurationThresholdApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1CountriesApiResponse =
  /** status 200 OK */ DomainEntitiesCountriesCountryDto[];
export type GetApiV1CountriesApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1FileByModelTypeAndModelIdReferenceApiResponse = void;
export type PostApiV1FileByModelTypeAndModelIdReferenceApiArg = {
  /** Type of the model to associate the file with. */
  modelType: string;
  /** ID of the model to associate the file with. */
  modelId: string;
  /** A reference to the specific file or attachment. */
  reference: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  body: {
    file?: Blob;
  };
};
export type GetApiV1FileByModelTypeAndModelIdReferenceApiResponse =
  /** status 200 OK */ Blob;
export type GetApiV1FileByModelTypeAndModelIdReferenceApiArg = {
  /** The type of the model (e.g., "Product", "User", etc.) where the file is associated. */
  modelType: string;
  /** The unique identifier of the model (e.g., product ID, user ID, etc.) to which the file is attached. */
  modelId: string;
  /** A reference name for the specific file (e.g., file name, document ID, etc.). */
  reference: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1FileByModelTypeAndModelIdApiResponse = void;
export type PostApiV1FileByModelTypeAndModelIdApiArg = {
  /** Type of the model to associate the file with. */
  modelType: string;
  /** ID of the model to associate the file with. */
  modelId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  body: {
    files?: Blob[];
  };
};
export type DeleteApiV1FileByModelIdApiResponse = void;
export type DeleteApiV1FileByModelIdApiArg = {
  /** The ID of the model to delete attachments for. */
  modelId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type DeleteApiV1FileByModelIdAndReferenceApiResponse = void;
export type DeleteApiV1FileByModelIdAndReferenceApiArg = {
  /** The ID of the attachment. */
  modelId: string;
  /** The reference of the attachment to delete. */
  reference: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1FileByModelTypeAndReferenceApiResponse =
  /** status 200 OK */ Blob;
export type GetApiV1FileByModelTypeAndReferenceApiArg = {
  /** The type of the model (e.g., "Product", "User", etc.) where the file is associated. */
  modelType: string;
  /** A reference name for the specific file (e.g., file name, document ID, etc.). */
  reference: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1HolidaysApiResponse = /** status 200 OK */ string;
export type PostApiV1HolidaysApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesHolidaysCreateHolidayRequest: DomainEntitiesHolidaysCreateHolidayRequest;
};
export type GetApiV1HolidaysApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesHolidaysHolidayDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1HolidaysApiArg = {
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1HolidaysByIdApiResponse =
  /** status 200 OK */ DomainEntitiesHolidaysHolidayDto;
export type GetApiV1HolidaysByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1HolidaysByIdApiResponse =
  /** status 204 No Content */ DomainEntitiesHolidaysHolidayDto;
export type PutApiV1HolidaysByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesHolidaysCreateHolidayRequest: DomainEntitiesHolidaysCreateHolidayRequest;
};
export type DeleteApiV1HolidaysByIdApiResponse = void;
export type DeleteApiV1HolidaysByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1WorkingHoursPolicyApiResponse =
  /** status 200 OK */ string;
export type PostApiV1WorkingHoursPolicyApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesShiftAssignmentsCreateWorkingHoursPolicyRequest: DomainEntitiesShiftAssignmentsCreateWorkingHoursPolicyRequest;
};
export type GetApiV1WorkingHoursPolicyApiResponse =
  /** status 200 OK */ DomainEntitiesShiftAssignmentsWorkingHoursPolicyDto[];
export type GetApiV1WorkingHoursPolicyApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type DeleteApiV1WorkingHoursPolicyByIdApiResponse = void;
export type DeleteApiV1WorkingHoursPolicyByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type DomainEntitiesUsersBsonUserDto = {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  createdAt?: string;
};
export type DomainEntitiesActivityLogsActionType = 0 | 1 | 2 | 3;
export type DomainEntitiesActivityLogsActivityLogDto = {
  user?: DomainEntitiesUsersBsonUserDto;
  action?: string | null;
  module?: string | null;
  subModule?: string | null;
  actionType?: DomainEntitiesActivityLogsActionType;
  ipAddress?: string | null;
  url?: string | null;
  httpMethod?: string | null;
  statusCode?: number;
  createdAt?: string;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesActivityLogsActivityLogDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesActivityLogsActivityLogDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type SharedSortDirection = 0 | 1 | 2;
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue | undefined };
export type MicrosoftAspNetCoreMvcProblemDetails = {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  [key: string]: JsonValue | undefined;
};
export type DomainEntitiesNotificationsNotificationType =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20;
export type DomainEntitiesAlertsAlertType = 0 | 1;
export type DomainEntitiesAlertsCreateAlertRequest = {
  title?: string | null;
  notificationType?: DomainEntitiesNotificationsNotificationType;
  alertTypes?: DomainEntitiesAlertsAlertType[] | null;
  timeFrame?: string;
  roleIds?: string[] | null;
  userIds?: string[] | null;
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
export type DomainEntitiesRolesRoleDto = {
  id?: string;
  name?: string | null;
  type?: SharedDepartmentType;
  displayName?: string | null;
  isManager?: boolean;
};
export type DomainEntitiesAlertsAlertDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  title?: string | null;
  notificationType?: DomainEntitiesNotificationsNotificationType;
  alertTypes?: DomainEntitiesAlertsAlertType[] | null;
  timeFrame?: string;
  roles?: DomainEntitiesRolesRoleDto[] | null;
  users?: DomainEntitiesUsersUserDto[] | null;
  isDisabled?: boolean;
  isConfigurable?: boolean;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesAlertsAlertDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesAlertsAlertDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesNotificationsNotificationDto = {
  id?: string;
  message?: string | null;
  type?: DomainEntitiesNotificationsNotificationType;
  recipients?: DomainEntitiesUsersUserDto[] | null;
  sentAt?: string;
};
export type DomainEntitiesMaterialsMaterialKind = 0 | 1;
export type DomainEntitiesBaseCreateItemRequest = {
  name?: string | null;
  description?: string | null;
  type?: string | null;
  isAvailable?: boolean;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  dueDays?: number | null;
};
export type DomainEntitiesBasePackageStyleDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesBaseUnitOfMeasureType = 0 | 1 | 2 | 3;
export type DomainEntitiesBaseUnitOfMeasureCategory = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesBaseCreateUnitOfMeasure = {
  name?: string | null;
  symbol?: string | null;
  description?: string | null;
  isScalable?: boolean;
  type?: DomainEntitiesBaseUnitOfMeasureType;
  category?: DomainEntitiesBaseUnitOfMeasureCategory;
};
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
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesBaseUnitOfMeasureDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesBaseUnitOfMeasureDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesBaseFilterUnitOfMeasure = {
  pageSize?: number;
  page?: number;
  sortLabel?: string | null;
  sortDirection?: SharedSortDirection;
  searchQuery?: string | null;
  types?: DomainEntitiesBaseUnitOfMeasureType[] | null;
  categories?: DomainEntitiesBaseUnitOfMeasureCategory[] | null;
};
export type DomainEntitiesBaseOperationDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  description?: string | null;
  order?: number;
};
export type SystemDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type DomainEntitiesCompanyWorkingDaysCompanyWorkingDaysDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  day?: SystemDayOfWeek;
  isWorkingDay?: boolean;
  startTime?: string | null;
  endTime?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesCompanyWorkingDaysCompanyWorkingDaysDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesCompanyWorkingDaysCompanyWorkingDaysDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesConfigurationsNamingType = 0 | 1 | 2;
export type DomainEntitiesConfigurationsCreateConfigurationRequest = {
  modelType?: string | null;
  prefix?: string | null;
  namingType?: DomainEntitiesConfigurationsNamingType;
  minimumNameLength?: number;
  maximumNameLength?: number;
};
export type DomainEntitiesConfigurationsConfigurationDto = {
  id?: string;
  modelType?: string | null;
  prefix?: string | null;
  namingType?: DomainEntitiesConfigurationsNamingType;
  minimumNameLength?: number;
  maximumNameLength?: number;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesConfigurationsConfigurationDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesConfigurationsConfigurationDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type SharedRequestsTypeResponse = {
  value?: number;
  name?: string | null;
};
export type DomainEntitiesThresholdsCreateThreshold = {
  storeThreshold?: number;
  memoThreshold?: number;
};
export type DomainEntitiesThresholdsThresholdDto = {
  id?: string;
  storeThreshold?: number;
  memoThreshold?: number;
};
export type DomainEntitiesCountriesCountryDto = {
  id?: string;
  name?: string | null;
  nationality?: string | null;
  code?: string | null;
};
export type DomainEntitiesHolidaysCreateHolidayRequest = {
  name: string;
  date: string;
  description?: string | null;
};
export type DomainEntitiesHolidaysHolidayDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  date?: string;
  description?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesHolidaysHolidayDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesHolidaysHolidayDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesShiftAssignmentsCreateWorkingHoursPolicyRequest = {
  maxHoursPerDay?: number;
  maxHoursPerWeek?: number;
  minDailyRestHours?: number;
  minWeeklyRestHours?: number;
  effectiveFrom?: string;
  effectiveTo?: string | null;
};
export type DomainEntitiesShiftAssignmentsWorkingHoursPolicyDto = {
  id?: string;
  maxHoursPerDay?: number;
  maxHoursPerWeek?: number;
  minDailyRestHours?: number;
  minWeeklyRestHours?: number;
  effectiveFrom?: string;
  effectiveTo?: string | null;
};
export const {
  useGetApiV1ActivityLogQuery,
  useLazyGetApiV1ActivityLogQuery,
  usePostApiV1AlertMutation,
  useGetApiV1AlertQuery,
  useLazyGetApiV1AlertQuery,
  useGetApiV1AlertByAlertIdQuery,
  useLazyGetApiV1AlertByAlertIdQuery,
  usePutApiV1AlertByAlertIdMutation,
  usePutApiV1AlertByIdToggleDisableMutation,
  useDeleteApiV1AlertByIdMutation,
  usePutApiV1AlertByIdMarkAsReadMutation,
  useGetApiV1AlertNotificationsQuery,
  useLazyGetApiV1AlertNotificationsQuery,
  usePostApiV1CollectionMutation,
  useGetApiV1CollectionByItemTypeQuery,
  useLazyGetApiV1CollectionByItemTypeQuery,
  usePostApiV1CollectionByItemTypeMutation,
  useGetApiV1CollectionItemTypesQuery,
  useLazyGetApiV1CollectionItemTypesQuery,
  usePutApiV1CollectionByItemTypeAndItemIdMutation,
  useDeleteApiV1CollectionByItemTypeAndItemIdMutation,
  useGetApiV1CollectionPackageStylesQuery,
  useLazyGetApiV1CollectionPackageStylesQuery,
  usePostApiV1CollectionUomMutation,
  usePostApiV1CollectionUomPaginatedMutation,
  useGetApiV1CollectionOperationsQuery,
  useLazyGetApiV1CollectionOperationsQuery,
  usePostApiV1CollectionUomByUomIdMutation,
  usePutApiV1CollectionUomByUomIdMutation,
  useDeleteApiV1CollectionUomByUomIdMutation,
  useGetApiV1WorkingDaysQuery,
  useLazyGetApiV1WorkingDaysQuery,
  usePostApiV1ConfigurationMutation,
  useGetApiV1ConfigurationQuery,
  useLazyGetApiV1ConfigurationQuery,
  useGetApiV1ConfigurationByConfigurationIdQuery,
  useLazyGetApiV1ConfigurationByConfigurationIdQuery,
  usePutApiV1ConfigurationByConfigurationIdMutation,
  useDeleteApiV1ConfigurationByConfigurationIdMutation,
  useGetApiV1ConfigurationByModelTypeByModelTypeQuery,
  useLazyGetApiV1ConfigurationByModelTypeByModelTypeQuery,
  useGetApiV1ConfigurationNamingTypesQuery,
  useLazyGetApiV1ConfigurationNamingTypesQuery,
  useGetApiV1ConfigurationByModelTypeCountQuery,
  useLazyGetApiV1ConfigurationByModelTypeCountQuery,
  usePostApiV1ConfigurationThresholdMutation,
  useGetApiV1ConfigurationThresholdQuery,
  useLazyGetApiV1ConfigurationThresholdQuery,
  useGetApiV1CountriesQuery,
  useLazyGetApiV1CountriesQuery,
  usePostApiV1FileByModelTypeAndModelIdReferenceMutation,
  useGetApiV1FileByModelTypeAndModelIdReferenceQuery,
  useLazyGetApiV1FileByModelTypeAndModelIdReferenceQuery,
  usePostApiV1FileByModelTypeAndModelIdMutation,
  useDeleteApiV1FileByModelIdMutation,
  useDeleteApiV1FileByModelIdAndReferenceMutation,
  useGetApiV1FileByModelTypeAndReferenceQuery,
  useLazyGetApiV1FileByModelTypeAndReferenceQuery,
  usePostApiV1HolidaysMutation,
  useGetApiV1HolidaysQuery,
  useLazyGetApiV1HolidaysQuery,
  useGetApiV1HolidaysByIdQuery,
  useLazyGetApiV1HolidaysByIdQuery,
  usePutApiV1HolidaysByIdMutation,
  useDeleteApiV1HolidaysByIdMutation,
  usePostApiV1WorkingHoursPolicyMutation,
  useGetApiV1WorkingHoursPolicyQuery,
  useLazyGetApiV1WorkingHoursPolicyQuery,
  useDeleteApiV1WorkingHoursPolicyByIdMutation,
} = injectedRtkApi;
